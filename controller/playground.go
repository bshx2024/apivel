package controller

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var publicInMemoryRateLimiter common.InMemoryRateLimiter

func PublicPlayground(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	// 1. IP Rate Limiting (5 requests per 24 hours per IP)
	var allowed bool
	maxRequests := 5
	duration := int64(86400) // 24 hours
	mark := "publicPlayground:"
	timeFormat := "2006-01-02T15:04:05.000Z"

	if common.RedisEnabled {
		ctx := context.Background()
		rdb := common.RDB
		key := "rateLimit:" + mark + c.ClientIP()
		listLength, err := rdb.LLen(ctx, key).Result()
		if err != nil {
			common.SysLog("public playground rate limit error: " + err.Error())
			allowed = true // Fallback
		} else {
			if listLength < int64(maxRequests) {
				rdb.LPush(ctx, key, time.Now().Format(timeFormat))
				rdb.Expire(ctx, key, 24*time.Hour)
				allowed = true
			} else {
				oldTimeStr, _ := rdb.LIndex(ctx, key, -1).Result()
				oldTime, err := time.Parse(timeFormat, oldTimeStr)
				if err != nil {
					allowed = true
				} else {
					if time.Since(oldTime).Seconds() < float64(duration) {
						allowed = false
					} else {
						rdb.LPush(ctx, key, time.Now().Format(timeFormat))
						rdb.LTrim(ctx, key, 0, int64(maxRequests-1))
						rdb.Expire(ctx, key, 24*time.Hour)
						allowed = true
					}
				}
			}
		}
	} else {
		publicInMemoryRateLimiter.Init(24 * time.Hour)
		allowed = publicInMemoryRateLimiter.Request(mark+c.ClientIP(), maxRequests, duration)
	}

	if !allowed {
		c.JSON(http.StatusTooManyRequests, gin.H{
			"error": gin.H{
				"message": "You have reached the limit of 5 free queries on the homepage. Please sign up to claim 100,000 free tokens!",
				"type":    "rate_limit_error",
				"param":   "",
				"code":    "rate_limit_exceeded",
			},
		})
		c.Abort()
		return
	}

	// 2. Read and restore body to validate model
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
		return
	}
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var req map[string]interface{}
	if err := common.Unmarshal(bodyBytes, &req); err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
		return
	}

	modelVal, _ := req["model"].(string)
	modelMapping := map[string]string{
		"deepseek-v4.1-flash":         "deepseek-v4.1-flash",
		"deepseek-v4-flash":           "deepseek-v4.1-flash",
		"deepseek-flash":              "deepseek-v4.1-flash",
		"sensenova/deepseek-v4-flash": "deepseek-v4.1-flash",
		"qwen3.8-flash":               "qwen3.8-flash",
		"qwen-3.8-flash":              "qwen3.8-flash",
		"qwen-flash":                  "qwen3.8-flash",
		"glm-5.3-flash":               "glm-5.3-flash",
		"glm-5.3-flashx":              "glm-5.3-flash",
		"glm-flash":                   "glm-5.3-flash",
	}

	targetModel, ok := modelMapping[modelVal]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": gin.H{
				"message": "Only deepseek-v4.1-flash, qwen3.8-flash, and glm-5.3-flash models are allowed in public demo.",
				"type":    "invalid_request_error",
				"param":   "model",
				"code":    "model_not_allowed",
			},
		})
		c.Abort()
		return
	}

	req["model"] = targetModel
	if isStream, _ := req["stream"].(bool); isStream {
		if req["stream_options"] == nil {
			req["stream_options"] = map[string]interface{}{"include_usage": true}
		}
	}
	updatedBodyBytes, _ := common.Marshal(req)
	c.Request.Body = io.NopCloser(bytes.NewBuffer(updatedBodyBytes))
	c.Request.ContentLength = int64(len(updatedBodyBytes))

	// 3. Find or create guest user
	var guestUser model.User
	err = model.DB.Where("username = ?", "guest").First(&guestUser).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			guestUser = model.User{
				Username:    "guest",
				Password:    "guest-password-cannot-be-used-directly-123456",
				Role:        common.RoleCommonUser,
				Status:      common.UserStatusEnabled,
				DisplayName: "Guest User",
				Quota:       100000000, // Large quota, as it's system-managed
				Group:       "default",
			}
			if err := model.DB.Create(&guestUser).Error; err != nil {
				newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
				return
			}
		} else {
			newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
			return
		}
	}

	if guestUser.Status != common.UserStatusEnabled {
		newAPIError = types.NewError(errors.New("guest user is banned"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	// 4. Find or create guest token
	var guestToken model.Token
	err = model.DB.Where("user_id = ? AND name = ?", guestUser.Id, "public-playground").First(&guestToken).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			guestToken = model.Token{
				UserId:         guestUser.Id,
				Name:           "public-playground",
				Key:            "sk-public-playground-guest-key-" + common.GetRandomString(8),
				Status:         common.TokenStatusEnabled,
				UnlimitedQuota: true,
				Group:          "default",
			}
			if err := model.DB.Create(&guestToken).Error; err != nil {
				newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
				return
			}
		} else {
			newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
			return
		}
	}

	if guestToken.Status != common.TokenStatusEnabled {
		newAPIError = types.NewError(errors.New("guest token is disabled"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	// 5. Setup context using token
	userCache, err := model.GetUserCache(guestUser.Id)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		return
	}
	userCache.WriteContext(c)

	common.SetContextKey(c, constant.ContextKeyUsingGroup, guestToken.Group)
	err = middleware.SetupContextForToken(c, &guestToken)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		return
	}

	channel, _, err := service.CacheGetRandomSatisfiedChannel(&service.RetryParam{
		Ctx:        c,
		ModelName:  targetModel,
		TokenGroup: guestToken.Group,
		Retry:      common.GetPointer(3),
	})
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeGetChannelFailed, types.ErrOptionWithSkipRetry())
		return
	}
	if channel == nil {
		newAPIError = types.NewError(errors.New("no available channels for "+targetModel), types.ErrorCodeGetChannelFailed, types.ErrOptionWithSkipRetry())
		return
	}

	common.SetContextKey(c, constant.ContextKeyOriginalModel, targetModel)
	common.SetContextKey(c, constant.ContextKeyRequestStartTime, time.Now())
	newAPIError = middleware.SetupContextForSelectedChannel(c, channel, targetModel)
	if newAPIError != nil {
		return
	}

	c.Request.URL.Path = "/v1/chat/completions"

	// 6. Run Relay
	Relay(c, types.RelayFormatOpenAI)
}

func Playground(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	useAccessToken := c.GetBool("use_access_token")
	if useAccessToken {
		newAPIError = types.NewError(errors.New("暂不支持使用 access token"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	relayInfo, err := relaycommon.GenRelayInfo(c, types.RelayFormatOpenAI, nil, nil)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
		return
	}

	userId := c.GetInt("id")

	// Write user context to ensure acceptUnsetRatio is available
	userCache, err := model.GetUserCache(userId)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		return
	}
	userCache.WriteContext(c)

	tempToken := &model.Token{
		UserId: userId,
		Name:   fmt.Sprintf("playground-%s", relayInfo.UsingGroup),
		Group:  relayInfo.UsingGroup,
	}
	_ = middleware.SetupContextForToken(c, tempToken)

	Relay(c, types.RelayFormatOpenAI)
}
