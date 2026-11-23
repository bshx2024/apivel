package controller

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
)

type guestTokenCacheItem struct {
	Key       string
	ExpiredAt int64
}

var (
	guestTokenMemoryCache sync.Map // map[string]*guestTokenCacheItem
	guestTokenMutex       sync.Mutex
)

const (
	guestTrialDefaultQuota       = 25000 // $0.05 compute
	guestTrialDurationSeconds    = int64(86400) // 24 hours
	guestTrialAllowedModels      = "deepseek-v4-flash,infer/qwen3.7-max,infer/glm-5.3-flash,infer/glm-5.3-flashx,deepseek-chat"
	guestTrialBaseURL            = "https://apivel.com/v1"
)

// GetGuestTrialToken handles issuing and reusing 24-hour zero-login guest trial keys
func GetGuestTrialToken(c *gin.Context) {
	// 1. Extract trusted client IP and calculate normalized /24 or /48 subnet
	clientIP := c.GetHeader("CF-Connecting-IP")
	if clientIP == "" {
		clientIP = c.GetHeader("X-Real-IP")
	}
	if clientIP == "" {
		clientIP = c.ClientIP()
	}
	clientIP = strings.TrimSpace(clientIP)
	subnet := common.GetSubnet(clientIP)
	if subnet == "" {
		subnet = "unknown"
	}

	now := common.GetTimestamp()
	cacheKey := fmt.Sprintf("guest_trial:%s", subnet)
	tokenName := fmt.Sprintf("guest:%s", subnet)

	guestTokenMutex.Lock()
	defer guestTokenMutex.Unlock()

	// 2. Check Redis / Memory cache for existing token key within 24 hours
	var existingRawKey string
	if common.RedisEnabled && common.RDB != nil {
		ctx := context.Background()
		cachedVal, err := common.RDB.Get(ctx, cacheKey).Result()
		if err == nil && cachedVal != "" {
			existingRawKey = cachedVal
		}
	}

	if existingRawKey == "" {
		if val, ok := guestTokenMemoryCache.Load(subnet); ok {
			item := val.(*guestTokenCacheItem)
			if item.ExpiredAt > now {
				existingRawKey = item.Key
			}
		}
	}

	// 3. If cached key found, verify in DB and return if still valid and unexpired
	if existingRawKey != "" {
		token, err := model.GetTokenByKey(existingRawKey, false)
		if err == nil && token != nil && token.ExpiredTime > now && token.Status == common.TokenStatusEnabled {
			expiresIn := token.ExpiredTime - now
			if expiresIn < 0 {
				expiresIn = 0
			}
			fullKey := token.Key
			if !strings.HasPrefix(fullKey, "sk-") {
				fullKey = "sk-" + fullKey
			}
			c.JSON(http.StatusOK, gin.H{
				"success": true,
				"message": "",
				"data": gin.H{
					"key":        fullKey,
					"base_url":   guestTrialBaseURL,
					"quota":      token.RemainQuota,
					"expires_in": expiresIn,
				},
			})
			return
		}
	}

	// 4. Fallback: Check DB directly for active guest token for this subnet
	var existingToken model.Token
	err := model.DB.Where("user_id = 1 AND name = ? AND expired_time > ? AND status = ?", tokenName, now, common.TokenStatusEnabled).
		Order("id desc").First(&existingToken).Error
	if err == nil && existingToken.Id > 0 {
		// Populate cache
		rawKey := strings.TrimPrefix(existingToken.Key, "sk-")
		ttl := time.Duration(existingToken.ExpiredTime-now) * time.Second
		if common.RedisEnabled && common.RDB != nil {
			_ = common.RDB.Set(context.Background(), cacheKey, rawKey, ttl).Err()
		}
		guestTokenMemoryCache.Store(subnet, &guestTokenCacheItem{
			Key:       rawKey,
			ExpiredAt: existingToken.ExpiredTime,
		})

		expiresIn := existingToken.ExpiredTime - now
		if expiresIn < 0 {
			expiresIn = 0
		}
		fullKey := existingToken.Key
		if !strings.HasPrefix(fullKey, "sk-") {
			fullKey = "sk-" + fullKey
		}
		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"message": "",
			"data": gin.H{
				"key":        fullKey,
				"base_url":   guestTrialBaseURL,
				"quota":      existingToken.RemainQuota,
				"expires_in": expiresIn,
			},
		})
		return
	}

	// 5. Generate new 24h Guest Trial Token for this subnet
	rawKey, err := common.GenerateKey()
	if err != nil {
		common.SysError(fmt.Sprintf("failed to generate guest trial key: %v", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to generate trial token",
		})
		return
	}

	expiredTime := now + guestTrialDurationSeconds
	token := model.Token{
		UserId:             1,
		Name:               tokenName,
		Key:                rawKey,
		CreatedTime:        now,
		AccessedTime:       now,
		ExpiredTime:        expiredTime,
		RemainQuota:        guestTrialDefaultQuota,
		UnlimitedQuota:     false,
		ModelLimitsEnabled: true,
		ModelLimits:        guestTrialAllowedModels,
		Status:             common.TokenStatusEnabled,
	}

	if err := model.DB.Create(&token).Error; err != nil {
		common.SysError(fmt.Sprintf("failed to create guest trial token: %v", err))
		c.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"message": "Failed to create trial token",
		})
		return
	}

	// 6. Update Redis & memory cache for 24 hours
	if common.RedisEnabled && common.RDB != nil {
		_ = common.RDB.Set(context.Background(), cacheKey, rawKey, 24*time.Hour).Err()
	}
	guestTokenMemoryCache.Store(subnet, &guestTokenCacheItem{
		Key:       rawKey,
		ExpiredAt: expiredTime,
	})

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"key":        "sk-" + rawKey,
			"base_url":   guestTrialBaseURL,
			"quota":      guestTrialDefaultQuota,
			"expires_in": guestTrialDurationSeconds,
		},
	})
}
