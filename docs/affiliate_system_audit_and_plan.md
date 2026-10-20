# APIVALE 邀请激励机制专项审计与优化落地计划

> **记录时间**：2026-09-28  
> **审计对象**：用户邀请裂变机制、返利佣金池、OAuth 参数传递与前端呈现  
> **当前状态**：底层逻辑具备，但线上运行实际处于“不可用/零激励”状态，待优化落地。

---

## 一、 现状与真实生产数据证据

1. **配置现状（线上 `options` 表）**：
   - `QuotaForInviter`: `0`（邀请人奖励额度为 0）
   - `QuotaForInvitee`: `0`（受邀人额外额度为 0）
   - `AffRebateRatio`: `0.10`（充值返利比例为 10%）
2. **用户数据实测（线上 215 位注册用户）**：
   - 历史仅 **2 例** 绑定记录：
     - `User 227 (ekimyuu)`：邀请了 `User 228`，获得 `aff_quota = 25000`（$0.05）；
     - `User 253 (BuiCongHuy)`：通过 Google 成功邀请了 `User 255 (google_255)`，但因当时 `QuotaForInviter = 0`，`aff_quota` 记录为 **`0`**（用户拉新白费力气）。
   - 近 60 位新用户（User 256 ~ 316）邀请成功率彻底降为 **0**。

---

## 二、 核心断点定位与原因分析

### 1. 【配置断点】线上奖励直接设为 0
- 线上数据库中 `QuotaForInviter` 和 `QuotaForInvitee` 均为 `0`，新注册用户通过邀请链接进入时，邀请人和被邀请人均得不到任何即时算力激励。

### 2. 【资金隔离与提现门槛断点】获得奖励无法直接使用
- 源码位置：`model/user.go:375-385`（`TransferAffQuotaToQuota`）
- 逻辑：邀请获得的奖励打入的是隔离的 `user.AffQuota`（返利池），无法直接用于日常 API 调用；
- 限制：系统硬编码要求最低划转门槛为 **`$1.00`（500,000 Quota）**，拉新一两个人根本凑不够，导致算力永久锁死在后台（如 User 227 的 $0.05 至今无法使用）。

### 3. 【路由参数丢弃 Bug】`/register` 重定向洗掉邀请码
- 源码位置：
  - 前端生成：`web/default/src/features/wallet/lib/affiliate.ts:28` 生成链接格式为 `/register?aff=XXXX`
  - 路由处理：`web/default/src/routes/register.tsx`
    ```tsx
    export const Route = createFileRoute('/register')({
      beforeLoad: () => {
        throw redirect({ to: '/sign-up' }) // ❌ 缺少 search 参数透传，?aff=XXXX 在重定向瞬间丢失！
      },
    })
    ```
- 影响：受邀好友访问钱包生成的推广链接时，第一跳就被剥离了 `aff` 参数，导致后续即使完成注册也 100% 无法绑定邀请人。

### 4. 【合规性开关硬拦截风险】
- 源码位置：`model/user.go:474` 与 `model/user.go:750`
- 逻辑：`if inviterId != 0 && inviterId != user.Id && operation_setting.IsPaymentComplianceConfirmed()`
- 风险：若支付合规开关未勾选，连 `inviteUser`（增加邀请人数计数）都会被直接跳过。

### 5. 【入口隐蔽与感知弱】
- 目前普通用户仅在个人中心二级页面或钱包充值历史下方能看到一段小链接，缺乏显眼的“邀请赚算力”活动卡片与明确的文案主张。

---

## 三、 待优化落地实施路线（Ready to Execute）

### 阶段 1：修复路由参数丢弃与链接统一（前端紧急修复）
- [ ] **修改 `routes/register.tsx`**：
  改为 `beforeLoad: ({ search }) => { throw redirect({ to: '/sign-up', search }) }`，确保任何带参重定向不丢失 `aff`。
- [ ] **统一推广链接生成规则**：
  将 `wallet` 和 `profile` 生成的推广链接统一规范为 `${window.location.origin}/sign-up?aff=${affCode}`，避免多余重定向。

### 阶段 2：调整线上激励配置（即刻见效）
- [ ] **更新 `options` 表与默认常量**：
  - `QuotaForInviter`: 设置为 `25,000`（$0.05）或 `50,000`（$0.10）；
  - `QuotaForInvitee`: 设置为 `25,000`（$0.05），让被邀请人获得比普通注册更多的算力；
  - `AffRebateRatio`: 保持 `0.10`（10% 充值返利）。

### 阶段 3：优化奖励到账机制（降低使用门槛）
- [ ] **小额注册奖励直接入可用额度（可选推荐）**：
  修改 `model/user.go` 中的 `inviteUser`，将注册赠送的少量额度（如 $0.05）直接打入 `user.Quota`（可用算力），让开发者邀请好友后立刻能调用，获得立竿见影的爽感；
  充值返佣的大额现金返利则依然保留在 `AffQuota` 中。
- [ ] **降低划转最低门槛**：
  将 `TransferAffQuotaToQuota` 中的最低转移限制从 `$1.00` 降低为 `$0.05`（25,000 Quota）或允许全额一键转为可用额度。

### 阶段 4：前端交互与推广中心增强（视觉与心智激发）
- [ ] 在控制台首页（Overview）增加轻量“🎁 邀请好友送算力”卡片；
- [ ] 提供一键复制专属邀请链接与社交媒体分享文案（X/Twitter、微信、Discord、Reddit）；
- [ ] 标明权益：“每邀请 1 位好友注册，您得 $0.05 算力，好友享额外赠额，好友后续充值永久享 10% 现金/算力返利”。
