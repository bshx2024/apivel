# 访客日志分析规范与防踩坑军规 (Visitor Log Analysis Guidelines)

在对新用户访问、访客日志、转化漏斗进行数据提取与分析时，**必须严格遵守以下军规，杜绝将网络爬虫、SEO 机器人与自动化探针误判为真人访客**：

---

## 🚫 严禁采纳的虚假“真人”判定指标（踩坑教训）

1. **绝对不能单纯以“是否加载了静态资源（JS/CSS）”判定为真人**：
   - 现代搜索引擎（如 Googlebot、Bingbot）及无头浏览器抓取器在索引 SPA（单页应用）时，会自动并发下载所有 JS/CSS 脚本，并执行 `/api/setup`、`/api/status` 等初始化接口。
2. **绝对不能单纯以“URL 携带了 utm 推广标签”判定为真人**：
   - 国际 SEO 分析爬虫（如 **AhrefsBot**、Semrush、DotBot）在爬取博客（`/blog/`）内容时，会自动顺着文章内部所有的 `<a>` 标签跟踪爬取（如 `/sign-up?utm_source=apivale_blog&utm_medium=blog_cta_card`），产生海量完全由爬虫制造的虚假外链跳转。
3. **绝对不能将固定接口探针误判为真人**：
   - 自动化撞库探针：单次/周期性请求 `/api/user/login?turnstile=`；
   - 状态轮询探针：只周期性拉取 `/api/perf-metrics`、`/api/status`、`/api/notice`；
   - 资源探测蜘蛛：只请求 `/favicon.svg`、`robots.txt`、`sitemap.xml`、`/.git/`、`/.DS_Store`；
   - VPN/导航站探针：只探测特定图标或 `/daohang/`。

---

## ✅ 真实人类用户（Genuine Humans）的硬核判定标准

今后分析访客日志，判定为“真实人类用户”必须满足以下**强交互信号之一**或**多维交叉验证**：

### 1. 核心强交互信号（满足任一即确认真人）
- **身份鉴权行为**：
  - 发起真实的 OAuth 授权并产生有效回调（携带合法的 `code` 与 `state`，如 `/oauth/google`, `/oauth/github`）；
  - 请求 `/api/user/self` 且 HTTP 状态为 200，并连续产生会话交互；
  - 成功完成账号注册或登录流程。
- **控制台与开发者动作**：
  - 在 `/keys` 页面实际生成或复制了 API Token（触发 `/api/token/.../key`）；
  - 在 `/playground` 体验中心实际发送 Prompt 获得补全；
  - 触发前端用户行为埋点（`POST /api/track`）。
- **钱包与付费行为**：
  - 进入 `/wallet` 并触发支付渠道选择（`click_payment_channel`），或实际调起第三方收银台（Waffo/PayPal/Subotiz）；
  - 数据库 `top_ups` 表中产生成功充值流水。
- **生产级 API 调用**：
  - 使用合法 Token 发起 `/v1/chat/completions`，且在 `logs` 表中产生实际的 Tokens 消耗流水。

### 2. 未登录潜客的严格准入过滤（漏斗顶层新客判定）
对于尚未登录的新访客，若要判定为“真实人类探索者”，**必须同时满足**：
- **IP 归属清洗**：排除数据中心/SEO爬虫 ASN（如 Ahrefs Pte Ltd, Google LLC 爬虫段, Censys, Shodan, Palo Alto 等）；
- **有时序的人类浏览轨迹**：具备典型的人类操作延迟（如落地首页 ➔ 停留 15s 阅读 ➔ 点击 Pricing ➔ 停留 20s 比对），而非 1 秒内机械抓取多页面；
- **非单页秒退**：必须具备真实页面跳转交互，单次单请求（Single-Hit）无后续动作一律归为普通跳出或机器人。

---

## 🔍 必须执行的数据库（Ground Truth）强制交叉校准

在汇报任何“高意向访客”或“转化趋势”前，**必须强制执行数据库对照查询**：
1. 若日志显示大量“注册点击”，但 `users` 表过去 24 小时新增记录为 0 ➔ **必须立即核查是否为 AhrefsBot 等爬虫在爬取超链接，或注册链路存在严重报错拦截**；
2. 若日志显示大量“钱包访问”，但 `top_ups` 表无对应订单 ➔ **必须区分是真实用户卡在支付环节，还是爬虫在探测试探路由**；
3. 必须如实汇报**老用户活跃数**与**新访客数**的界限，不可将老客户的日常 API 跑脚本调用混淆为新获得的意向客户。
