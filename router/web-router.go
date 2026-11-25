package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// ThemeAssets holds the embedded frontend assets for both themes.
type ThemeAssets struct {
	DefaultBuildFS   embed.FS
	DefaultIndexPage []byte
	ClassicBuildFS   embed.FS
	ClassicIndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets ThemeAssets) {
	defaultFS := common.EmbedFolder(assets.DefaultBuildFS, "web/default/dist")
	classicFS := common.EmbedFolder(assets.ClassicBuildFS, "web/classic/dist")
	themeFS := common.NewThemeAwareFS(defaultFS, classicFS)

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())

	// Explicit high-intent SEO/GEO landing pages (avoids trailing slash redirect loop)
	serveLanding := func(c *gin.Context, filename string) {
		c.Header("Cache-Control", "public, max-age=3600")
		c.FileFromFS(filename, themeFS)
	}
	router.GET("/deepseek-api-pricing", func(c *gin.Context) { serveLanding(c, "deepseek-api-pricing.html") })
	router.GET("/openrouter-alternative", func(c *gin.Context) { serveLanding(c, "openrouter-alternative.html") })
	router.GET("/qwen-api-pricing", func(c *gin.Context) { serveLanding(c, "qwen-api-pricing.html") })

	serveSPAIndex := func(c *gin.Context) {
		c.Header("Cache-Control", "no-cache")
		var rawPage []byte
		if common.GetTheme() == "classic" {
			rawPage = assets.ClassicIndexPage
		} else {
			rawPage = assets.DefaultIndexPage
		}
		renderedPage, noIndex := applyRouteSEOToHTML(rawPage, c.Request.URL.Path, c.Request.URL.Query())
		if noIndex {
			c.Header("X-Robots-Tag", "noindex, nofollow")
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", renderedPage)
	}

	router.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/" && c.Request.URL.Query().Has("redirect") {
			c.Set(middleware.RouteTagKey, "web")
			serveSPAIndex(c)
			c.Abort()
			return
		}
		c.Next()
	})

	router.Use(static.Serve("/", themeFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		serveSPAIndex(c)
	})
}
