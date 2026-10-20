# 转化漏斗与第一方事件追踪实战复用手册 (Event Tracking & Funnel Playbook)

> **版本**：v1.0  
> **归档日期**：2026-09-17  
> **适用范围**：SaaS 平台、AI API 网关、出海独立站、开发者工具平台

---

## 一、 为什么必须自建第一方事件表？（核心设计哲学）

在开发者与出海产品中，传统的第三方统计工具（如 Google Analytics、Mixpanel、Baidu Analytics）存在致命硬伤：

1. **客户端广告拦截率畸高**：程序员和技术用户普遍开启 uBlock Origin / AdGuard / Brave 盾牌，第三方打点 SDK 被屏蔽率普遍在 **40% ~ 60%** 以上，数据严重失真。
2. **端到端链路割裂**：用户行为跨越了“网页操作”（前端）和“后台跑脚本调 API”（服务端）。第三方工具极难将网页访问与数据库的实际 API 消费日志（`logs`）、充值订单（`top_ups`）深度联查。
3. **AI 闭环驱动极简**：
   - 让 AI 编写代码上报数据只需几秒；
   - 让 AI 直接写 SQL 查库分析转化掉队点；
   - 发现卡点后，AI 能够直接对照自己写的前端组件代码，一键改写交互完成优化。

---

## 二、 架构设计与代码蓝图（可直接在新项目中复刻）

```
[前端浏览器/App]
       │
       ▼ (navigator.sendBeacon / fetch keepalive)
[第一方端点 POST /api/track]
       │
       ▼ (非阻塞推入)
[Go 内存缓冲通道 TrackEventChan (Capacity 2000)]
       │
       ▼ (后台协程每 2 秒或满 100 条触发)
[批量写入 SQLite / MySQL / PostgreSQL (CreateInBatches)]
       │
       ▼
[track_events 数据库表] ── JOIN ── [users / logs / orders]
```

### 1. 数据库模型设计（三库通用标准）

```go
// model/track_event.go
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

// 内存缓冲通道，防并发突发洪峰
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
		common.SysError("TrackEventChan full, drop event: " + event.EventName)
	}
}

// 定时/定量批量落库，对主业务零性能损耗
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
				_ = DB.CreateInBatches(buffer, 100).Error
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
```

### 2. 前端微型打点 SDK（极简轻量，无外部依赖）

```ts
// web/default/src/lib/tracker.ts
const STORAGE_ANON_ID_KEY = 'apivale_anon_id'

function getAnonymousId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let anonId = localStorage.getItem(STORAGE_ANON_ID_KEY)
    if (!anonId) {
      anonId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
      localStorage.setItem(STORAGE_ANON_ID_KEY, anonId)
    }
    return anonId
  } catch {
    return ''
  }
}

export function track(eventName: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined' || !eventName) return

  try {
    const payload = {
      event_name: eventName,
      anonymous_id: getAnonymousId(),
      properties: properties || {},
      page_url: `${window.location.pathname}${window.location.search}`,
      referrer: document.referrer || '',
      timestamp: Math.floor(Date.now() / 1000),
    }

    const body = JSON.stringify(payload)

    // 优先走 sendBeacon（用户即使跳走或关闭窗口也不会中断）
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })
      if (navigator.sendBeacon('/api/track', blob)) return
    }

    // 降级走 fetch keepalive
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {}
}
```

---

## 三、 经典业务场景三大黄金关卡埋点标准

在新项目中落地时，切忌全量乱埋，只需在以下 **3 个生死关卡** 埋入核心事件：

| 转化阶段 | 黄金事件名 (`event_name`) | 埋点位置示例 | 记录的核心属性 (`properties`) | 解决的核心业务问题 |
| :--- | :--- | :--- | :--- | :--- |
| **激活关卡 ①** | `token_created` | Token 创建成功接口响应时 | `{ "name": "prod_key" }` | 监控注册用户是否进入产品核心资产生成阶段 |
| **激活关卡 ②** | `copy_api_key` | 点击“复制Key”按钮、操作菜单项、引导卡片 | `{ "from": "onboarding" / "table_cell" }` | **消灭领 Key 不调用的流失黑洞**（若领了Key但未调，可判断用户是否卡在复制/测试配置上） |
| **体验关卡** | `test_playground` / `landing_tester_click` | 在线调试发送请求、落地页示例测试 | `{ "model": "deepseek-chat" }` | 监测用户在无需配置本地环境时的初体验意向与报错率 |
| **充值关卡 ①** | `view_topup` | 充值/钱包页面挂载（`useEffect`） | `{ "from": "depleted_modal" / "nav" }` | 统计有多少人有充值意图 |
| **充值关卡 ②** | `select_pay_tier` | 点击金额梯度预设按钮 ($5, $29, $99) | `{ "amount": 29 }` | 统计用户意向客单价分布，指导定价梯队优化 |
| **充值关卡 ③** | `click_payment_channel` | 点击 PayPal、Stripe、USDT 等通道 | `{ "method": "paypal", "amount": 29 }` | **监控支付意向分布** |
| **充值关卡 ④** | `checkout_abandon_or_fail` | 银行拒付跳回、取消支付跳回 | `{ "status": "canceled", "error": "declined" }` | **精确定位支付通道摩擦率并触发降级挽回机制** |

---

## 四、 避坑经验：OAuth 跨站跳转丢失渠道归因的根治方案

在很多使用 Google / GitHub OAuth 的项目中，**80% 以上的新用户来源往往显示为空**，这是由于：
- 用户进入网站携带了 `utm_source=reddit`；
- 用户点击 OAuth 登录，浏览器跳转到 `accounts.google.com`；
- 授权完毕重定向回 `/api/oauth/callback` 时，跨站跳转导致浏览器把没有设置 `SameSite=Lax` 的 Cookie 吞掉，从而丢失渠道来源。

### 根治方案：
1. **获取 OAuth State 时带上归因参数**：
   在前端向 `/api/oauth/state` 请求授权 Token 时，从 localStorage 读取 `first_source`, `first_medium`, `first_referrer` 等一并上传。
2. **后端存入 Session 暂存**：
   在 `GenerateOAuthCode` 中通过 `session.Set("oauth_attr", ...)` 将归因保存在服务端会话中。
3. **回调建号时保底恢复**：
   在 `HandleOAuth` 回调创建用户时，若检测到 Cookie 归因为空，自动从 Session 中恢复，准确写入 `users.first_source`。

---

## 五、 AI 自动化诊断实战 SQL 模板（开箱即用）

后续新项目上线后，只需将以下 SQL 模板丢给 AI，AI 即可输出完整转化报表：

```sql
-- 渠道全生命周期价值 (LTV) 与激活转化报表
WITH user_tokens AS (
    SELECT user_id, COUNT(*) as token_count FROM tokens GROUP BY user_id
),
user_calls AS (
    SELECT user_id, COUNT(*) as call_count, SUM(quota) as quota_spent 
    FROM logs WHERE type = 2 GROUP BY user_id
),
user_topups AS (
    SELECT user_id, COUNT(*) as pay_count, SUM(money) as total_revenue
    FROM top_ups WHERE status = 'success' GROUP BY user_id
)
SELECT 
    COALESCE(NULLIF(u.first_source, ''), 'direct/none') AS 渠道来源,
    COUNT(DISTINCT u.id) AS 注册人数,
    COUNT(DISTINCT ut.user_id) AS 生成Key人数,
    ROUND(COUNT(DISTINCT ut.user_id) * 100.0 / COUNT(DISTINCT u.id), 1) || '%' AS 领Key率,
    COUNT(DISTINCT uc.user_id) AS 跑通调用人数,
    ROUND(COUNT(DISTINCT uc.user_id) * 100.0 / COUNT(DISTINCT u.id), 1) || '%' AS 激活率,
    COUNT(DISTINCT utp.user_id) AS 付费人数,
    ROUND(COUNT(DISTINCT utp.user_id) * 100.0 / COUNT(DISTINCT u.id), 1) || '%' AS 付费率,
    COALESCE(SUM(utp.total_revenue), 0) AS 贡献总营收USD,
    ROUND(COALESCE(SUM(utp.total_revenue), 0) / NULLIF(COUNT(DISTINCT utp.user_id), 0), 2) AS 客单价ARPPU
FROM users u
LEFT JOIN user_tokens ut ON u.id = ut.user_id
LEFT JOIN user_calls uc ON u.id = uc.user_id
LEFT JOIN user_topups utp ON u.id = utp.user_id
GROUP BY 渠道来源
ORDER BY 贡献总营收USD DESC;
```
