package middleware

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/gin-gonic/gin"
)

type turnstileCheckResponse struct {
	Success bool `json:"success"`
}

// TurnstileCheck middleware for registration, email verification, password reset endpoints
// Enforces one-time token consumption via SETNX instead of bypassable session cookies
func TurnstileCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		if !common.TurnstileCheckEnabled {
			c.Next()
			return
		}

		response := strings.TrimSpace(c.Query("turnstile"))
		if response == "" {
			response = strings.TrimSpace(c.PostForm("turnstile"))
		}

		if response == "" {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Turnstile token 为空",
			})
			c.Abort()
			return
		}

		hasher := sha256.New()
		hasher.Write([]byte(response))
		tokenHash := hex.EncodeToString(hasher.Sum(nil))

		clientIP := c.ClientIP()

		// 1. Atomic SETNX Check
		if common.RedisEnabled && common.RDB != nil {
			usedKey := "turnstile:used:" + tokenHash
			set, err := common.RDB.SetNX(c.Request.Context(), usedKey, clientIP, 5*time.Minute).Result()
			if err == nil && !set {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Turnstile token 已被使用，请刷新重试！",
				})
				c.Abort()
				return
			}
		} else {
			usedKey := "turnstile:used:" + tokenHash
			if !common.InMemoryRateLimiterInstance.SetNX(usedKey, 5*time.Minute) {
				c.JSON(http.StatusOK, gin.H{
					"success": false,
					"message": "Turnstile token 已被使用，请刷新重试！",
				})
				c.Abort()
				return
			}
		}

		// 2. Verify with Cloudflare
		rawRes, err := http.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", url.Values{
			"secret":   {common.TurnstileSecretKey},
			"response": {response},
			"remoteip": {clientIP},
		})
		if err != nil {
			logger.LogError(c, "Turnstile HTTP error: "+err.Error())
			// Rollback token on verification error
			if common.RedisEnabled && common.RDB != nil {
				common.RDB.Del(c.Request.Context(), "turnstile:used:"+tokenHash)
			} else {
				common.InMemoryRateLimiterInstance.Delete("turnstile:used:" + tokenHash)
			}
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "人机验证服务网络异常，请重试",
			})
			c.Abort()
			return
		}
		defer rawRes.Body.Close()

		var res turnstileCheckResponse
		err = common.DecodeJson(rawRes.Body, &res)
		if err != nil || !res.Success {
			if common.RedisEnabled && common.RDB != nil {
				common.RDB.Del(c.Request.Context(), "turnstile:used:"+tokenHash)
			} else {
				common.InMemoryRateLimiterInstance.Delete("turnstile:used:" + tokenHash)
			}
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "Turnstile 校验失败，请刷新重试！",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
