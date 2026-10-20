package service

import (
	"net/url"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/pkg/uaparser"
	"github.com/gin-gonic/gin"
)

// ClientEnv represents client environment parsed from HTTP request
type ClientEnv struct {
	IP      string
	Country string
	Device  string
	OS      string
	Browser string
	Lang    string
}

// AttributionData represents attribution information for a user
type AttributionData struct {
	FirstSource   string `json:"first_source"`
	FirstMedium   string `json:"first_medium"`
	FirstCampaign string `json:"first_campaign"`
	FirstReferrer string `json:"first_referrer"`
	FirstLanding  string `json:"first_landing"`
	FirstTouchAt  int64  `json:"first_touch_at"`

	LastSource   string `json:"last_source"`
	LastMedium   string `json:"last_medium"`
	LastCampaign string `json:"last_campaign"`

	Lang string `json:"lang"`
}

// ExtractClientEnv extracts IP, country, device, OS, browser, and language from gin context
func ExtractClientEnv(c *gin.Context) ClientEnv {
	if c == nil || c.Request == nil {
		return ClientEnv{
			Device:  "unknown",
			OS:      "unknown",
			Browser: "unknown",
		}
	}

	ip := c.ClientIP()
	country := strings.TrimSpace(c.GetHeader("CF-IPCountry"))
	if country == "" {
		country = strings.TrimSpace(c.GetHeader("X-Country-Code"))
	}

	ua := c.Request.UserAgent()
	clientInfo := uaparser.Parse(ua)

	lang := extractLanguage(c)

	return ClientEnv{
		IP:      ip,
		Country: country,
		Device:  clientInfo.Device,
		OS:      clientInfo.OS,
		Browser: clientInfo.Browser,
		Lang:    lang,
	}
}

// ExtractAttributionFromContext extracts attribution data from body/query or cookies
func ExtractAttributionFromContext(c *gin.Context, explicit *AttributionData) AttributionData {
	result := AttributionData{}
	if explicit != nil {
		result = *explicit
	}

	// 1. Try parsing First Touch from Cookie if empty
	if result.FirstSource == "" && result.FirstReferrer == "" {
		if cookieVal, err := c.Cookie("attr_ft"); err == nil && cookieVal != "" {
			var ft AttributionData
			if unescaped, err := url.QueryUnescape(cookieVal); err == nil {
				if err := common.Unmarshal([]byte(unescaped), &ft); err == nil {
					result.FirstSource = ft.FirstSource
					result.FirstMedium = ft.FirstMedium
					result.FirstCampaign = ft.FirstCampaign
					result.FirstReferrer = ft.FirstReferrer
					result.FirstLanding = ft.FirstLanding
					result.FirstTouchAt = ft.FirstTouchAt
				}
			}
		}
	}

	// 2. Try parsing Last Touch from Cookie if empty
	if result.LastSource == "" {
		if cookieVal, err := c.Cookie("attr_lt"); err == nil && cookieVal != "" {
			var lt AttributionData
			if unescaped, err := url.QueryUnescape(cookieVal); err == nil {
				if err := common.Unmarshal([]byte(unescaped), &lt); err == nil {
					result.LastSource = lt.LastSource
					result.LastMedium = lt.LastMedium
					result.LastCampaign = lt.LastCampaign
				}
			}
		}
	}

	// Fallback: if last touch is still empty, copy from first touch
	if result.LastSource == "" && result.FirstSource != "" {
		result.LastSource = result.FirstSource
		result.LastMedium = result.FirstMedium
		result.LastCampaign = result.FirstCampaign
	}

	return result
}

func extractLanguage(c *gin.Context) string {
	acceptLang := c.GetHeader("Accept-Language")
	if acceptLang == "" {
		return ""
	}
	parts := strings.Split(acceptLang, ",")
	if len(parts) > 0 {
		primary := strings.TrimSpace(parts[0])
		if semi := strings.Index(primary, ";"); semi != -1 {
			primary = primary[:semi]
		}
		return strings.TrimSpace(primary)
	}
	return ""
}

// FillTopUpPaymentEnv fills payment environment fields to any TopUp
func FillTopUpPaymentEnv(c *gin.Context, topUp *model.TopUp) {
	if topUp == nil || c == nil {
		return
	}
	env := ExtractClientEnv(c)
	topUp.PayIp = env.IP
	topUp.PayCountry = env.Country
	topUp.PayDevice = env.Device
	topUp.PayOs = env.OS
	topUp.PayBrowser = env.Browser
}

// FillSubscriptionOrderPaymentEnv fills payment environment fields to any SubscriptionOrder
func FillSubscriptionOrderPaymentEnv(c *gin.Context, order *model.SubscriptionOrder) {
	if order == nil || c == nil {
		return
	}
	env := ExtractClientEnv(c)
	order.PayIp = env.IP
	order.PayCountry = env.Country
	order.PayDevice = env.Device
	order.PayOs = env.OS
	order.PayBrowser = env.Browser
}

