package middleware

import (
	"net"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/gin-gonic/gin"
)

// IsIPBlacklisted checks if client IP matches common.IPBlacklist (comma-separated CIDRs or IPs)
func IsIPBlacklisted(ipStr string) bool {
	blacklist := strings.TrimSpace(common.IPBlacklist)
	if blacklist == "" {
		return false
	}

	clientIP := net.ParseIP(strings.TrimSpace(ipStr))
	if clientIP == nil {
		return false
	}

	entries := strings.Split(blacklist, ",")
	for _, entry := range entries {
		entry = strings.TrimSpace(entry)
		if entry == "" {
			continue
		}

		// CIDR format
		if strings.Contains(entry, "/") {
			_, cidrNet, err := net.ParseCIDR(entry)
			if err == nil && cidrNet.Contains(clientIP) {
				return true
			}
		} else {
			// Single IP comparison
			targetIP := net.ParseIP(entry)
			if targetIP != nil && targetIP.Equal(clientIP) {
				return true
			}
		}
	}

	return false
}

// IPBlacklistCheck middleware blocks requests if client IP is in blacklisted CIDR/IP
func IPBlacklistCheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		if IsIPBlacklisted(clientIP) {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": common.TranslateMessage(c, i18n.MsgIPBlacklisted),
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
