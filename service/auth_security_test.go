package service

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
)

func TestAuthSecurityService_Logic(t *testing.T) {
	common.RedisEnabled = false // Test in-memory engine
	svc := NewAuthSecurityService()
	ctx := context.Background()

	testUser := "test_security_user_" + fmt.Sprintf("%d", time.Now().UnixNano())
	clientIP := "192.168.1.100"

	// 1. Initial State -> Should be clean
	status, err := svc.CheckLoginSecurity(ctx, testUser, clientIP)
	if err != nil {
		t.Fatalf("CheckLoginSecurity failed: %v", err)
	}
	if status.RequireTurnstile || status.RequireOTP || status.FailCount != 0 {
		t.Errorf("Initial status should be clean, got %+v", status)
	}

	// 2. Record 2 failures -> Under threshold 3
	for i := 1; i <= 2; i++ {
		st, err := svc.RecordLoginFailure(ctx, testUser, clientIP)
		if err != nil {
			t.Fatalf("RecordLoginFailure failed: %v", err)
		}
		if st.RequireTurnstile || st.RequireOTP {
			t.Errorf("Failure %d should not trigger Turnstile, got %+v", i, st)
		}
	}

	// 3. Record 3rd failure -> Should trigger Turnstile
	st, err := svc.RecordLoginFailure(ctx, testUser, clientIP)
	if err != nil {
		t.Fatalf("RecordLoginFailure failed: %v", err)
	}
	if !st.RequireTurnstile {
		t.Errorf("3rd failure must trigger RequireTurnstile, got %+v", st)
	}

	// 4. Record up to 10 failures -> Should trigger Soft-Lock (RequireOTP)
	for i := 4; i <= 10; i++ {
		st, err = svc.RecordLoginFailure(ctx, testUser, clientIP)
		if err != nil {
			t.Fatalf("RecordLoginFailure failed: %v", err)
		}
	}
	if !st.RequireOTP {
		t.Errorf("10th failure must trigger RequireOTP, got %+v", st)
	}

	// 5. CheckLoginSecurity again -> Must reflect Soft-Lock state
	chk, err := svc.CheckLoginSecurity(ctx, testUser, clientIP)
	if err != nil {
		t.Fatalf("CheckLoginSecurity failed: %v", err)
	}
	if !chk.RequireOTP || !chk.RequireTurnstile {
		t.Errorf("CheckLoginSecurity after 10 failures must require OTP and Turnstile, got %+v", chk)
	}

	// 6. RecordLoginSuccess -> Should clean all failure counters
	svc.RecordLoginSuccess(ctx, testUser)

	cleanStatus, err := svc.CheckLoginSecurity(ctx, testUser, clientIP)
	if err != nil {
		t.Fatalf("CheckLoginSecurity failed: %v", err)
	}
	if cleanStatus.RequireOTP || cleanStatus.RequireTurnstile || cleanStatus.FailCount != 0 {
		t.Errorf("Status after success must be clean, got %+v", cleanStatus)
	}
}

func TestEmailNormalizationAndDisposable(t *testing.T) {
	// Gmail normalization
	if got := common.NormalizeEmail("Test.User+alias123@Gmail.com"); got != "testuser@gmail.com" {
		t.Errorf("NormalizeEmail(Gmail) failed: got %s, want testuser@gmail.com", got)
	}

	// Outlook +alias normalization
	if got := common.NormalizeEmail("MyAccount+test@Outlook.com"); got != "myaccount@outlook.com" {
		t.Errorf("NormalizeEmail(Outlook) failed: got %s, want myaccount@outlook.com", got)
	}

	// Disposable email check
	if !common.IsDisposableEmail("abc@mailinator.com") {
		t.Errorf("IsDisposableEmail(mailinator.com) should return true")
	}
	if !common.IsDisposableEmail("xyz@tempmail.com") {
		t.Errorf("IsDisposableEmail(tempmail.com) should return true")
	}
	if common.IsDisposableEmail("gooduser@gmail.com") {
		t.Errorf("IsDisposableEmail(gmail.com) should return false")
	}
}
