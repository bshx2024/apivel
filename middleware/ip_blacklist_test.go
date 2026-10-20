package middleware

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
)

func TestIsIPBlacklisted(t *testing.T) {
	common.IPBlacklist = "2607:fb91::/32, 192.168.1.100, 10.0.0.0/8"

	tests := []struct {
		ip       string
		expected bool
	}{
		{"2607:fb91:4e85:a608:51b0:6309:7950:8c15", true},
		{"2607:fb91:0000:0000:0000:0000:0000:0001", true},
		{"2607:ffff::1", false},
		{"192.168.1.100", true},
		{"192.168.1.101", false},
		{"10.2.3.4", true},
		{"172.16.0.1", false},
	}

	for _, tt := range tests {
		got := IsIPBlacklisted(tt.ip)
		if got != tt.expected {
			t.Errorf("IsIPBlacklisted(%q) = %v; want %v", tt.ip, got, tt.expected)
		}
	}
}
