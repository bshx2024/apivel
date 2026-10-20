package uaparser

import (
	"strings"
)

// ClientInfo represents parsed user agent information
type ClientInfo struct {
	Device  string `json:"device"`  // pc, mobile, tablet, bot, unknown
	OS      string `json:"os"`      // windows, macos, ios, android, linux, chromeos, unknown
	Browser string `json:"browser"` // chrome, safari, edge, firefox, opera, wechat, alipay, unknown
}

// Parse extracts device type, OS, and browser from a User-Agent string
func Parse(ua string) ClientInfo {
	if ua == "" {
		return ClientInfo{
			Device:  "unknown",
			OS:      "unknown",
			Browser: "unknown",
		}
	}

	lower := strings.ToLower(ua)

	// 1. Check for bots/crawlers first
	if isBot(lower) {
		return ClientInfo{
			Device:  "bot",
			OS:      detectOS(lower),
			Browser: "bot",
		}
	}

	// 2. Detect OS
	os := detectOS(lower)

	// 3. Detect Device
	device := detectDevice(lower, os)

	// 4. Detect Browser
	browser := detectBrowser(lower)

	return ClientInfo{
		Device:  device,
		OS:      os,
		Browser: browser,
	}
}

func isBot(ua string) bool {
	botKeywords := []string{
		"bot", "spider", "crawler", "crawl", "slurp", "mediapartners",
		"feedfetcher", "curl/", "wget/", "python-requests", "postmanruntime",
		"httpclient", "ahrefsbot", "semrushbot", "googlebot", "bingbot", "yandexbot",
	}
	for _, kw := range botKeywords {
		if strings.Contains(ua, kw) {
			return true
		}
	}
	return false
}

func detectOS(ua string) string {
	switch {
	case strings.Contains(ua, "iphone") || strings.Contains(ua, "ipad") || strings.Contains(ua, "ipod"):
		return "ios"
	case strings.Contains(ua, "android"):
		return "android"
	case strings.Contains(ua, "windows") || strings.Contains(ua, "win32") || strings.Contains(ua, "win64"):
		return "windows"
	case strings.Contains(ua, "macintosh") || strings.Contains(ua, "mac os x"):
		return "macos"
	case strings.Contains(ua, "cros"):
		return "chromeos"
	case strings.Contains(ua, "linux") || strings.Contains(ua, "x11"):
		return "linux"
	default:
		return "unknown"
	}
}

func detectDevice(ua string, os string) string {
	if strings.Contains(ua, "ipad") || (strings.Contains(ua, "android") && !strings.Contains(ua, "mobile")) || strings.Contains(ua, "tablet") {
		return "tablet"
	}
	if os == "ios" || strings.Contains(ua, "mobile") || strings.Contains(ua, "phone") || os == "android" {
		return "mobile"
	}
	if os == "windows" || os == "macos" || os == "linux" || os == "chromeos" {
		return "pc"
	}
	return "unknown"
}

func detectBrowser(ua string) string {
	switch {
	case strings.Contains(ua, "micromessenger"):
		return "wechat"
	case strings.Contains(ua, "alipay"):
		return "alipay"
	case strings.Contains(ua, "edg/") || strings.Contains(ua, "edge/"):
		return "edge"
	case strings.Contains(ua, "opr/") || strings.Contains(ua, "opera/"):
		return "opera"
	case strings.Contains(ua, "chrome/") || strings.Contains(ua, "crios/"):
		return "chrome"
	case strings.Contains(ua, "firefox/") || strings.Contains(ua, "fxios/"):
		return "firefox"
	case strings.Contains(ua, "safari/") && !strings.Contains(ua, "chrome/"):
		return "safari"
	default:
		return "unknown"
	}
}
