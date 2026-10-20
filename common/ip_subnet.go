package common

import (
	"fmt"
	"net"
	"strings"

	"github.com/gin-gonic/gin"
)

// GetIPSubnetKey returns a normalized subnet string for rate limiting.
// For IPv4: masks to /24 (e.g., 1.2.3.4 -> 1.2.3.0/24)
// For IPv6: masks to /64 (e.g., 2607:fb91:4e85:a608:... -> 2607:fb91:4e85:a608::/64)
// Special mobile/proxy pools like 2607:fb91:: are masked to /32.
func GetIPSubnetKey(ipStr string) string {
	ipStr = strings.TrimSpace(ipStr)
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return ipStr
	}

	// Check if IPv4
	if ip4 := ip.To4(); ip4 != nil {
		mask := net.CIDRMask(24, 32)
		network := ip4.Mask(mask)
		return fmt.Sprintf("%s/24", network.String())
	}

	// IPv6
	if len(ip) == net.IPv6len {
		// Custom handling for known mobile carrier pools (e.g., T-Mobile IPv6 2607:fb91::/32)
		if strings.HasPrefix(strings.ToLower(ipStr), "2607:fb91:") {
			mask := net.CIDRMask(32, 128)
			network := ip.Mask(mask)
			return fmt.Sprintf("%s/32", network.String())
		}
		// Standard IPv6 mask /64
		mask := net.CIDRMask(64, 128)
		network := ip.Mask(mask)
		return fmt.Sprintf("%s/64", network.String())
	}

	return ipStr
}

// GetTrustedClientIP extracts client IP safely from trusted proxy headers
func GetTrustedClientIP(c *gin.Context, trustedProxies []string) string {
	remoteIP := c.ClientIP()
	if len(trustedProxies) == 0 {
		return remoteIP
	}

	rawRemote := c.Request.RemoteAddr
	host, _, err := net.SplitHostPort(rawRemote)
	if err == nil {
		rawRemote = host
	}

	isTrusted := false
	for _, proxy := range trustedProxies {
		if strings.TrimSpace(proxy) == rawRemote {
			isTrusted = true
			break
		}
	}

	if !isTrusted {
		return rawRemote
	}

	if cfIP := c.GetHeader("CF-Connecting-IP"); cfIP != "" {
		return strings.TrimSpace(cfIP)
	}
	if realIP := c.GetHeader("X-Real-IP"); realIP != "" {
		return strings.TrimSpace(realIP)
	}
	return remoteIP
}
