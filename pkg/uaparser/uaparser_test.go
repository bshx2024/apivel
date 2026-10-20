package uaparser

import (
	"testing"
)

func TestParse(t *testing.T) {
	tests := []struct {
		name     string
		ua       string
		expected ClientInfo
	}{
		{
			name: "Windows Chrome PC",
			ua:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
			expected: ClientInfo{
				Device:  "pc",
				OS:      "windows",
				Browser: "chrome",
			},
		},
		{
			name: "Mac Safari PC",
			ua:   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
			expected: ClientInfo{
				Device:  "pc",
				OS:      "macos",
				Browser: "safari",
			},
		},
		{
			name: "iPhone Safari Mobile",
			ua:   "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1",
			expected: ClientInfo{
				Device:  "mobile",
				OS:      "ios",
				Browser: "safari",
			},
		},
		{
			name: "Android WeChat Mobile",
			ua:   "Mozilla/5.0 (Linux; Android 13; SM-S918B Build/TP1A.220624.014) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 MicroMessenger/8.0.42.2460(0x28002A34)",
			expected: ClientInfo{
				Device:  "mobile",
				OS:      "android",
				Browser: "wechat",
			},
		},
		{
			name: "iPad Tablet",
			ua:   "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/114.0.5735.124 Mobile/15E148 Safari/604.1",
			expected: ClientInfo{
				Device:  "tablet",
				OS:      "ios",
				Browser: "chrome",
			},
		},
		{
			name: "Googlebot",
			ua:   "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
			expected: ClientInfo{
				Device:  "bot",
				OS:      "unknown",
				Browser: "bot",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res := Parse(tt.ua)
			if res.Device != tt.expected.Device {
				t.Errorf("Device mismatch: got %v, want %v", res.Device, tt.expected.Device)
			}
			if res.OS != tt.expected.OS {
				t.Errorf("OS mismatch: got %v, want %v", res.OS, tt.expected.OS)
			}
			if res.Browser != tt.expected.Browser {
				t.Errorf("Browser mismatch: got %v, want %v", res.Browser, tt.expected.Browser)
			}
		})
	}
}
