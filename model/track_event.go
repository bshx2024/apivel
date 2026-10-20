package model

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/bytedance/gopkg/util/gopool"
)

type TrackEvent struct {
	Id          int64  `json:"id" gorm:"primaryKey;autoIncrement"`
	UserId      int    `json:"user_id" gorm:"index:idx_track_events_user_id"`
	AnonymousId string `json:"anonymous_id" gorm:"type:varchar(64);index:idx_track_events_anonymous_id;default:''"`
	EventName   string `json:"event_name" gorm:"type:varchar(64);index:idx_track_events_name;default:''"`
	Properties  string `json:"properties" gorm:"type:text"`
	PageUrl     string `json:"page_url" gorm:"type:varchar(255);default:''"`
	Referrer    string `json:"referrer" gorm:"type:varchar(255);default:''"`
	Ip          string `json:"ip" gorm:"type:varchar(45);default:''"`
	UserAgent   string `json:"user_agent" gorm:"type:varchar(255);default:''"`
	CreatedAt   int64  `json:"created_at" gorm:"bigint;index:idx_track_events_created_at"`
}

func (TrackEvent) TableName() string {
	return "track_events"
}

var TrackEventChan = make(chan *TrackEvent, 2000)

func PushTrackEvent(event *TrackEvent) {
	if event == nil {
		return
	}
	if event.CreatedAt == 0 {
		event.CreatedAt = time.Now().Unix()
	}
	select {
	case TrackEventChan <- event:
	default:
		common.SysError("TrackEventChan is full, dropping event: " + event.EventName)
	}
}

func InitTrackEventWorker() {
	gopool.Go(func() {
		buffer := make([]*TrackEvent, 0, 100)
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		flush := func() {
			if len(buffer) == 0 {
				return
			}
			if DB != nil {
				if err := DB.CreateInBatches(buffer, 100).Error; err != nil {
					common.SysError("Failed to batch insert track events: " + err.Error())
				}
			}
			buffer = make([]*TrackEvent, 0, 100)
		}

		for {
			select {
			case event, ok := <-TrackEventChan:
				if !ok {
					flush()
					return
				}
				buffer = append(buffer, event)
				if len(buffer) >= 100 {
					flush()
				}
			case <-ticker.C:
				flush()
			}
		}
	})
}
