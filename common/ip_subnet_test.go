package common

import (
	"testing"
)

func TestGetIPSubnetKey(t *testing.T) {
	tests := []struct {
		ip       string
		expected string
	}{
		{"192.168.1.50", "192.168.1.0/24"},
		{"8.8.8.8", "8.8.8.0/24"},
		{"2607:fb91:4e85:a608:51b0:6309:7950:8c15", "2607:fb91::/32"},
		{"2001:db8:abcd:0012:0000:0000:0000:0001", "2001:db8:abcd:12::/64"},
	}

	for _, tt := range tests {
		got := GetIPSubnetKey(tt.ip)
		if got != tt.expected {
			t.Errorf("GetIPSubnetKey(%q) = %q; want %q", tt.ip, got, tt.expected)
		}
	}
}
