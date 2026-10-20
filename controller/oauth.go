package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/oauth"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// providerParams returns map with Provider key for i18n templates
func providerParams(name string) map[string]any {
	return map[string]any{"Provider": name}
}

// OAuthStateData stores state metadata for recovery and validation
type OAuthStateData struct {
	State     string `json:"state"`
	Aff       string `json:"aff,omitempty"`
	Redirect  string `json:"redirect,omitempty"`
	Attr      string `json:"attr,omitempty"`
	CreatedAt int64  `json:"created_at"`
}

var (
	oauthStateMemCache sync.Map // state string -> OAuthStateData
)

const (
	oauthStateTTL         = 15 * time.Minute
	maxSessionOAuthStates = 5
)

// SaveOAuthState saves the newly generated state to session (with sliding window) and cache
func SaveOAuthState(c *gin.Context, session sessions.Session, state string, aff string, redirect string, attr string) {
	now := time.Now().Unix()
	stateData := OAuthStateData{
		State:     state,
		Aff:       aff,
		Redirect:  redirect,
		Attr:      attr,
		CreatedAt: now,
	}

	// 1. Maintain sliding window of recent states in session (prevents rapid-click 403)
	var recentStates []string
	if rawStates := session.Get("oauth_states"); rawStates != nil {
		switch v := rawStates.(type) {
		case string:
			if v != "" {
				_ = common.UnmarshalJsonStr(v, &recentStates)
			}
		case []string:
			recentStates = v
		}
	}
	recentStates = append(recentStates, state)
	if len(recentStates) > maxSessionOAuthStates {
		recentStates = recentStates[len(recentStates)-maxSessionOAuthStates:]
	}
	if statesJson, err := common.Marshal(recentStates); err == nil {
		session.Set("oauth_states", string(statesJson))
	}
	// Keep latest for backward compatibility
	session.Set("oauth_state", state)

	// 2. Save state data in memory cache (with TTL cleanup)
	oauthStateMemCache.Store(state, stateData)
	go cleanExpiredOAuthStates(now)

	// 3. If Redis is enabled, store in Redis with 15-minute TTL
	if common.RedisEnabled {
		if dataBytes, err := common.Marshal(stateData); err == nil {
			_ = common.RedisSet("oauth:state:"+state, string(dataBytes), oauthStateTTL)
		}
	}
}

func cleanExpiredOAuthStates(now int64) {
	oauthStateMemCache.Range(func(k, v any) bool {
		if item, ok := v.(OAuthStateData); ok {
			if now-item.CreatedAt > int64(oauthStateTTL/time.Second) {
				oauthStateMemCache.Delete(k)
			}
		}
		return true
	})
}

// ValidateAndConsumeOAuthState validates state against session and server cache, and consumes it
func ValidateAndConsumeOAuthState(c *gin.Context, session sessions.Session, state string) bool {
	if state == "" {
		return false
	}

	var matched bool
	var matchedData *OAuthStateData

	// 1. Check Session (latest state or any state in the recent sliding window)
	if sessionState := session.Get("oauth_state"); sessionState != nil {
		if s, ok := sessionState.(string); ok && s == state {
			matched = true
		}
	}

	if !matched {
		if rawStates := session.Get("oauth_states"); rawStates != nil {
			var states []string
			if strVal, ok := rawStates.(string); ok && strVal != "" {
				_ = common.UnmarshalJsonStr(strVal, &states)
			} else if sliceVal, ok := rawStates.([]string); ok {
				states = sliceVal
			}
			for _, s := range states {
				if s == state {
					matched = true
					break
				}
			}
		}
	}

	// 2. Check Server-side Cache (Memory & Redis fallback if session cookie was lost or rotated)
	if !matched {
		if val, ok := oauthStateMemCache.Load(state); ok {
			if d, ok := val.(OAuthStateData); ok {
				if time.Now().Unix()-d.CreatedAt <= int64(oauthStateTTL/time.Second) {
					matched = true
					matchedData = &d
				} else {
					oauthStateMemCache.Delete(state)
				}
			}
		}
	}

	if !matched && common.RedisEnabled {
		if valStr, err := common.RedisGet("oauth:state:" + state); err == nil && valStr != "" {
			var d OAuthStateData
			if err := common.UnmarshalJsonStr(valStr, &d); err == nil {
				matched = true
				matchedData = &d
			}
		}
	}

	if !matched {
		return false
	}

	// 3. Consume state to prevent replay attacks
	oauthStateMemCache.Delete(state)
	if common.RedisEnabled {
		_ = common.RedisDel("oauth:state:" + state)
	}

	// Remove from session states list
	if rawStates := session.Get("oauth_states"); rawStates != nil {
		var states []string
		if strVal, ok := rawStates.(string); ok && strVal != "" {
			_ = common.UnmarshalJsonStr(strVal, &states)
		} else if sliceVal, ok := rawStates.([]string); ok {
			states = sliceVal
		}
		var remaining []string
		for _, s := range states {
			if s != state {
				remaining = append(remaining, s)
			}
		}
		if len(remaining) > 0 {
			if statesJson, err := common.Marshal(remaining); err == nil {
				session.Set("oauth_states", string(statesJson))
			}
			session.Set("oauth_state", remaining[len(remaining)-1])
		} else {
			session.Delete("oauth_states")
			session.Delete("oauth_state")
		}
	} else {
		if session.Get("oauth_state") == state {
			session.Delete("oauth_state")
		}
	}

	// 4. Restore metadata if session was missing or incomplete
	if matchedData != nil {
		if matchedData.Aff != "" && session.Get("aff") == nil {
			session.Set("aff", matchedData.Aff)
		}
		if matchedData.Redirect != "" && session.Get("oauth_redirect") == nil {
			session.Set("oauth_redirect", matchedData.Redirect)
		}
		if matchedData.Attr != "" && session.Get("oauth_attr") == nil {
			session.Set("oauth_attr", matchedData.Attr)
		}
	}

	_ = session.Save()
	return true
}

// GenerateOAuthCode generates a state code for OAuth CSRF protection
func GenerateOAuthCode(c *gin.Context) {
	session := sessions.Default(c)
	state := common.GetRandomString(12)
	affCode := c.Query("aff")
	if affCode != "" {
		session.Set("aff", affCode)
	}
	redirect := c.Query("redirect")
	if redirect != "" {
		session.Set("oauth_redirect", redirect)
	} else {
		session.Delete("oauth_redirect")
	}

	var explicit service.AttributionData
	explicit.FirstSource = c.Query("first_source")
	explicit.FirstMedium = c.Query("first_medium")
	explicit.FirstCampaign = c.Query("first_campaign")
	explicit.FirstReferrer = c.Query("first_referrer")
	explicit.FirstLanding = c.Query("first_landing")
	if ts, err := strconv.ParseInt(c.Query("first_touch_at"), 10, 64); err == nil {
		explicit.FirstTouchAt = ts
	}
	explicit.LastSource = c.Query("last_source")
	explicit.LastMedium = c.Query("last_medium")
	explicit.LastCampaign = c.Query("last_campaign")
	explicit.Lang = c.Query("register_lang")

	var attrStr string
	attr := service.ExtractAttributionFromContext(c, &explicit)
	if attr.FirstSource != "" || attr.FirstReferrer != "" || attr.LastSource != "" {
		if attrJson, err := common.Marshal(attr); err == nil {
			attrStr = string(attrJson)
			session.Set("oauth_attr", attrStr)
		}
	}

	SaveOAuthState(c, session, state, affCode, redirect, attrStr)

	err := session.Save()
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    state,
	})
}

// HandleOAuth handles OAuth callback for all standard OAuth providers
func HandleOAuth(c *gin.Context) {
	providerName := c.Param("provider")
	provider := oauth.GetProvider(providerName)
	if provider == nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": i18n.T(c, i18n.MsgOAuthUnknownProvider),
		})
		return
	}

	session := sessions.Default(c)

	// 1. Validate state (CSRF protection) with multi-state and cache fallback
	state := c.Query("state")
	if !ValidateAndConsumeOAuthState(c, session, state) {
		c.JSON(http.StatusForbidden, gin.H{
			"success": false,
			"message": i18n.T(c, i18n.MsgOAuthStateInvalid),
		})
		return
	}

	// 2. Check if user is already logged in (bind flow)
	username := session.Get("username")
	if username != nil {
		handleOAuthBind(c, provider)
		return
	}

	// 3. Check if provider is enabled
	if !provider.IsEnabled() {
		common.ApiErrorI18n(c, i18n.MsgOAuthNotEnabled, providerParams(provider.GetName()))
		return
	}

	// 4. Handle error from provider
	errorCode := c.Query("error")
	if errorCode != "" {
		errorDescription := c.Query("error_description")
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": errorDescription,
		})
		return
	}

	// 5. Exchange code for token
	code := c.Query("code")
	token, err := provider.ExchangeToken(c.Request.Context(), code, c)
	if err != nil {
		handleOAuthError(c, err)
		return
	}

	// 6. Get user info
	oauthUser, err := provider.GetUserInfo(c.Request.Context(), token)
	if err != nil {
		handleOAuthError(c, err)
		return
	}

	// 7. Find or create user
	user, err := findOrCreateOAuthUser(c, provider, oauthUser, session)
	if err != nil {
		switch e := err.(type) {
		case *OAuthUserDeletedError:
			common.ApiErrorI18n(c, i18n.MsgOAuthUserDeleted)
		case *OAuthRegistrationDisabledError:
			common.ApiErrorI18n(c, i18n.MsgUserRegisterDisabled)
		case *OAuthGitHubCriteriaError:
			if e.Params != nil {
				common.ApiErrorI18n(c, e.MsgKey, e.Params)
			} else {
				common.ApiErrorI18n(c, e.MsgKey)
			}
		default:
			common.ApiError(c, err)
		}
		return
	}

	// 8. Check user status
	if user.Status != common.UserStatusEnabled {
		common.ApiErrorI18n(c, i18n.MsgOAuthUserBanned)
		return
	}

	// 9. Setup login
	setupLogin(user, c)
}

// handleOAuthBind handles binding OAuth account to existing user
func handleOAuthBind(c *gin.Context, provider oauth.Provider) {
	if !provider.IsEnabled() {
		common.ApiErrorI18n(c, i18n.MsgOAuthNotEnabled, providerParams(provider.GetName()))
		return
	}

	// Exchange code for token
	code := c.Query("code")
	token, err := provider.ExchangeToken(c.Request.Context(), code, c)
	if err != nil {
		handleOAuthError(c, err)
		return
	}

	// Get user info
	oauthUser, err := provider.GetUserInfo(c.Request.Context(), token)
	if err != nil {
		handleOAuthError(c, err)
		return
	}

	// Check if this OAuth account is already bound (check both new ID and legacy ID)
	if provider.IsUserIDTaken(oauthUser.ProviderUserID) {
		common.ApiErrorI18n(c, i18n.MsgOAuthAlreadyBound, providerParams(provider.GetName()))
		return
	}
	// Also check legacy ID to prevent duplicate bindings during migration period
	if legacyID, ok := oauthUser.Extra["legacy_id"].(string); ok && legacyID != "" {
		if provider.IsUserIDTaken(legacyID) {
			common.ApiErrorI18n(c, i18n.MsgOAuthAlreadyBound, providerParams(provider.GetName()))
			return
		}
	}

	// Get current user from session
	session := sessions.Default(c)
	id := session.Get("id")
	user := model.User{Id: id.(int)}
	err = user.FillUserById()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	// Handle binding based on provider type
	if genericProvider, ok := provider.(*oauth.GenericOAuthProvider); ok {
		// Custom provider: use user_oauth_bindings table
		err = model.UpdateUserOAuthBinding(user.Id, genericProvider.GetProviderId(), oauthUser.ProviderUserID)
		if err != nil {
			common.ApiError(c, err)
			return
		}
	} else {
		// Built-in provider: update user record directly
		provider.SetProviderUserID(&user, oauthUser.ProviderUserID)
		if user.Email == "" && oauthUser.Email != "" {
			user.Email = oauthUser.Email
		}
		err = user.Update(false)
		if err != nil {
			common.ApiError(c, err)
			return
		}
	}

	// OAuth binding reward logic (Scheme 1)
	if common.QuotaForNewUser > 0 {
		var count int64
		model.DB.Model(&model.Log{}).Where("user_id = ? AND type = ? AND (content LIKE ? OR content LIKE ?)", user.Id, model.LogTypeSystem, "%注册赠送%", "%绑定赠送%").Count(&count)
		if count == 0 {
			_ = model.IncreaseUserQuota(user.Id, common.QuotaForNewUser, true)
			model.RecordLog(user.Id, model.LogTypeSystem, fmt.Sprintf("%s绑定赠送 %s", provider.GetName(), logger.LogQuota(common.QuotaForNewUser)))
		}
	}

	common.ApiSuccessI18n(c, i18n.MsgOAuthBindSuccess, gin.H{
		"action": "bind",
	})
}

// findOrCreateOAuthUser finds existing user or creates new user
func findOrCreateOAuthUser(c *gin.Context, provider oauth.Provider, oauthUser *oauth.OAuthUser, session sessions.Session) (*model.User, error) {
	user := &model.User{}

	// Check if user already exists with new ID
	if provider.IsUserIDTaken(oauthUser.ProviderUserID) {
		err := provider.FillUserByProviderID(user, oauthUser.ProviderUserID)
		if err != nil {
			return nil, err
		}
		// Check if user has been deleted
		if user.Id == 0 {
			return nil, &OAuthUserDeletedError{}
		}
		// Backfill email if it is currently empty but we retrieved one from OAuth
		if user.Email == "" && oauthUser.Email != "" {
			user.Email = oauthUser.Email
			_ = model.DB.Model(user).Update("email", user.Email).Error
			common.SysLog(fmt.Sprintf("[OAuth] Backfilled email %s for user %d during login", user.Email, user.Id))
		}
		return user, nil
	}

	// Try to find user with legacy ID (for GitHub migration from login to numeric ID)
	if legacyID, ok := oauthUser.Extra["legacy_id"].(string); ok && legacyID != "" {
		if provider.IsUserIDTaken(legacyID) {
			err := provider.FillUserByProviderID(user, legacyID)
			if err != nil {
				return nil, err
			}
			if user.Id != 0 {
				// Found user with legacy ID, migrate to new ID
				common.SysLog(fmt.Sprintf("[OAuth] Migrating user %d from legacy_id=%s to new_id=%s",
					user.Id, legacyID, oauthUser.ProviderUserID))
				if err := user.UpdateGitHubId(oauthUser.ProviderUserID); err != nil {
					common.SysError(fmt.Sprintf("[OAuth] Failed to migrate user %d: %s", user.Id, err.Error()))
					// Continue with login even if migration fails
				}
				return user, nil
			}
		}
	}

	// User doesn't exist, create new user if registration is enabled
	if !common.RegisterEnabled {
		return nil, &OAuthRegistrationDisabledError{}
	}

	if err := middleware.CheckRegisterIPRateLimit(c); err != nil {
		return nil, err
	}

	// Validate GitHub account criteria if provider is GitHub
	if provider.GetName() == "GitHub" {
		if createdAtStr, ok := oauthUser.Extra["created_at"].(string); ok && createdAtStr != "" {
			createdAtTime, err := time.Parse(time.RFC3339, createdAtStr)
			if err == nil {
				ageDays := int(time.Since(createdAtTime).Hours() / 24)
				if common.GitHubMinAccountAgeDays > 0 && ageDays < common.GitHubMinAccountAgeDays {
					return nil, &OAuthGitHubCriteriaError{
						MsgKey: i18n.MsgGitHubAccountAgeRequirement,
						Params: map[string]any{"MinAge": common.GitHubMinAccountAgeDays},
					}
				}
			}
		}
		if followers, ok := oauthUser.Extra["followers"].(int); ok {
			if common.GitHubMinFollowers > 0 && followers < common.GitHubMinFollowers {
				return nil, &OAuthGitHubCriteriaError{
					MsgKey: i18n.MsgGitHubFollowersRequirement,
					Params: map[string]any{"MinFollowers": common.GitHubMinFollowers},
				}
			}
		}
		if publicRepos, ok := oauthUser.Extra["public_repos"].(int); ok {
			if common.GitHubMinPublicRepos > 0 && publicRepos < common.GitHubMinPublicRepos {
				return nil, &OAuthGitHubCriteriaError{
					MsgKey: i18n.MsgGitHubReposRequirement,
					Params: map[string]any{"MinRepos": common.GitHubMinPublicRepos},
				}
			}
		}
	}

	// Set up new user
	user.Username = provider.GetProviderPrefix() + strconv.Itoa(model.GetMaxUserId()+1)

	if oauthUser.Username != "" {
		if exists, err := model.CheckUserExistOrDeleted(oauthUser.Username, ""); err == nil && !exists {
			// 防止索引退化
			if len(oauthUser.Username) <= model.UserNameMaxLength {
				user.Username = oauthUser.Username
			}
		}
	}

	if oauthUser.DisplayName != "" {
		user.DisplayName = oauthUser.DisplayName
	} else if oauthUser.Username != "" {
		user.DisplayName = oauthUser.Username
	} else {
		user.DisplayName = provider.GetName() + " User"
	}
	if oauthUser.Email != "" {
		user.Email = oauthUser.Email
	}
	user.Role = common.RoleCommonUser
	user.Status = common.UserStatusEnabled

	// Attribution & Client Environment
	clientEnv := service.ExtractClientEnv(c)
	attr := service.ExtractAttributionFromContext(c, nil)
	if attr.FirstSource == "" && attr.FirstReferrer == "" {
		if savedAttr, ok := session.Get("oauth_attr").(string); ok && savedAttr != "" {
			var sessionAttr service.AttributionData
			if err := common.Unmarshal([]byte(savedAttr), &sessionAttr); err == nil {
				attr = sessionAttr
			}
		}
	}
	user.FirstSource = attr.FirstSource
	user.FirstMedium = attr.FirstMedium
	user.FirstCampaign = attr.FirstCampaign
	user.FirstReferrer = attr.FirstReferrer
	user.FirstLanding = attr.FirstLanding
	user.FirstTouchAt = attr.FirstTouchAt
	user.LastSource = attr.LastSource
	user.LastMedium = attr.LastMedium
	user.LastCampaign = attr.LastCampaign
	user.RegisterIp = clientEnv.IP
	user.RegisterCountry = clientEnv.Country
	user.RegisterDevice = clientEnv.Device
	user.RegisterOs = clientEnv.OS
	user.RegisterBrowser = clientEnv.Browser
	user.RegisterLang = clientEnv.Lang

	// Handle affiliate code
	affCode := session.Get("aff")
	inviterId := 0
	if affCode != nil {
		inviterId, _ = model.GetUserIdByAffCode(affCode.(string))
	}

	// Use transaction to ensure user creation and OAuth binding are atomic
	if genericProvider, ok := provider.(*oauth.GenericOAuthProvider); ok {
		// Custom provider: create user and binding in a transaction
		err := model.DB.Transaction(func(tx *gorm.DB) error {
			// Create user
			if err := user.InsertWithTx(tx, inviterId); err != nil {
				return err
			}

			// Create OAuth binding
			binding := &model.UserOAuthBinding{
				UserId:         user.Id,
				ProviderId:     genericProvider.GetProviderId(),
				ProviderUserId: oauthUser.ProviderUserID,
			}
			if err := model.CreateUserOAuthBindingWithTx(tx, binding); err != nil {
				return err
			}

			return nil
		})
		if err != nil {
			return nil, err
		}

		// Perform post-transaction tasks (logs, sidebar config, inviter rewards)
		user.FinalizeOAuthUserCreation(inviterId, provider.GetName())
	} else {
		// Built-in provider: create user and update provider ID in a transaction
		err := model.DB.Transaction(func(tx *gorm.DB) error {
			// Create user
			if err := user.InsertWithTx(tx, inviterId); err != nil {
				return err
			}

			// Set the provider user ID on the user model and update
			provider.SetProviderUserID(user, oauthUser.ProviderUserID)
			if err := tx.Model(user).Updates(map[string]interface{}{
				"github_id":   user.GitHubId,
				"discord_id":  user.DiscordId,
				"google_id":   user.GoogleId,
				"oidc_id":     user.OidcId,
				"linux_do_id": user.LinuxDOId,
				"wechat_id":   user.WeChatId,
				"telegram_id": user.TelegramId,
			}).Error; err != nil {
				return err
			}

			return nil
		})
		if err != nil {
			return nil, err
		}

		// Perform post-transaction tasks
		user.FinalizeOAuthUserCreation(inviterId, provider.GetName())
	}

	middleware.RecordRegisterIPRateLimit(c)

	return user, nil
}

// Error types for OAuth
type OAuthUserDeletedError struct{}

func (e *OAuthUserDeletedError) Error() string {
	return "user has been deleted"
}

type OAuthRegistrationDisabledError struct{}

func (e *OAuthRegistrationDisabledError) Error() string {
	return "registration is disabled"
}

type OAuthGitHubCriteriaError struct {
	MsgKey string
	Params map[string]any
}

func (e *OAuthGitHubCriteriaError) Error() string {
	return e.MsgKey
}

// handleOAuthError handles OAuth errors and returns translated message
func handleOAuthError(c *gin.Context, err error) {
	switch e := err.(type) {
	case *oauth.OAuthError:
		if e.Params != nil {
			common.ApiErrorI18n(c, e.MsgKey, e.Params)
		} else {
			common.ApiErrorI18n(c, e.MsgKey)
		}
	case *oauth.AccessDeniedError:
		common.ApiErrorMsg(c, e.Message)
	case *oauth.TrustLevelError:
		common.ApiErrorI18n(c, i18n.MsgOAuthTrustLevelLow)
	default:
		common.ApiError(c, err)
	}
}
