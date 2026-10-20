package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
)

var (
	PaymentMaxFailuresPerHour = 4
	PaymentCooldownMinutes    = 15
	PaymentMaxPendingOrders   = 3

	paymentRiskStore sync.Map
)

type paymentRiskMemoryItem struct {
	FailCount     int
	FirstFailTime time.Time
	CooldownUntil time.Time
}

func init() {
	PaymentMaxFailuresPerHour = common.GetEnvOrDefault("PAYMENT_MAX_FAILURES_PER_HOUR", 4)
	PaymentCooldownMinutes = common.GetEnvOrDefault("PAYMENT_COOLDOWN_MINUTES", 15)
	PaymentMaxPendingOrders = common.GetEnvOrDefault("PAYMENT_MAX_PENDING_ORDERS", 3)
}

// RecordPaymentFailure records a failed payment attempt for the given user.
// If the failure threshold is reached within 1 hour, a cooldown period is activated.
func RecordPaymentFailure(ctx context.Context, userId int, tradeNo string, reason string) {
	if userId <= 0 {
		return
	}

	cooldownDuration := time.Duration(PaymentCooldownMinutes) * time.Minute

	if common.RedisEnabled {
		failKey := fmt.Sprintf("risk:pay:fail:%d", userId)
		cooldownKey := fmt.Sprintf("risk:pay:cooldown:%d", userId)

		count, err := common.RDB.Incr(ctx, failKey).Result()
		if err != nil {
			logger.LogError(ctx, fmt.Sprintf("[PaymentRiskGuard] Redis Incr 失败: %v", err))
			return
		}
		if count == 1 {
			common.RDB.Expire(ctx, failKey, time.Hour)
		}

		if count >= int64(PaymentMaxFailuresPerHour) {
			common.RDB.Set(ctx, cooldownKey, "1", cooldownDuration)
			logger.LogError(ctx, fmt.Sprintf("[PaymentRiskGuard] 用户触发支付风控冷却 user_id=%d trade_no=%s fail_count=%d reason=%s cooldown=%dm",
				userId, tradeNo, count, reason, PaymentCooldownMinutes))
		} else {
			logger.LogWarn(ctx, fmt.Sprintf("[PaymentRiskGuard] 记录用户支付失败 user_id=%d trade_no=%s fail_count=%d/%d reason=%s",
				userId, tradeNo, count, PaymentMaxFailuresPerHour, reason))
		}
		return
	}

	// In-memory fallback
	now := time.Now()
	val, _ := paymentRiskStore.LoadOrStore(userId, &paymentRiskMemoryItem{
		FirstFailTime: now,
	})
	item := val.(*paymentRiskMemoryItem)

	if now.Sub(item.FirstFailTime) > time.Hour {
		item.FailCount = 1
		item.FirstFailTime = now
	} else {
		item.FailCount++
	}

	if item.FailCount >= PaymentMaxFailuresPerHour {
		item.CooldownUntil = now.Add(cooldownDuration)
		logger.LogError(ctx, fmt.Sprintf("[PaymentRiskGuard] 用户触发支付风控冷却 (内存) user_id=%d trade_no=%s fail_count=%d reason=%s cooldown=%dm",
			userId, tradeNo, item.FailCount, reason, PaymentCooldownMinutes))
	} else {
		logger.LogWarn(ctx, fmt.Sprintf("[PaymentRiskGuard] 记录用户支付失败 (内存) user_id=%d trade_no=%s fail_count=%d/%d reason=%s",
			userId, tradeNo, item.FailCount, PaymentMaxFailuresPerHour, reason))
	}
}

// ResetPaymentFailure resets the failure counter and clears any cooldown when a payment succeeds.
func ResetPaymentFailure(ctx context.Context, userId int) {
	if userId <= 0 {
		return
	}

	if common.RedisEnabled {
		failKey := fmt.Sprintf("risk:pay:fail:%d", userId)
		cooldownKey := fmt.Sprintf("risk:pay:cooldown:%d", userId)
		common.RDB.Del(ctx, failKey, cooldownKey)
	} else {
		paymentRiskStore.Delete(userId)
	}

	logger.LogInfo(ctx, fmt.Sprintf("[PaymentRiskGuard] 用户支付成功，已重置失败风控计数 user_id=%d", userId))
}

// CheckPaymentAllowed verifies if the user is allowed to initiate a payment checkout.
// Returns (allowed, rejectReason).
func CheckPaymentAllowed(ctx context.Context, userId int) (bool, string) {
	if userId <= 0 {
		return true, ""
	}

	// 1. Check cooldown period
	if common.RedisEnabled {
		cooldownKey := fmt.Sprintf("risk:pay:cooldown:%d", userId)
		exists, err := common.RDB.Exists(ctx, cooldownKey).Result()
		if err == nil && exists > 0 {
			ttl, _ := common.RDB.TTL(ctx, cooldownKey).Result()
			mins := int(ttl.Minutes())
			if mins < 1 {
				mins = 1
			}
			return false, fmt.Sprintf("近期支付尝试未完成次数较多，为保障您的账户安全，请约 %d 分钟后再试，或检查您的银行卡是否开通国际支付及3D验证。", mins)
		}
	} else {
		if val, ok := paymentRiskStore.Load(userId); ok {
			item := val.(*paymentRiskMemoryItem)
			if time.Now().Before(item.CooldownUntil) {
				mins := int(time.Until(item.CooldownUntil).Minutes()) + 1
				return false, fmt.Sprintf("近期支付尝试未完成次数较多，为保障您的账户安全，请约 %d 分钟后再试，或检查您的银行卡是否开通国际支付及3D验证。", mins)
			}
		}
	}

	// 2. Check pending top-up orders accumulation in the last 10 minutes
	if PaymentMaxPendingOrders > 0 && model.DB != nil {
		var pendingCount int64
		tenMinutesAgo := time.Now().Add(-10 * time.Minute).Unix()
		err := model.DB.Model(&model.TopUp{}).
			Where("user_id = ? AND status = ? AND create_time >= ?", userId, common.TopUpStatusPending, tenMinutesAgo).
			Count(&pendingCount).Error

		if err == nil && pendingCount >= int64(PaymentMaxPendingOrders) {
			return false, "您有较多未完成的支付订单，请先完成已有支付或稍候再试（订单将在超时后自动取消）。"
		}
	}

	return true, ""
}

// CancelUserPendingTopUps 作废用户此前的 pending 订单，防止因切换面额或支付通道导致未完成订单堆积误触发风控
func CancelUserPendingTopUps(ctx context.Context, userId int) {
	if userId <= 0 {
		return
	}
	if err := model.CancelPendingTopUpsByUser(userId); err != nil {
		logger.LogWarn(ctx, fmt.Sprintf("[PaymentRiskGuard] 作废用户历史待支付订单失败 user_id=%d: %v", userId, err))
	} else {
		logger.LogInfo(ctx, fmt.Sprintf("[PaymentRiskGuard] 用户发起新支付，已自动作废此前的待支付订单 user_id=%d", userId))
	}
}
