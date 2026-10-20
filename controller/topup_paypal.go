package controller

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting"
	"github.com/QuantumNous/new-api/setting/operation_setting"
	"github.com/QuantumNous/new-api/setting/system_setting"

	"github.com/gin-gonic/gin"
)

type PayPalPayRequest struct {
	Amount        int64  `json:"amount"`
	PaymentMethod string `json:"payment_method"`
	ReturnURL     string `json:"return_url,omitempty"`
	CancelURL     string `json:"cancel_url,omitempty"`
}

// 1. Get PayPal Access Token
func getPayPalAccessToken() (string, error) {
	apiURL := "https://api-m.sandbox.paypal.com/v1/oauth2/token"
	if setting.PayPalMode == "live" {
		apiURL = "https://api-m.paypal.com/v1/oauth2/token"
	}

	req, err := http.NewRequest("POST", apiURL, strings.NewReader("grant_type=client_credentials"))
	if err != nil {
		return "", err
	}
	req.SetBasicAuth(setting.PayPalClientId, setting.PayPalClientSecret)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("paypal token request returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var result map[string]interface{}
	if err := common.DecodeJson(resp.Body, &result); err != nil {
		return "", err
	}

	token, ok := result["access_token"].(string)
	if !ok {
		return "", fmt.Errorf("failed to extract access_token from response")
	}
	return token, nil
}

// 2. Fetch PayPal order details directly
func getPayPalOrder(orderID string) (map[string]interface{}, error) {
	token, err := getPayPalAccessToken()
	if err != nil {
		return nil, err
	}

	apiURL := "https://api-m.sandbox.paypal.com/v2/checkout/orders/" + orderID
	if setting.PayPalMode == "live" {
		apiURL = "https://api-m.paypal.com/v2/checkout/orders/" + orderID
	}

	req, err := http.NewRequest("GET", apiURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result map[string]interface{}
	if err := common.DecodeJson(resp.Body, &result); err != nil {
		return nil, err
	}
	return result, nil
}

// 3. Request amount calculation
func RequestPayPalAmount(c *gin.Context) {
	var req PayPalPayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	minTopup := getPayPalMinTopup()
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

	payMoney := getPayPalPayMoney(float64(req.Amount), group)
	if payMoney <= 0.01 {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "充值金额过低"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": strconv.FormatFloat(payMoney, 'f', 2, 64)})
}

// 4. Create Order & Redirect to PayPal Approve URL
func RequestPayPalPay(c *gin.Context) {
	var req PayPalPayRequest
	err := c.ShouldBindJSON(&req)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "参数错误"})
		return
	}

	if req.PaymentMethod != model.PaymentMethodPayPal {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "不支持的支付渠道"})
		return
	}

	minTopup := getPayPalMinTopup()
	if req.Amount < minTopup {
		c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("充值数量不能小于 %d", minTopup), "data": 10})
		return
	}

	if req.Amount > 1000000 {
		c.JSON(http.StatusOK, gin.H{"message": "充值数量过大", "data": 10})
		return
	}

	if req.ReturnURL != "" && common.ValidateRedirectURL(req.ReturnURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付成功重定向URL不在可信任域名列表中", "data": ""})
		return
	}

	if req.CancelURL != "" && common.ValidateRedirectURL(req.CancelURL) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "支付取消重定向URL不在可信任域名列表中", "data": ""})
		return
	}

	id := c.GetInt("id")
	_, err = model.GetUserById(id, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "用户未找到"})
		return
	}

	group, err := model.GetUserGroup(id, true)
	if err != nil {
		group = "default"
	}
	payMoney := getPayPalPayMoney(float64(req.Amount), group)

	token, err := getPayPalAccessToken()
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 获取 access token 失败: %s", err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "拉起支付失败"})
		return
	}

	serverAddress := system_setting.ServerAddress
	if serverAddress == "" {
		serverAddress = c.Request.Header.Get("Origin")
	}
	if !strings.HasPrefix(serverAddress, "http://") && !strings.HasPrefix(serverAddress, "https://") {
		serverAddress = "https://" + serverAddress
	}

	finalReturnURL := req.ReturnURL
	if finalReturnURL == "" {
		finalReturnURL = serverAddress + "/wallet/paypal-callback"
	}
	finalCancelURL := req.CancelURL
	if finalCancelURL == "" {
		finalCancelURL = serverAddress + "/wallet"
	}

	apiURL := "https://api-m.sandbox.paypal.com/v2/checkout/orders"
	if setting.PayPalMode == "live" {
		apiURL = "https://api-m.paypal.com/v2/checkout/orders"
	}

	orderData := map[string]interface{}{
		"intent": "CAPTURE",
		"purchase_units": []map[string]interface{}{
			{
				"amount": map[string]interface{}{
					"currency_code": "USD",
					"value":         fmt.Sprintf("%.2f", payMoney),
				},
				"description": fmt.Sprintf("Topup user %d", id),
			},
		},
		"application_context": map[string]interface{}{
			"brand_name": "APIVEL",
			"landing_page": "LOGIN",
			"user_action": "PAY_NOW",
			"return_url": finalReturnURL,
			"cancel_url": finalCancelURL,
		},
	}

	jsonData, err := common.Marshal(orderData)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "订单序列化失败"})
		return
	}

	reqOrder, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建 PayPal 请求失败"})
		return
	}
	reqOrder.Header.Set("Authorization", "Bearer "+token)
	reqOrder.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	respOrder, err := client.Do(reqOrder)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 订单 API 请求失败: %s", err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "与 PayPal 通信失败"})
		return
	}
	defer respOrder.Body.Close()

	if respOrder.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(respOrder.Body)
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 订单创建失败 status=%d body=%s", respOrder.StatusCode, string(bodyBytes)))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "PayPal 拒接创建订单"})
		return
	}

	var orderResult map[string]interface{}
	if err := common.DecodeJson(respOrder.Body, &orderResult); err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "解析 PayPal 响应失败"})
		return
	}

	paypalOrderID, _ := orderResult["id"].(string)
	if paypalOrderID == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "无效的 PayPal 订单ID"})
		return
	}

	var approvalURL string
	if links, ok := orderResult["links"].([]interface{}); ok {
		for _, linkVal := range links {
			if linkMap, ok := linkVal.(map[string]interface{}); ok {
				if linkMap["rel"] == "approve" {
					approvalURL, _ = linkMap["href"].(string)
					break
				}
			}
		}
	}

	if approvalURL == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "未找到 PayPal 审批链接"})
		return
	}

	// 自动作废该用户此前未支付的 pending 订单，防止因切换面额或渠道堆积误触发风控
	service.CancelUserPendingTopUps(c.Request.Context(), id)

	topUp := &model.TopUp{
		UserId:          id,
		Amount:          req.Amount,
		Money:           payMoney,
		TradeNo:         paypalOrderID,
		PaymentMethod:   model.PaymentMethodPayPal,
		PaymentProvider: model.PaymentProviderPayPal,
		CreateTime:      time.Now().Unix(),
		Status:          common.TopUpStatusPending,
	}
	service.FillTopUpPaymentEnv(c, topUp)
	err = topUp.Insert()
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("PayPal 写入充值记录失败 user_id=%d order_id=%s amount=%d error=%q", id, paypalOrderID, req.Amount, err.Error()))
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "创建本地订单失败"})
		return
	}

	logger.LogInfo(c.Request.Context(), fmt.Sprintf("PayPal 订单创建成功 user_id=%d order_id=%s amount=%d money=%.2f", id, paypalOrderID, req.Amount, payMoney))

	c.JSON(http.StatusOK, gin.H{
		"message": "success",
		"data": gin.H{
			"pay_link": approvalURL,
		},
	})
}

// ProcessAndCapturePayPalOrder captures an authorized PayPal order and credits the user.
// It is thread-safe and idempotent.
func ProcessAndCapturePayPalOrder(orderID string, callerIP string) error {
	LockOrder(orderID)
	defer UnlockOrder(orderID)
	return processAndCapturePayPalOrderInternal(orderID, callerIP)
}

func processAndCapturePayPalOrderInternal(orderID string, callerIP string) error {
	paypalOrder, err := getPayPalOrder(orderID)
	if err != nil {
		return fmt.Errorf("failed to fetch paypal order: %w", err)
	}

	orderStatus, _ := paypalOrder["status"].(string)
	if orderStatus == "COMPLETED" {
		return model.RechargePayPal(orderID, callerIP)
	}

	if orderStatus == "APPROVED" {
		token, err := getPayPalAccessToken()
		if err != nil {
			return fmt.Errorf("failed to get paypal access token: %w", err)
		}

		apiURL := "https://api-m.sandbox.paypal.com/v2/checkout/orders/" + orderID + "/capture"
		if setting.PayPalMode == "live" {
			apiURL = "https://api-m.paypal.com/v2/checkout/orders/" + orderID + "/capture"
		}

		req, err := http.NewRequest("POST", apiURL, nil)
		if err != nil {
			return fmt.Errorf("failed to create capture request: %w", err)
		}
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		client := &http.Client{Timeout: 15 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			return fmt.Errorf("paypal capture request failed: %w", err)
		}
		defer resp.Body.Close()

		var result map[string]interface{}
		if err := common.DecodeJson(resp.Body, &result); err != nil {
			return fmt.Errorf("failed to parse capture response: %w", err)
		}

		status, _ := result["status"].(string)
		if status == "COMPLETED" {
			return model.RechargePayPal(orderID, callerIP)
		}

		// Double check order status from PayPal to handle eventual consistency
		paypalOrder, err = getPayPalOrder(orderID)
		if err == nil && paypalOrder != nil && paypalOrder["status"] == "COMPLETED" {
			return model.RechargePayPal(orderID, callerIP)
		}

		return fmt.Errorf("paypal capture failed with status: %s", status)
	}

	return fmt.Errorf("paypal order is in uncapturable status: %s", orderStatus)
}

// 5. Capture Payment
func CapturePayPalOrder(c *gin.Context) {
	orderID := c.Query("order_id")
	if orderID == "" {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": "缺少 order_id 参数"})
		return
	}

	err := ProcessAndCapturePayPalOrder(orderID, c.ClientIP())
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "error", "data": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "success", "data": "付款已成功捕获"})
}

// 6. Webhook Endpoint
func PayPalWebhook(c *gin.Context) {
	ctx := c.Request.Context()
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	var event map[string]interface{}
	if err := common.Unmarshal(payload, &event); err != nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	eventType, _ := event["event_type"].(string)
	if eventType == "PAYMENT.CAPTURE.COMPLETED" {
		var orderID string
		// Extract orderID from resource.supplementary_data.related_ids.order_id
		if resource, ok := event["resource"].(map[string]interface{}); ok {
			if supp, ok := resource["supplementary_data"].(map[string]interface{}); ok {
				if related, ok := supp["related_ids"].(map[string]interface{}); ok {
					orderID, _ = related["order_id"].(string)
				}
			}
			// Fallback: sometimes Braintree or other PayPal configurations pass it elsewhere
			if orderID == "" {
				if customID, ok := resource["custom_id"].(string); ok {
					orderID = customID
				}
			}
		}

		if orderID == "" {
			logger.LogWarn(ctx, "PayPal webhook did not contain valid order_id")
			c.AbortWithStatus(http.StatusOK)
			return
		}

		err := ProcessAndCapturePayPalOrder(orderID, c.ClientIP())
		if err != nil {
			logger.LogError(ctx, fmt.Sprintf("PayPal webhook recharge failed for order %s: %s", orderID, err.Error()))
		} else {
			logger.LogInfo(ctx, fmt.Sprintf("PayPal webhook successfully recharged order %s", orderID))
		}
	} else if eventType == "CHECKOUT.ORDER.APPROVED" {
		var orderID string
		if resource, ok := event["resource"].(map[string]interface{}); ok {
			if idStr, ok := resource["id"].(string); ok {
				orderID = idStr
			}
		}

		if orderID == "" {
			logger.LogWarn(ctx, "PayPal webhook CHECKOUT.ORDER.APPROVED did not contain valid order_id")
			c.AbortWithStatus(http.StatusOK)
			return
		}

		logger.LogInfo(ctx, fmt.Sprintf("PayPal webhook received CHECKOUT.ORDER.APPROVED for order %s, auto-capturing...", orderID))
		err := ProcessAndCapturePayPalOrder(orderID, c.ClientIP())
		if err != nil {
			logger.LogError(ctx, fmt.Sprintf("PayPal webhook auto-capture failed for order %s: %s", orderID, err.Error()))
		} else {
			logger.LogInfo(ctx, fmt.Sprintf("PayPal webhook successfully auto-captured and recharged order %s", orderID))
		}
	}

	c.Status(http.StatusOK)
}

func getPayPalPayMoney(amount float64, group string) float64 {
	originalAmount := amount
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		amount = amount / common.QuotaPerUnit
	}
	topupGroupRatio := common.GetTopupGroupRatio(group)
	if topupGroupRatio == 0 {
		topupGroupRatio = 1
	}
	discount := 1.0
	if ds, ok := operation_setting.GetPaymentSetting().AmountDiscount[int(originalAmount)]; ok {
		if ds > 0 {
			discount = ds
		}
	}
	payMoney := amount * setting.PayPalUnitPrice * topupGroupRatio * discount
	return payMoney
}

func getPayPalMinTopup() int64 {
	minTopup := setting.PayPalMinTopUp
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		minTopup = minTopup * int(common.QuotaPerUnit)
	}
	return int64(minTopup)
}
