package controller

import (
	"net/http"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

type TrackEventRequest struct {
	EventName   string         `json:"event_name"`
	AnonymousId string         `json:"anonymous_id"`
	Properties  map[string]any `json:"properties"`
	PageUrl     string         `json:"page_url"`
	Referrer    string         `json:"referrer"`
	Timestamp   int64          `json:"timestamp"`
}

func TrackEvent(c *gin.Context) {
	var req TrackEventRequest
	if err := common.DecodeJson(c.Request.Body, &req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "invalid request body"})
		return
	}

	if strings.TrimSpace(req.EventName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"success": false, "message": "event_name is required"})
		return
	}

	userId := 0
	if id, exists := c.Get("id"); exists {
		if uid, ok := id.(int); ok {
			userId = uid
		}
	}
	if userId == 0 {
		session := sessions.Default(c)
		if sId := session.Get("id"); sId != nil {
			if uid, ok := sId.(int); ok {
				userId = uid
			}
		}
	}

	var propsStr string
	if len(req.Properties) > 0 {
		if b, err := common.Marshal(req.Properties); err == nil {
			propsStr = string(b)
		}
	}

	createdAt := req.Timestamp
	if createdAt <= 0 {
		createdAt = time.Now().Unix()
	}

	event := &model.TrackEvent{
		UserId:      userId,
		AnonymousId: strings.TrimSpace(req.AnonymousId),
		EventName:   strings.TrimSpace(req.EventName),
		Properties:  propsStr,
		PageUrl:     strings.TrimSpace(req.PageUrl),
		Referrer:    strings.TrimSpace(req.Referrer),
		Ip:          c.ClientIP(),
		UserAgent:   c.Request.UserAgent(),
		CreatedAt:   createdAt,
	}

	model.PushTrackEvent(event)

	c.JSON(http.StatusOK, gin.H{"success": true})
}
