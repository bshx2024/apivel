package router

import (
	"html"
	"net/url"
	"regexp"
	"strings"
)

const (
	canonicalOrigin      = "https://apivel.com"
	defaultRobotsContent = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
	noIndexRobotsContent = "noindex, nofollow"
)

var (
	reCanonicalTag    = regexp.MustCompile(`(?is)<link\s+[^>]*rel=["']canonical["'][^>]*>`)
	reRobotsMetaTag   = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']robots["'][^>]*>`)
	reOgURLTag        = regexp.MustCompile(`(?is)<meta\s+[^>]*property=["']og:url["'][^>]*>`)
	reTwitterURLTag   = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']twitter:url["'][^>]*>`)
	reTitleTag        = regexp.MustCompile(`(?is)<title>.*?</title>`)
	reMetaTitleTag    = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']title["'][^>]*>`)
	reMetaDescTag     = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']description["'][^>]*>`)
	reOgTitleTag      = regexp.MustCompile(`(?is)<meta\s+[^>]*property=["']og:title["'][^>]*>`)
	reOgDescTag       = regexp.MustCompile(`(?is)<meta\s+[^>]*property=["']og:description["'][^>]*>`)
	reTwitterTitleTag = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']twitter:title["'][^>]*>`)
	reTwitterDescTag  = regexp.MustCompile(`(?is)<meta\s+[^>]*name=["']twitter:description["'][^>]*>`)
	reHeadCloseTag    = regexp.MustCompile(`(?i)</head>`)
)

var canonicalPathAliases = map[string]string{
	"/login":          "/sign-in",
	"/register":       "/sign-up",
	"/privacy-policy": "/privacy",
	"/user-agreement": "/terms",
}

var noIndexPrefixes = []string{
	"/forgot-password",
	"/reset",
	"/user/reset",
	"/otp",
	"/oauth",
	"/setup",
	"/console",
	"/dashboard",
	"/playground",
	"/wallet",
	"/keys",
	"/usage-logs",
	"/profile",
	"/channels",
	"/users",
	"/system-settings",
	"/subscriptions",
	"/redemption-codes",
	"/chat",
	"/chat2link",
	"/models",
}

type seoMeta struct {
	title       string
	description string
}

var staticRouteSEOMeta = map[string]seoMeta{
	"/pricing": {
		title:       "Plans & Model Pricing Directory (DeepSeek, Qwen, GLM, Kimi) | APIVEL",
		description: "Compare live per-million token pricing, developer credit packs, and PayPal pay-as-you-go tiers for DeepSeek V4.1 Flash, Qwen 3.8, GLM-5.3, and Kimi K3 on APIVEL.",
	},
	"/about": {
		title:       "About APIVEL | High-Availability Chinese AI API Gateway",
		description: "Learn about APIVEL's multi-cluster failover architecture, transparent per-token pricing, and OpenAI-compatible gateway for DeepSeek, Qwen, GLM, and Kimi.",
	},
	"/docs": {
		title:       "Developer Documentation | APIVEL",
		description: "Quickstart guides, OpenAI SDK integration, authentication, and model endpoint documentation for the APIVEL API gateway.",
	},
	"/rankings": {
		title:       "AI Model Usage & Performance Rankings | APIVEL",
		description: "Explore real-time model usage trends and developer rankings across DeepSeek, Qwen, GLM, and Kimi on APIVEL.",
	},
	"/sign-in": {
		title:       "Sign In | APIVEL",
		description: "Sign in to your APIVEL developer console to manage API keys, usage logs, and pay-as-you-go credits.",
	},
	"/sign-up": {
		title:       "Create an Account — $0.20 Free Credit | APIVEL",
		description: "Register an APIVEL developer account with zero KYC and get $0.20 free API credit for DeepSeek, Qwen, GLM, and Kimi.",
	},
	"/privacy": {
		title:       "Privacy Policy | APIVEL",
		description: "Read the APIVEL Privacy Policy covering account information, billing records, API telemetry, and data protection.",
	},
	"/terms": {
		title:       "Terms of Service | APIVEL",
		description: "Read the APIVEL Terms of Service governing platform access, API usage, billing, and acceptable use.",
	},
	"/refund": {
		title:       "Refund Policy | APIVEL",
		description: "Review APIVEL's refund policy and eligibility terms for prepaid API credits and developer packs.",
	},
	"/contact": {
		title:       "Contact | APIVEL",
		description: "Contact APIVEL support and engineering for API gateway assistance, billing inquiries, and enterprise SLA plans.",
	},
	"/acceptable-use": {
		title:       "Acceptable Use Policy | APIVEL",
		description: "Review APIVEL's Acceptable Use Policy for API gateway requests, security, and compliance standards.",
	},
	"/review-info": {
		title:       "Business Review Info | APIVEL",
		description: "Company, service architecture, and compliance information for APIVEL operated by Astrapix LLC.",
	},
}

func normalizeCanonicalPath(rawPath string) string {
	clean := strings.TrimSpace(rawPath)
	if clean == "" {
		return "/"
	}
	if !strings.HasPrefix(clean, "/") {
		clean = "/" + clean
	}
	if len(clean) > 1 {
		clean = strings.TrimRight(clean, "/")
		if clean == "" {
			clean = "/"
		}
	}
	if alias, ok := canonicalPathAliases[clean]; ok {
		clean = alias
	}
	return clean
}

func hasNoIndexPrefix(cleanPath string) bool {
	for _, prefix := range noIndexPrefixes {
		if cleanPath == prefix || strings.HasPrefix(cleanPath, prefix+"/") {
			return true
		}
	}
	return false
}

func shouldNoIndexRequest(cleanPath string, query url.Values) bool {
	if query != nil && query.Has("redirect") {
		return true
	}
	return hasNoIndexPrefix(cleanPath)
}

func buildCanonicalURL(cleanPath string) string {
	u := url.URL{
		Scheme: "https",
		Host:   "apivel.com",
		Path:   cleanPath,
	}
	return u.String()
}

func routeSEOHeadMeta(cleanPath string) (seoMeta, bool) {
	if meta, ok := staticRouteSEOMeta[cleanPath]; ok {
		return meta, true
	}
	if strings.HasPrefix(cleanPath, "/pricing/") {
		modelID := strings.TrimPrefix(cleanPath, "/pricing/")
		if modelID != "" && !strings.Contains(modelID, "/") {
			return seoMeta{
				title:       modelID + " API Pricing & Token Rates | APIVEL",
				description: "Check live " + modelID + " API pricing per 1M input and output tokens, context window, and OpenAI-compatible integration on APIVEL.",
			}, true
		}
	}
	return seoMeta{}, false
}

func replaceOrInsertHeadTag(doc string, re *regexp.Regexp, tag string) string {
	if re.MatchString(doc) {
		return re.ReplaceAllLiteralString(doc, tag)
	}
	if loc := reHeadCloseTag.FindStringIndex(doc); loc != nil {
		return doc[:loc[0]] + "  " + tag + "\n" + doc[loc[0]:]
	}
	return doc
}

func applyRouteSEOToHTML(page []byte, rawPath string, query url.Values) ([]byte, bool) {
	cleanPath := normalizeCanonicalPath(rawPath)
	noIndex := shouldNoIndexRequest(cleanPath, query)
	doc := string(page)

	if noIndex {
		// Remove canonical on noindex pages so crawlers do not receive conflicting signals.
		doc = reCanonicalTag.ReplaceAllLiteralString(doc, "")
		doc = replaceOrInsertHeadTag(doc, reRobotsMetaTag, `<meta name="robots" content="`+noIndexRobotsContent+`" />`)
	} else {
		canonicalAttr := html.EscapeString(buildCanonicalURL(cleanPath))
		doc = replaceOrInsertHeadTag(doc, reCanonicalTag, `<link rel="canonical" href="`+canonicalAttr+`" />`)
		doc = replaceOrInsertHeadTag(doc, reRobotsMetaTag, `<meta name="robots" content="`+defaultRobotsContent+`" />`)
		doc = replaceOrInsertHeadTag(doc, reOgURLTag, `<meta property="og:url" content="`+canonicalAttr+`" />`)
		doc = replaceOrInsertHeadTag(doc, reTwitterURLTag, `<meta name="twitter:url" content="`+canonicalAttr+`" />`)
	}

	if meta, ok := routeSEOHeadMeta(cleanPath); ok {
		safeTitle := html.EscapeString(meta.title)
		safeDesc := html.EscapeString(meta.description)
		doc = replaceOrInsertHeadTag(doc, reTitleTag, "<title>"+safeTitle+"</title>")
		doc = replaceOrInsertHeadTag(doc, reMetaTitleTag, `<meta name="title" content="`+safeTitle+`" />`)
		doc = replaceOrInsertHeadTag(doc, reOgTitleTag, `<meta property="og:title" content="`+safeTitle+`" />`)
		doc = replaceOrInsertHeadTag(doc, reTwitterTitleTag, `<meta name="twitter:title" content="`+safeTitle+`" />`)
		doc = replaceOrInsertHeadTag(doc, reMetaDescTag, `<meta name="description" content="`+safeDesc+`" />`)
		doc = replaceOrInsertHeadTag(doc, reOgDescTag, `<meta property="og:description" content="`+safeDesc+`" />`)
		doc = replaceOrInsertHeadTag(doc, reTwitterDescTag, `<meta name="twitter:description" content="`+safeDesc+`" />`)
	}

	return []byte(doc), noIndex
}

