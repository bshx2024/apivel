package service

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/go-redis/redis/v8"
)

var (
	ErrTurnstileAlreadyUsed = errors.New("Turnstile token 已被使用，请刷新重试！")
	ErrTurnstileVerifyFail  = errors.New("Turnstile 校验失败，请刷新重试！")
	ErrTurnstileRequired    = errors.New("需要完成人机验证")
	ErrAccountSoftLocked    = errors.New("账号异常已被软锁定，请输入邮箱验证码")
	ErrAccountHardLocked    = errors.New("访问过于频繁，已被临时限制")
	ErrOTPInvalid           = errors.New("验证码错误")
	ErrOTPExpired           = errors.New("验证码已过期或尝试次数过多，请重新获取")
	ErrOTPDailyExceeded     = errors.New("今日验证码发送次数已达上限，请明天再试或联系客服")
	ErrOTPCooldown          = errors.New("验证码发送过于频繁，请稍后再试")
)

const (
	LoginFailTurnstileThreshold = 3
	LoginFailSoftLockThreshold  = 10
	LoginFailCountTTL           = 900 // 15 minutes
	LoginSoftLockTTL            = 900 // 15 minutes

	IPHardLockThreshold   = 50
	IPHardLockCheckWindow = 60
	IPHardLockTTL         = 1800 // 30 minutes

	LoginOTPPurpose     = "login_otp"
	LoginOTPMaxAttempts = 3
	LoginOTPDailyLimit  = 10
)

var (
	luaFailAtomicScript   *redis.Script
	luaSuccessClearScript *redis.Script
	luaScriptInitOnce     sync.Once
)

type AuthSecurityService struct {
	rdb *redis.Client
}

func NewAuthSecurityService() *AuthSecurityService {
	initLuaScripts()
	return &AuthSecurityService{
		rdb: common.RDB,
	}
}

func initLuaScripts() {
	luaScriptInitOnce.Do(func() {
		failAtomicCode := `-- auth_fail_atomic.lua
local fail_key = KEYS[1]
local lock_key = KEYS[2]
local threshold = tonumber(ARGV[1])
local fail_ttl = tonumber(ARGV[2])
local lock_ttl = tonumber(ARGV[3])

local current = redis.call('INCR', fail_key)
redis.call('EXPIRE', fail_key, fail_ttl)

if current >= threshold then
    redis.call('SET', lock_key, tostring(current), 'EX', lock_ttl)
    return {current, 1}
end

return {current, 0}
`
		successClearCode := `-- auth_success_clear.lua
redis.call('DEL', KEYS[1])
redis.call('DEL', KEYS[2])
return 1
`
		luaFailAtomicScript = redis.NewScript(failAtomicCode)
		luaSuccessClearScript = redis.NewScript(successClearCode)
	})
}

type LoginSecurityStatus struct {
	RequireTurnstile bool  `json:"require_turnstile"`
	RequireOTP       bool  `json:"require_otp"`
	HardLocked       bool  `json:"hard_locked"`
	FailCount        int64 `json:"fail_count"`
	LockExpireAt     int64 `json:"lock_expire_at,omitempty"`
}

func getUsernameHashTag(username string) string {
	clean := strings.ToLower(strings.TrimSpace(username))
	return fmt.Sprintf("{auth:%s}", clean)
}

// CheckLoginSecurity inspects the account status before password verification
func (s *AuthSecurityService) CheckLoginSecurity(ctx context.Context, username, clientIP string) (*LoginSecurityStatus, error) {
	status := &LoginSecurityStatus{}
	if username == "" {
		return status, nil
	}

	subnetKey := common.GetIPSubnetKey(clientIP)

	if common.RedisEnabled && s.rdb != nil {
		tag := getUsernameHashTag(username)
		failKey := fmt.Sprintf("rateLimit:auth:fail:%s", tag)
		lockKey := fmt.Sprintf("rateLimit:auth:softlock:%s", tag)
		ipFailKey := fmt.Sprintf("rateLimit:auth:fail:ip:%s", subnetKey)

		// Check IP high risk
		ipFailCount, _ := s.rdb.Get(ctx, ipFailKey).Int64()
		if ipFailCount >= IPHardLockThreshold {
			status.RequireTurnstile = true
			status.RequireOTP = true
		}

		// Check Soft Lock for User
		lockedVal, err := s.rdb.Get(ctx, lockKey).Result()
		if err == nil && lockedVal != "" {
			status.RequireOTP = true
			status.RequireTurnstile = true
			ttl, _ := s.rdb.TTL(ctx, lockKey).Result()
			if ttl > 0 {
				status.LockExpireAt = time.Now().Add(ttl).Unix()
			}
			return status, nil
		}

		// Check User Failure Count
		failCount, err := s.rdb.Get(ctx, failKey).Int64()
		if err == nil {
			status.FailCount = failCount
			if failCount >= LoginFailSoftLockThreshold {
				status.RequireOTP = true
				status.RequireTurnstile = true
			} else if failCount >= LoginFailTurnstileThreshold {
				status.RequireTurnstile = true
			}
		}
	} else {
		// In-Memory Fallback
		tag := getUsernameHashTag(username)
		failKey := "rateLimit:auth:fail:" + tag
		lockKey := "rateLimit:auth:softlock:" + tag

		if common.InMemoryRateLimiterInstance.IsLocked(lockKey) {
			status.RequireOTP = true
			status.RequireTurnstile = true
			return status, nil
		}
		failCount := common.InMemoryRateLimiterInstance.GetCount(failKey)
		status.FailCount = failCount
		if failCount >= LoginFailSoftLockThreshold {
			status.RequireOTP = true
			status.RequireTurnstile = true
		} else if failCount >= LoginFailTurnstileThreshold {
			status.RequireTurnstile = true
		}
	}

	return status, nil
}

// RecordLoginFailure records failure atomically via Lua
func (s *AuthSecurityService) RecordLoginFailure(ctx context.Context, username, clientIP string) (*LoginSecurityStatus, error) {
	status := &LoginSecurityStatus{}
	if username == "" {
		return status, nil
	}

	subnetKey := common.GetIPSubnetKey(clientIP)

	if common.RedisEnabled && s.rdb != nil {
		tag := getUsernameHashTag(username)
		failKey := fmt.Sprintf("rateLimit:auth:fail:%s", tag)
		lockKey := fmt.Sprintf("rateLimit:auth:softlock:%s", tag)
		ipFailKey := fmt.Sprintf("rateLimit:auth:fail:ip:%s", subnetKey)

		// Increment IP fail count
		s.rdb.Incr(ctx, ipFailKey)
		s.rdb.Expire(ctx, ipFailKey, time.Duration(IPHardLockCheckWindow)*time.Second)

		// Atomic User fail count via Lua
		keys := []string{failKey, lockKey}
		argv := []interface{}{LoginFailSoftLockThreshold, LoginFailCountTTL, LoginSoftLockTTL}
		res, err := luaFailAtomicScript.Run(ctx, s.rdb, keys, argv...).Result()
		if err != nil {
			common.SysError(fmt.Sprintf("Failed to run auth_fail_atomic lua script: %v", err))
			// Fallback standard increment
			cur, _ := s.rdb.Incr(ctx, failKey).Result()
			s.rdb.Expire(ctx, failKey, time.Duration(LoginFailCountTTL)*time.Second)
			status.FailCount = cur
			if cur >= LoginFailSoftLockThreshold {
				s.rdb.Set(ctx, lockKey, "1", time.Duration(LoginSoftLockTTL)*time.Second)
				status.RequireOTP = true
				status.RequireTurnstile = true
			} else if cur >= LoginFailTurnstileThreshold {
				status.RequireTurnstile = true
			}
			return status, nil
		}

		if slice, ok := res.([]interface{}); ok && len(slice) == 2 {
			if count, ok := slice[0].(int64); ok {
				status.FailCount = count
			}
			if isLocked, ok := slice[1].(int64); ok && isLocked == 1 {
				status.RequireOTP = true
				status.RequireTurnstile = true
				status.LockExpireAt = time.Now().Unix() + LoginSoftLockTTL
			} else if status.FailCount >= LoginFailTurnstileThreshold {
				status.RequireTurnstile = true
			}
		}
	} else {
		// In-Memory Fallback
		tag := getUsernameHashTag(username)
		failKey := "rateLimit:auth:fail:" + tag
		lockKey := "rateLimit:auth:softlock:" + tag

		cur := common.InMemoryRateLimiterInstance.Incr(failKey, time.Duration(LoginFailCountTTL)*time.Second)
		status.FailCount = cur
		if cur >= LoginFailSoftLockThreshold {
			common.InMemoryRateLimiterInstance.SetLocked(lockKey, time.Duration(LoginSoftLockTTL)*time.Second)
			status.RequireOTP = true
			status.RequireTurnstile = true
		} else if cur >= LoginFailTurnstileThreshold {
			status.RequireTurnstile = true
		}
	}

	return status, nil
}

// RecordLoginSuccess clears failure tracking atomically
func (s *AuthSecurityService) RecordLoginSuccess(ctx context.Context, username string) {
	if username == "" {
		return
	}
	if common.RedisEnabled && s.rdb != nil {
		tag := getUsernameHashTag(username)
		failKey := fmt.Sprintf("rateLimit:auth:fail:%s", tag)
		lockKey := fmt.Sprintf("rateLimit:auth:softlock:%s", tag)
		keys := []string{failKey, lockKey}
		_, _ = luaSuccessClearScript.Run(ctx, s.rdb, keys).Result()
	} else {
		tag := getUsernameHashTag(username)
		failKey := "rateLimit:auth:fail:" + tag
		lockKey := "rateLimit:auth:softlock:" + tag
		common.InMemoryRateLimiterInstance.Delete(failKey)
		common.InMemoryRateLimiterInstance.Delete(lockKey)
	}
}

// VerifyTurnstileToken performs atomic SETNX token consumption with RequestID binding
func (s *AuthSecurityService) VerifyTurnstileToken(ctx context.Context, token, requestID, clientIP string) error {
	if !common.TurnstileCheckEnabled {
		return nil
	}
	token = strings.TrimSpace(token)
	if token == "" {
		return errors.New("Turnstile token 为空")
	}

	hasher := sha256.New()
	hasher.Write([]byte(token))
	tokenHash := hex.EncodeToString(hasher.Sum(nil))

	if common.RedisEnabled && s.rdb != nil {
		idempotentKey := fmt.Sprintf("turnstile:req:%s:%s", requestID, tokenHash)
		if requestID != "" {
			if exists, _ := s.rdb.Exists(ctx, idempotentKey).Result(); exists > 0 {
				return nil // Idempotent replay safe
			}
		}

		usedKey := fmt.Sprintf("turnstile:used:%s", tokenHash)
		set, err := s.rdb.SetNX(ctx, usedKey, clientIP, 5*time.Minute).Result()
		if err != nil {
			return s.verifyWithCloudflare(token, clientIP)
		}
		if !set {
			return ErrTurnstileAlreadyUsed
		}

		if err := s.verifyWithCloudflare(token, clientIP); err != nil {
			s.rdb.Del(ctx, usedKey) // rollback on verification failure
			return err
		}

		if requestID != "" {
			s.rdb.Set(ctx, idempotentKey, "1", 30*time.Second)
		}
		return nil
	}

	// In-memory fallback
	usedKey := "turnstile:used:" + tokenHash
	if !common.InMemoryRateLimiterInstance.SetNX(usedKey, 5*time.Minute) {
		return ErrTurnstileAlreadyUsed
	}

	if err := s.verifyWithCloudflare(token, clientIP); err != nil {
		common.InMemoryRateLimiterInstance.Delete(usedKey)
		return err
	}

	return nil
}

type cloudflareTurnstileResponse struct {
	Success     bool     `json:"success"`
	ErrorCodes  []string `json:"error-codes"`
	ChallengeTS string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
}

func (s *AuthSecurityService) verifyWithCloudflare(token, clientIP string) error {
	secretKey := common.TurnstileSecretKey
	if secretKey == "" {
		secretKey = os.Getenv("TURNSTILE_SECRET_KEY")
	}
	if secretKey == "" {
		// If secret key is not set, allow
		return nil
	}

	rawRes, err := http.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", url.Values{
		"secret":   {secretKey},
		"response": {token},
		"remoteip": {clientIP},
	})
	if err != nil {
		common.SysError("Cloudflare Turnstile verification HTTP error: " + err.Error())
		return ErrTurnstileVerifyFail
	}
	defer rawRes.Body.Close()

	var res cloudflareTurnstileResponse
	err = common.DecodeJson(rawRes.Body, &res)
	if err != nil {
		common.SysError("Cloudflare Turnstile decode JSON error: " + err.Error())
		return ErrTurnstileVerifyFail
	}

	if !res.Success {
		return ErrTurnstileVerifyFail
	}

	return nil
}

// SendLoginOTP handles sending OTP code with rate limits and daily limits
func (s *AuthSecurityService) SendLoginOTP(ctx context.Context, username, email string) error {
	username = strings.ToLower(strings.TrimSpace(username))
	email = common.NormalizeEmail(email)

	if email == "" {
		return errors.New("用户未绑定邮箱，无法发送验证码")
	}

	// 1. Check cooldown (60s)
	cooldownKey := fmt.Sprintf("otp:login:%s:cooldown", username)
	dailyKey := fmt.Sprintf("otp:login:%s:daily", username)

	if common.RedisEnabled && s.rdb != nil {
		if exists, _ := s.rdb.Exists(ctx, cooldownKey).Result(); exists > 0 {
			return ErrOTPCooldown
		}

		// 2. Check daily limit (10 times)
		dailyCount, _ := s.rdb.Get(ctx, dailyKey).Int64()
		if dailyCount >= LoginOTPDailyLimit {
			return ErrOTPDailyExceeded
		}
	}

	// 3. Generate & register code
	code := common.GenerateVerificationCode(6)
	common.RegisterVerificationCodeWithKey(username, code, LoginOTPPurpose)

	// 4. Send Email
	subject := fmt.Sprintf("%s 登录安全验证码", common.SystemName)
	content := fmt.Sprintf("<p>您好，您正在尝试登录 %s。</p>"+
		"<p>您的安全验证码为: <strong>%s</strong></p>"+
		"<p>验证码 5 分钟内有效。如果不是您本人操作，请尽快修改密码！</p>", common.SystemName, code)

	err := common.SendEmail(subject, email, content)
	if err != nil {
		return err
	}

	// 5. Update cooldown and daily counters
	if common.RedisEnabled && s.rdb != nil {
		s.rdb.Set(ctx, cooldownKey, "1", 60*time.Second)
		cur, _ := s.rdb.Incr(ctx, dailyKey).Result()
		if cur == 1 {
			s.rdb.Expire(ctx, dailyKey, 24*time.Hour)
		}
		// Reset attempt counter for new OTP
		attemptKey := fmt.Sprintf("otp:login:%s:attempts", username)
		s.rdb.Del(ctx, attemptKey)
	}

	return nil
}

// VerifyLoginOTP checks the OTP with max 3 attempts
func (s *AuthSecurityService) VerifyLoginOTP(ctx context.Context, username, code string) error {
	username = strings.ToLower(strings.TrimSpace(username))
	code = strings.TrimSpace(code)

	if code == "" {
		return ErrOTPInvalid
	}

	attemptKey := fmt.Sprintf("otp:login:%s:attempts", username)

	if common.RedisEnabled && s.rdb != nil {
		attempts, _ := s.rdb.Incr(ctx, attemptKey).Result()
		s.rdb.Expire(ctx, attemptKey, 5*time.Minute)

		if attempts > LoginOTPMaxAttempts {
			common.DeleteKey(username, LoginOTPPurpose)
			return ErrOTPExpired
		}
	}

	if !common.VerifyCodeWithKey(username, code, LoginOTPPurpose) {
		return ErrOTPInvalid
	}

	// OTP valid, delete it
	common.DeleteKey(username, LoginOTPPurpose)
	return nil
}

// GetUserEmailForOTP helper to get email for user
func (s *AuthSecurityService) GetUserEmailForOTP(username string) (string, error) {
	username = strings.TrimSpace(username)
	var user model.User
	err := model.DB.Where("username = ? OR email = ?", username, username).First(&user).Error
	if err != nil {
		return "", err
	}
	return user.Email, nil
}
