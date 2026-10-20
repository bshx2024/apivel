package controller

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"github.com/thanhpk/randstr"
)

var subotizAdaptor = &SubotizAdaptor{}

func generateSubotizSignature(timestamp string, body []byte, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp))
	mac.Write([]byte("."))
	mac.Write(body)
	return hex.EncodeToString(mac.Sum(nil))
}

func verifySubotizSignature(timestamp string, body []byte, signature string, secret string) bool {
	if setting.SubotizTestMode {
		logger.LogInfo(context.Background(), fmt.Sprintf("Subotiz webhook 验签在测试模式下放行 timestamp=%s signature=%s", timestamp, signature))
		return true
	}
	if secret == "" {
		logger.LogWarn(context.Background(), "Subotiz webhook 验签失败: 未配置 SubotizApiKey")
		return false
	}
	expected := generateSubotizSignature(timestamp, body, secret)
	return hmac.Equal([]byte(strings.ToLower(signature)), []byte(strings.ToLower(expected)))
}

type SubotizProduct struct {
	ProductId string  `json:"productId"`
	PriceId   string  `json:"priceId"`
	Name      string  `json:"name"`
	Price     float64 `json:"price"`
	Currency  string  `json:"currency"`
	Quota     int64   `json:"quota"`
}

type SubotizPayRequest struct {
	Amount        int64  `json:"amount"`
	ProductId     string `json:"product_id"`
	PriceId       string `json:"price_id"`
	PaymentMethod string `json:"payment_method"`
}

type SubotizAdaptor struct{}

func (*SubotizAdaptor) RequestPay(c *gin.Context, req *SubotizPayRequest) {
	if req.PaymentMethod != model.PaymentMethodSubotiz {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}

	if !isSubotizTopUpEnabled() {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "Subotiz 支付暂未启用"})
		return
	}

	id := c.GetInt("id")
	user, err := model.GetUserById(id, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户不存在"})
		return
	}

	// 支付风控拦截 (防高频试卡与未完成订单堆积)
	if allowed, reason := service.CheckPaymentAllowed(c.Request.Context(), id); !allowed {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": reason})
		return
	}

	var selectedProduct *SubotizProduct
	var priceId string
	var quotaAmount int64
	var payMoney float64

	// 如果配置了产品列表，优先匹配产品
	if strings.TrimSpace(setting.SubotizProducts) != "" && setting.SubotizProducts != "[]" {
		var products []SubotizProduct
		if err := common.UnmarshalJsonStr(setting.SubotizProducts, &products); err == nil && len(products) > 0 {
			for _, p := range products {
				if (req.ProductId != "" && p.ProductId == req.ProductId) || (req.PriceId != "" && p.PriceId == req.PriceId) {
					selectedProduct = &p
					break
				}
			}
		}
	}

	if selectedProduct != nil {
		priceId = selectedProduct.PriceId
		quotaAmount = selectedProduct.Quota
		payMoney = selectedProduct.Price
	} else {
		// 动态金额模式
		if req.Amount < getSubotizMinTopup() {
			c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", getSubotizMinTopup())})
			return
		}
		group, err := model.GetUserGroup(id, true)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
			return
		}
		payMoney = getSubotizPayMoney(req.Amount, group)
		if payMoney < 0.01 {
			c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
			return
		}
		quotaAmount = normalizeSubotizTopUpAmount(req.Amount)
		if req.PriceId != "" {
			priceId = req.PriceId
		}
	}

	// 自动作废该用户此前未支付的 pending 订单，防止因切换面额或渠道堆积误触发风控
	service.CancelUserPendingTopUps(c.Request.Context(), id)

	tradeNo := fmt.Sprintf("subotiz_%d_%d_%s", user.Id, time.Now().UnixMilli(), randstr.String(4))

	topUp := &model.TopUp{
		UserId:          id,
		Amount:          quotaAmount,
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodSubotiz,
		PaymentProvider: model.PaymentProviderSubotiz,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	service.FillTopUpPaymentEnv(c, topUp)
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz 创建充值订单记录失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建订单失败"})
		return
	}

	checkoutUrl, err := createSubotizCheckoutSession(c.Request.Context(), tradeNo, priceId, payMoney, user.Id, user.Email, user.Username)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz 创建 Checkout Session 失败 user_id=%d trade_no=%s error=%q", id, tradeNo, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建结账会话失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"checkout_url": checkoutUrl,
			"order_id":     tradeNo,
		},
	})
}

func RequestSubotizPay(c *gin.Context) {
	var req SubotizPayRequest
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz 支付请求读取失败 error=%q", err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "read query error"})
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewReader(bodyBytes))

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}
	subotizAdaptor.RequestPay(c, &req)
}

func RequestSubotizAmount(c *gin.Context) {
	var req SubotizPayRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	minTopup := getSubotizMinTopup()
	if req.Amount < minTopup {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": fmt.Sprintf("充值数量不能小于 %d", minTopup)})
		return
	}

	id := c.GetInt("id")
	group, err := model.GetUserGroup(id, true)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "获取用户分组失败"})
		return
	}

	payMoney := getSubotizPayMoney(req.Amount, group)
	if payMoney <= 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": fmt.Sprintf("%.2f", payMoney)})
}

func getSubotizPayMoney(amount int64, group string) float64 {
	dAmount := decimal.NewFromInt(amount)
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		dAmount = dAmount.Div(decimal.NewFromFloat(common.QuotaPerUnit))
	}

	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}

	unitPrice := setting.SubotizUnitPrice
	if unitPrice <= 0 {
		unitPrice = 1.0
	}

	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(amount)]; ok && ds > 0 {
		discount = ds
	}

	payMoney := dAmount.
		Mul(decimal.NewFromFloat(unitPrice)).
		Mul(decimal.NewFromFloat(topupGroupRatio)).
		Mul(decimal.NewFromFloat(discount))

	return payMoney.InexactFloat64()
}

func getSubotizMinTopup() int64 {
	minTopup := setting.SubotizMinTopUp
	if minTopup <= 0 {
		minTopup = 1
	}
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}

func normalizeSubotizTopUpAmount(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}

	normalized := decimal.NewFromInt(amount).
		Div(decimal.NewFromFloat(common.QuotaPerUnit)).
		IntPart()
	if normalized < 1 {
		return 1
	}
	return normalized
}

func createSubotizCheckoutSession(ctx context.Context, tradeNo string, priceId string, payMoney float64, userId int, email string, username string) (string, error) {
	if strings.TrimSpace(setting.SubotizApiKey) == "" {
		return "", errors.New("未配置 Subotiz API Key")
	}

	serverUrl := service.GetCallbackAddress()
	returnUrl := fmt.Sprintf("%s/console/wallet", serverUrl)
	if strings.TrimSpace(setting.SubotizReturnUrl) != "" {
		returnUrl = setting.SubotizReturnUrl
	}
	cancelUrl := returnUrl

	if email == "" {
		email = fmt.Sprintf("%s@apivel.com", username)
	}

	reqPayload := map[string]any{
		"order_id":           tradeNo,
		"payer_id":           fmt.Sprintf("user_%d", userId),
		"email":              email,
		"integration_method": "hosted",
		"return_url":         returnUrl,
		"cancel_url":         cancelUrl,
		"metadata": map[string]string{
			"username": username,
			"trade_no": tradeNo,
		},
	}

	if strings.TrimSpace(setting.SubotizAccessNo) != "" {
		reqPayload["access_no"] = setting.SubotizAccessNo
	}
	if strings.TrimSpace(setting.SubotizMerchantId) != "" {
		reqPayload["sub_merchant_id"] = setting.SubotizMerchantId
	}

	if priceId != "" {
		reqPayload["mode"] = "checkout"
		reqPayload["line_items"] = []map[string]string{
			{
				"price_id": priceId,
				"quantity": "1",
			},
		}
	} else {
		reqPayload["mode"] = "payment"
		reqPayload["total_amount"] = fmt.Sprintf("%.2f", payMoney)
	}

	jsonData, err := common.Marshal(reqPayload)
	if err != nil {
		return "", fmt.Errorf("序列化请求数据失败: %w", err)
	}

	baseUrl := strings.TrimRight(setting.SubotizApiUrl, "/")
	if baseUrl == "" {
		baseUrl = "https://api.subotiz.com"
	}
	endpoint := fmt.Sprintf("%s/api/v1/session", baseUrl)

	httpReq, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewReader(jsonData))
	if err != nil {
		return "", fmt.Errorf("构建 HTTP 请求失败: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+strings.TrimSpace(setting.SubotizApiKey))
	httpReq.Header.Set("Request-Id", uuid.New().String())

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return "", fmt.Errorf("请求 Subotiz 接口失败: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("读取 Subotiz 响应失败: %w", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		logger.LogError(ctx, fmt.Sprintf("Subotiz 创建 session 接口返回异常状态码=%d body=%s", resp.StatusCode, string(respBody)))
		return "", fmt.Errorf("Subotiz 接口响应异常 HTTP %d", resp.StatusCode)
	}

	var res struct {
		Code    string `json:"code"`
		Message string `json:"message"`
		Data    struct {
			SessionId  string `json:"session_id"`
			SessionUrl string `json:"session_url"`
		} `json:"data"`
	}

	if err := common.Unmarshal(respBody, &res); err != nil {
		return "", fmt.Errorf("解析 Subotiz 响应 JSON 失败: %w", err)
	}

	if res.Data.SessionUrl != "" {
		return res.Data.SessionUrl, nil
	}

	return "", fmt.Errorf("未获取到结账页链接: code=%s msg=%s", res.Code, res.Message)
}

type SubotizWebhookEvent struct {
	Id      any    `json:"id"`
	Type    string `json:"type"`
	Created string `json:"created"`
	Data    struct {
		TradeId     string `json:"trade_id"`
		OrderId     string `json:"order_id"`
		Amount      string `json:"amount"`
		Currency    string `json:"currency"`
		TradeStatus string `json:"trade_status"`
		CustomerId  string `json:"customer_id"`
		SessionId   string `json:"session_id"`
		Email       string `json:"email"`
	} `json:"data"`
}

func SubotizWebhook(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz Webhook 读取 body 失败 error=%q", err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"error": "read body error"})
		return
	}

	timestamp := c.GetHeader("X-Timestamp")
	signature := c.GetHeader("X-Signature")

	var event SubotizWebhookEvent
	if err := common.Unmarshal(bodyBytes, &event); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz Webhook 解析 JSON 失败 body=%s error=%q", string(bodyBytes), err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid json"})
		return
	}

	// 1. 端点连通性测试 (Subotiz 后台添加端点时触发)
	if event.Type == "check_callback_url" {
		logger.LogInfo(c.Request.Context(), "Subotiz check_callback_url 端点可用性检查通过")
		c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "endpoint available"})
		return
	}

	// 2. 验签
	if !verifySubotizSignature(timestamp, bodyBytes, signature, setting.SubotizApiKey) {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("Subotiz Webhook 验签未通过 timestamp=%s signature=%s", timestamp, signature))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "signature verification failed"})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("Subotiz Webhook 收到事件 type=%s order_id=%s trade_id=%s status=%s",
		event.Type, event.Data.OrderId, event.Data.TradeId, event.Data.TradeStatus))

	// 3. 处理支付事件
	switch event.Type {
	case "v2.trades.succeeded", "trades.succeeded", "payment.success":
		orderId := event.Data.OrderId
		if orderId == "" {
			logger.LogWarn(c.Request.Context(), "Subotiz Webhook 事件中未包含 order_id")
			c.JSON(http.StatusOK, gin.H{"status": "ignored", "reason": "missing order_id"})
			return
		}

		if err := model.RechargeSubotiz(orderId, c.ClientIP(), event.Data.Email); err != nil {
			logger.LogError(c.Request.Context(), fmt.Sprintf("Subotiz 订单履约失败 order_id=%s error=%q", orderId, err.Error()))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "recharge failed: " + err.Error()})
			return
		}
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("Subotiz 充值订单履约成功 order_id=%s", orderId))

		// 支付成功重置风控失败计数与冷却
		if topUp := model.GetTopUpByTradeNo(orderId); topUp != nil {
			service.ResetPaymentFailure(c.Request.Context(), topUp.UserId)
		}

	case "v2.trades.payment_failed", "trades.payment_failed", "payment.failed":
		orderId := event.Data.OrderId
		if orderId == "" {
			logger.LogWarn(c.Request.Context(), "Subotiz 支付失败事件中未包含 order_id")
			c.JSON(http.StatusOK, gin.H{"status": "ignored", "reason": "missing order_id"})
			return
		}

		topUp := model.GetTopUpByTradeNo(orderId)
		if topUp != nil {
			_ = model.UpdatePendingTopUpStatus(orderId, model.PaymentProviderSubotiz, common.TopUpStatusFailed)
			service.RecordPaymentFailure(c.Request.Context(), topUp.UserId, orderId, event.Data.TradeStatus)
			logger.LogWarn(c.Request.Context(), fmt.Sprintf("Subotiz 订单支付失败已记录并流转状态 order_id=%s user_id=%d status=%s",
				orderId, topUp.UserId, event.Data.TradeStatus))
		} else {
			logger.LogWarn(c.Request.Context(), fmt.Sprintf("Subotiz 支付失败事件未匹配到本地订单 order_id=%s", orderId))
		}

	default:
		logger.LogInfo(c.Request.Context(), fmt.Sprintf("Subotiz 未关注事件已忽略 type=%s", event.Type))
	}

	c.JSON(http.StatusOK, gin.H{"code": 0, "message": "success"})
}
