package contentfilter

import (
	"strings"
	"sync"
	"unicode"
)

// TrieNode represents a node in the prefix tree for high-risk keyword filtering
type TrieNode struct {
	children map[rune]*TrieNode
	isEnd    bool
	keyword  string
}

func newTrieNode() *TrieNode {
	return &TrieNode{
		children: make(map[rune]*TrieNode),
	}
}

// Filter provides high-speed, in-memory zero-latency text matching
type Filter struct {
	root *TrieNode
	mu   sync.RWMutex
}

var (
	defaultFilter *Filter
	once          sync.Once
)

// DefaultHighRiskKeywords contains critical terms that must never reach upstream Chinese LLM providers
// (violent extremism, severe illegal acts, and top-tier political attack vectors that trigger tenant bans).
var defaultKeywords = []string{
	// 恶性暴恐与极端违法
	"恐怖袭击", "制造炸弹", "自制炸药", "枪支制作", "毒品配方", "冰毒制作", "海洛因配方",
	"暗网军火", "人口贩卖", "洗钱教程", "代开发票假发票",
	// 极端涉政与反动越狱攻击
	"颠覆国家政权", "推翻共产党", "煽动叛乱", "分裂国家",
}

// GetDefaultFilter returns the singleton Filter instance
func GetDefaultFilter() *Filter {
	once.Do(func() {
		defaultFilter = NewFilter(defaultKeywords)
	})
	return defaultFilter
}

// NewFilter initializes a Filter with given keywords
func NewFilter(keywords []string) *Filter {
	f := &Filter{
		root: newTrieNode(),
	}
	for _, kw := range keywords {
		f.AddKeyword(kw)
	}
	return f
}

// AddKeyword inserts a keyword into the trie
func (f *Filter) AddKeyword(keyword string) {
	f.mu.Lock()
	defer f.mu.Unlock()

	cleaned := normalizeText(keyword)
	if cleaned == "" {
		return
	}

	curr := f.root
	for _, r := range cleaned {
		if _, exists := curr.children[r]; !exists {
			curr.children[r] = newTrieNode()
		}
		curr = curr.children[r]
	}
	curr.isEnd = true
	curr.keyword = keyword
}

// normalizeText trims whitespace and converts to lower case
func normalizeText(s string) string {
	var b strings.Builder
	for _, r := range s {
		if !unicode.IsSpace(r) && !unicode.IsPunct(r) {
			b.WriteRune(unicode.ToLower(r))
		}
	}
	return b.String()
}

// FindFirstMatch checks if text contains any high-risk keyword in O(N) time
// Returns (matched, keyword)
func (f *Filter) FindFirstMatch(text string) (bool, string) {
	if text == "" {
		return false, ""
	}

	f.mu.RLock()
	defer f.mu.RUnlock()

	runes := []rune(normalizeText(text))
	n := len(runes)

	for i := 0; i < n; i++ {
		curr := f.root
		for j := i; j < n; j++ {
			child, exists := curr.children[runes[j]]
			if !exists {
				break
			}
			curr = child
			if curr.isEnd {
				return true, curr.keyword
			}
		}
	}

	return false, ""
}
