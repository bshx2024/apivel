package common

import (
	"sort"
	"strings"
	"sync"
	"time"
)

const MaxInMemoryEntries = 50000

var AllowedKeyPrefixes = []string{
	"rateLimit:auth:",
	"rateLimit:turnstile:",
	"rateLimit:email:",
	"rateLimit:",
	"turnstile:used:",
	"reg:limit:",
	"reg:",
	"GW",
	"GA",
	"CT",
	"DW",
	"UP",
	"SR",
}

type memoryEntry struct {
	queue      []int64
	lastAccess int64
	lockedUntil int64
	count      int64
}

type InMemoryRateLimiter struct {
	store              map[string]*memoryEntry
	mutex              sync.Mutex
	expirationDuration time.Duration
}

var InMemoryRateLimiterInstance InMemoryRateLimiter

func (l *InMemoryRateLimiter) isAllowedKey(key string) bool {
	for _, prefix := range AllowedKeyPrefixes {
		if strings.HasPrefix(key, prefix) {
			return true
		}
	}
	return false
}

func (l *InMemoryRateLimiter) Init(expirationDuration time.Duration) {
	if l.store == nil {
		l.mutex.Lock()
		if l.store == nil {
			l.store = make(map[string]*memoryEntry)
			l.expirationDuration = expirationDuration
			if expirationDuration > 0 {
				go l.clearExpiredItems()
			}
		}
		l.mutex.Unlock()
	}
}

func (l *InMemoryRateLimiter) evictOldest(count int) {
	if count <= 0 || len(l.store) == 0 {
		return
	}
	type item struct {
		key        string
		lastAccess int64
	}
	items := make([]item, 0, len(l.store))
	for k, v := range l.store {
		items = append(items, item{key: k, lastAccess: v.lastAccess})
	}
	sort.Slice(items, func(i, j int) bool {
		return items[i].lastAccess < items[j].lastAccess
	})

	limit := count
	if limit > len(items) {
		limit = len(items)
	}
	for i := 0; i < limit; i++ {
		delete(l.store, items[i].key)
	}
}

func (l *InMemoryRateLimiter) clearExpiredItems() {
	for {
		time.Sleep(l.expirationDuration)
		l.mutex.Lock()
		now := time.Now().Unix()
		for key, entry := range l.store {
			size := len(entry.queue)
			if (size == 0 || now-entry.queue[size-1] > int64(l.expirationDuration.Seconds())) &&
				entry.lockedUntil < now && entry.count == 0 {
				delete(l.store, key)
			}
		}
		l.mutex.Unlock()
	}
}

func (l *InMemoryRateLimiter) Request(key string, maxRequestNum int, duration int64) bool {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	if !l.isAllowedKey(key) {
		return true // not in whitelist, pass-through without occupying memory
	}

	now := time.Now().Unix()
	entry, ok := l.store[key]
	if ok {
		entry.lastAccess = now
		if len(entry.queue) < maxRequestNum {
			entry.queue = append(entry.queue, now)
			return true
		} else {
			if now-entry.queue[0] >= duration {
				entry.queue = entry.queue[1:]
				entry.queue = append(entry.queue, now)
				return true
			} else {
				return false
			}
		}
	} else {
		// Enforce capacity limit with 10% LRU eviction
		if len(l.store) >= MaxInMemoryEntries {
			l.evictOldest(MaxInMemoryEntries / 10)
		}
		s := make([]int64, 0, maxRequestNum)
		s = append(s, now)
		l.store[key] = &memoryEntry{
			queue:      s,
			lastAccess: now,
		}
	}
	return true
}

func (l *InMemoryRateLimiter) Incr(key string, ttl time.Duration) int64 {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now().Unix()
	entry, ok := l.store[key]
	if !ok {
		if len(l.store) >= MaxInMemoryEntries {
			l.evictOldest(MaxInMemoryEntries / 10)
		}
		entry = &memoryEntry{
			lastAccess: now,
			count:      1,
		}
		l.store[key] = entry
		return 1
	}
	entry.count++
	entry.lastAccess = now
	return entry.count
}

func (l *InMemoryRateLimiter) GetCount(key string) int64 {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	entry, ok := l.store[key]
	if !ok {
		return 0
	}
	return entry.count
}

func (l *InMemoryRateLimiter) SetLocked(key string, ttl time.Duration) {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now().Unix()
	entry, ok := l.store[key]
	if !ok {
		if len(l.store) >= MaxInMemoryEntries {
			l.evictOldest(MaxInMemoryEntries / 10)
		}
		entry = &memoryEntry{
			lastAccess: now,
		}
		l.store[key] = entry
	}
	entry.lockedUntil = now + int64(ttl.Seconds())
	entry.lastAccess = now
}

func (l *InMemoryRateLimiter) IsLocked(key string) bool {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	entry, ok := l.store[key]
	if !ok {
		return false
	}
	return entry.lockedUntil > time.Now().Unix()
}

func (l *InMemoryRateLimiter) SetNX(key string, ttl time.Duration) bool {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()

	now := time.Now().Unix()
	entry, ok := l.store[key]
	if ok && entry.lockedUntil > now {
		return false // already exists and not expired
	}
	if len(l.store) >= MaxInMemoryEntries {
		l.evictOldest(MaxInMemoryEntries / 10)
	}
	l.store[key] = &memoryEntry{
		lastAccess:  now,
		lockedUntil: now + int64(ttl.Seconds()),
	}
	return true
}

func (l *InMemoryRateLimiter) Delete(key string) {
	l.Init(RateLimitKeyExpirationDuration)
	l.mutex.Lock()
	defer l.mutex.Unlock()
	delete(l.store, key)
}
