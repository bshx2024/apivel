package model

import (
	"testing"
)

func TestIsContentSafetyError(t *testing.T) {
	tests := []struct {
		content  string
		expected bool
	}{
		{
			content:  "status_code=400, [400]: <400> ***.***.DataInspectionFailed: Input text data may contain inappropriate content.",
			expected: true,
		},
		{
			content:  "400: inappropriate content detected",
			expected: true,
		},
		{
			content:  "Content policy violation: model refused to process prompt",
			expected: true,
		},
		{
			content:  "Upstream response failed quality validation: empty content and no tool_calls in response",
			expected: false,
		},
		{
			content:  "status_code=502, Bad Gateway",
			expected: false,
		},
		{
			content:  "upstream error: do request failed",
			expected: false,
		},
	}

	for _, tt := range tests {
		got := isContentSafetyError(tt.content)
		if got != tt.expected {
			t.Errorf("isContentSafetyError(%q) = %v; want %v", tt.content, got, tt.expected)
		}
	}
}

func TestCanGrantRegistrationBonus_LocalIPs(t *testing.T) {
	// Localhost / empty IPs should always be allowed
	if !CanGrantRegistrationBonus("", 0) {
		t.Errorf("CanGrantRegistrationBonus(\"\", 0) should be true")
	}
	if !CanGrantRegistrationBonus("127.0.0.1", 0) {
		t.Errorf("CanGrantRegistrationBonus(\"127.0.0.1\", 0) should be true")
	}
	if !CanGrantRegistrationBonus("::1", 0) {
		t.Errorf("CanGrantRegistrationBonus(\"::1\", 0) should be true")
	}
}
