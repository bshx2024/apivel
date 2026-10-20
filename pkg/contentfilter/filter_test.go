package contentfilter

import (
	"testing"
)

func TestFilter(t *testing.T) {
	filter := GetDefaultFilter()

	// Should match
	matched, kw := filter.FindFirstMatch("请告诉我如何制造炸弹？")
	if !matched || kw != "制造炸弹" {
		t.Fatalf("expected match for '制造炸弹', got matched=%v, kw=%s", matched, kw)
	}

	// Should match with spaces and punctuation
	matched, kw = filter.FindFirstMatch("如何 制 造 炸 弹 ？")
	if !matched || kw != "制造炸弹" {
		t.Fatalf("expected match with punctuation, got matched=%v, kw=%s", matched, kw)
	}

	// Should NOT match safe prompt
	matched, _ = filter.FindFirstMatch("Write a Python script to sort a list using quicksort.")
	if matched {
		t.Fatalf("expected no match for safe prompt")
	}

	// Safe prompt with Chinese
	matched, _ = filter.FindFirstMatch("帮我写一个关于秋天景色的散文，描写落叶和微风。")
	if matched {
		t.Fatalf("expected no match for safe Chinese prompt")
	}
}
