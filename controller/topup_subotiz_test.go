package controller

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/setting"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSubotizSignatureVerification(t *testing.T) {
	apiKey := "test_subotiz_secret_key_123"
	timestamp := "1725158400000"
	body := []byte(`{"type":"v2.trades.succeeded","data":{"order_id":"subotiz_1_123_abc","trade_id":"trade_999"}}`)

	sig := generateSubotizSignature(timestamp, body, apiKey)
	assert.NotEmpty(t, sig)

	// Valid signature
	valid := verifySubotizSignature(timestamp, body, sig, apiKey)
	assert.True(t, valid)

	// Tampered body
	invalidBody := []byte(`{"type":"v2.trades.succeeded","data":{"order_id":"subotiz_1_123_abc","trade_id":"trade_998"}}`)
	validTampered := verifySubotizSignature(timestamp, invalidBody, sig, apiKey)
	assert.False(t, validTampered)

	// Tampered timestamp
	validTimestamp := verifySubotizSignature("1725158400001", body, sig, apiKey)
	assert.False(t, validTimestamp)
}

func TestSubotizCheckCallbackUrl(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/subotiz/webhook", SubotizWebhook)

	body := []byte(`{"id":"545440011265267736","type":"check_callback_url","created":"2026-09-01T10:00:00Z"}`)
	req, _ := http.NewRequest("POST", "/subotiz/webhook", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "endpoint available")
}

func TestSubotizWebhookUnauthorized(t *testing.T) {
	originalTestMode := setting.SubotizTestMode
	originalApiKey := setting.SubotizApiKey
	defer func() {
		setting.SubotizTestMode = originalTestMode
		setting.SubotizApiKey = originalApiKey
	}()

	setting.SubotizTestMode = false
	setting.SubotizApiKey = "my_secret_key"

	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/subotiz/webhook", SubotizWebhook)

	body := []byte(`{"id":"1","type":"v2.trades.succeeded","data":{"order_id":"subotiz_1"}}`)
	req, _ := http.NewRequest("POST", "/subotiz/webhook", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Timestamp", "1725158400000")
	req.Header.Set("X-Signature", "wrong_signature")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}
