package middleware

import (
	"context"
	"errors"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/gin-gonic/gin"
)

// CheckRegisterIPRateLimit verifies if registration is allowed for client's IP subnet
func CheckRegisterIPRateLimit(c *gin.Context) error {
	if !common.RegisterIPRateLimitEnabled {
		return nil
	}

	clientIP := c.ClientIP()
	subnetKey := common.GetIPSubnetKey(clientIP)
	redisKey := "reg:limit:subnet:" + subnetKey

	duration := common.RegisterIPRateLimitDuration // 86400s (24h)
	maxNum := 1

	if common.RedisEnabled {
		ctx := context.Background()
		rdb := common.RDB
		count, err := rdb.Get(ctx, redisKey).Int()
		if err == nil && count >= maxNum {
			return errors.New(common.TranslateMessage(c, i18n.MsgRegisterIPRateLimited))
		}
	} else {
		inMemoryRateLimiter.Init(common.RateLimitKeyExpirationDuration)
		if !inMemoryRateLimiter.Request("reg:"+subnetKey, maxNum, duration) {
			return errors.New(common.TranslateMessage(c, i18n.MsgRegisterIPRateLimited))
		}
	}
	return nil
}

// RecordRegisterIPRateLimit records successful registration for client's IP subnet
func RecordRegisterIPRateLimit(c *gin.Context) {
	if !common.RegisterIPRateLimitEnabled {
		return
	}
	clientIP := c.ClientIP()
	subnetKey := common.GetIPSubnetKey(clientIP)
	redisKey := "reg:limit:subnet:" + subnetKey

	if common.RedisEnabled {
		ctx := context.Background()
		rdb := common.RDB
		rdb.Incr(ctx, redisKey)
		rdb.Expire(ctx, redisKey, time.Duration(common.RegisterIPRateLimitDuration)*time.Second)
	}
}
