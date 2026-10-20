package service

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestPaymentRiskGuard_MemoryFallback(t *testing.T) {
	ctx := context.Background()
	userId := 999999
	tradeNo := "test_trade_123"

	// Reset any state
	ResetPaymentFailure(ctx, userId)

	// Initially allowed
	allowed, reason := CheckPaymentAllowed(ctx, userId)
	assert.True(t, allowed)
	assert.Empty(t, reason)

	// 1st, 2nd, 3rd failure
	RecordPaymentFailure(ctx, userId, tradeNo, "card_declined")
	RecordPaymentFailure(ctx, userId, tradeNo, "insufficient_funds")
	RecordPaymentFailure(ctx, userId, tradeNo, "do_not_honor")

	// After 3 failures (threshold is 4), still allowed
	allowed, _ = CheckPaymentAllowed(ctx, userId)
	assert.True(t, allowed)

	// 4th failure triggers cooldown
	RecordPaymentFailure(ctx, userId, tradeNo, "fraudulent")
	allowed, reason = CheckPaymentAllowed(ctx, userId)
	assert.False(t, allowed)
	assert.Contains(t, reason, "近期支付尝试未完成次数较多")

	// Succeeded payment resets failure
	ResetPaymentFailure(ctx, userId)
	allowed, reason = CheckPaymentAllowed(ctx, userId)
	assert.True(t, allowed)
	assert.Empty(t, reason)
}

func TestPaymentRiskGuard_Expiration(t *testing.T) {
	ctx := context.Background()
	userId := 888888
	tradeNo := "test_trade_888"

	ResetPaymentFailure(ctx, userId)

	// Trigger cooldown
	for i := 0; i < 4; i++ {
		RecordPaymentFailure(ctx, userId, tradeNo, "fail")
	}

	allowed, _ := CheckPaymentAllowed(ctx, userId)
	assert.False(t, allowed)

	// Manually set CooldownUntil in memory to the past
	if val, ok := paymentRiskStore.Load(userId); ok {
		item := val.(*paymentRiskMemoryItem)
		item.CooldownUntil = time.Now().Add(-1 * time.Minute)
	}

	allowed, reason := CheckPaymentAllowed(ctx, userId)
	assert.True(t, allowed)
	assert.Empty(t, reason)
}
