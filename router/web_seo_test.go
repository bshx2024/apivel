package router

import (
	"net/url"
	"strings"
	"testing"
)

const sampleSPAIndexHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="canonical" href="https://apivel.com/" />
  <title>DeepSeek API Pricing: PayPal & OpenAI Gateway | APIVEL</title>
  <meta name="title" content="DeepSeek API Pricing: PayPal & OpenAI Gateway | APIVEL" />
  <meta
    name="description"
    content="Compare DeepSeek API pricing & token rates."
  />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <meta property="og:url" content="https://apivel.com/" />
  <meta property="og:title" content="DeepSeek API Pricing: PayPal & OpenAI Gateway | APIVEL" />
  <meta property="og:description" content="Compare DeepSeek API pricing & token rates." />
  <meta name="twitter:url" content="https://apivel.com/" />
  <meta name="twitter:title" content="DeepSeek API Pricing: PayPal & OpenAI Gateway | APIVEL" />
  <meta name="twitter:description" content="Compare DeepSeek API pricing & token rates." />
</head>
<body><div id="root"></div></body>
</html>`

func TestApplyRouteSEOToHTML_PricingCanonicalAndMeta(t *testing.T) {
	out, noIndex := applyRouteSEOToHTML([]byte(sampleSPAIndexHTML), "/pricing", url.Values{"tab": {"models"}})
	if noIndex {
		t.Fatalf("expected /pricing to be indexable")
	}
	html := string(out)
	if !strings.Contains(html, `<link rel="canonical" href="https://apivel.com/pricing" />`) {
		t.Fatalf("expected /pricing canonical tag, got:\n%s", html)
	}
	if !strings.Contains(html, `<meta property="og:url" content="https://apivel.com/pricing" />`) {
		t.Fatalf("expected /pricing og:url tag")
	}
	if !strings.Contains(html, `<meta name="twitter:url" content="https://apivel.com/pricing" />`) {
		t.Fatalf("expected /pricing twitter:url tag")
	}
	if !strings.Contains(html, `<title>Plans &amp; Model Pricing Directory (DeepSeek, Qwen, GLM, Kimi) | APIVEL</title>`) {
		t.Fatalf("expected /pricing custom title, got:\n%s", html)
	}
}

func TestApplyRouteSEOToHTML_PricingModelDetail(t *testing.T) {
	out, noIndex := applyRouteSEOToHTML([]byte(sampleSPAIndexHTML), "/pricing/deepseek-v4-flash/", nil)
	if noIndex {
		t.Fatalf("expected /pricing/deepseek-v4-flash to be indexable")
	}
	html := string(out)
	if !strings.Contains(html, `<link rel="canonical" href="https://apivel.com/pricing/deepseek-v4-flash" />`) {
		t.Fatalf("expected model pricing canonical tag, got:\n%s", html)
	}
	if !strings.Contains(html, `<title>deepseek-v4-flash API Pricing &amp; Token Rates | APIVEL</title>`) {
		t.Fatalf("expected model pricing title, got:\n%s", html)
	}
}

func TestApplyRouteSEOToHTML_SignUpRedirectNoIndex(t *testing.T) {
	q := url.Values{"redirect": {"/playground?model=qwen3.8-flash"}}
	out, noIndex := applyRouteSEOToHTML([]byte(sampleSPAIndexHTML), "/sign-up", q)
	if !noIndex {
		t.Fatalf("expected /sign-up?redirect=... to be noindex")
	}
	html := string(out)
	if !strings.Contains(html, `<meta name="robots" content="noindex, nofollow" />`) {
		t.Fatalf("expected noindex meta tag, got:\n%s", html)
	}
	if strings.Contains(html, `rel="canonical"`) {
		t.Fatalf("expected canonical tag to be omitted on noindex redirect page, got:\n%s", html)
	}
	// Verify literal $0.20 in sign-up description was not corrupted by regex $ expansion.
	if !strings.Contains(html, `$0.20`) {
		t.Fatalf("expected $0.20 in sign-up meta to be preserved literally, got:\n%s", html)
	}
}

func TestApplyRouteSEOToHTML_CleanSignUpGetsOwnCanonical(t *testing.T) {
	out, noIndex := applyRouteSEOToHTML([]byte(sampleSPAIndexHTML), "/sign-up", nil)
	if noIndex {
		t.Fatalf("expected clean /sign-up without ?redirect= to remain indexable")
	}
	html := string(out)
	if !strings.Contains(html, `<link rel="canonical" href="https://apivel.com/sign-up" />`) {
		t.Fatalf("expected /sign-up canonical tag, got:\n%s", html)
	}
	if !strings.Contains(html, `content="index, follow`) {
		t.Fatalf("expected index, follow robots tag on clean /sign-up")
	}
}

func TestApplyRouteSEOToHTML_InternalPlaygroundNoIndex(t *testing.T) {
	out, noIndex := applyRouteSEOToHTML([]byte(sampleSPAIndexHTML), "/playground", url.Values{"model": {"qwen3.8-flash"}})
	if !noIndex {
		t.Fatalf("expected /playground to be noindex")
	}
	html := string(out)
	if !strings.Contains(html, `<meta name="robots" content="noindex, nofollow" />`) {
		t.Fatalf("expected noindex meta tag for /playground")
	}
}

