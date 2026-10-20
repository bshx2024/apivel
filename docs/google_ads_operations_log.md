# Google Ads 推广实战与复盘日志 (Google Ads Operations Log)

## 📅 记录时间：2026-09-22
**操作人员**：APIVALE 运营与技术团队  
**项目阶段**：首期全球精准搜索广告正式上线（Search Campaign Launch）

---

## 一、 推广账户体系信息

| 字段 / 维度 | 详细参数 | 备注说明 |
| :--- | :--- | :--- |
| **Google 管理账号 (MCC)** | `bshx2024-Global` (`156-483-3233`) | 登录主账号：`bshx2024@gmail.com` |
| **投放子账户名称** | `北京小游侠旅游咨询有限公司_20260127141009_1` | 实际承载广告投放的主体账户 |
| **投放子账户 CID** | `123-920-0178` | 后续充值与工单对账使用此 ID |
| **服务代理商 / 开户渠道** | 蓝色光标 (BlueFocus / BlueVision - LuBan) | 企业海外代理账户体系 |
| **账户总预算状态** | `Active`（额度上限 $19.61，起步可用） | 首期测试消耗后可在蓝标鲁班系统续充 |

---

## 二、 广告系列核心架构 (Campaign Architecture)

* **广告系列名称**：`APIVALE | Global | Search | LLM_API`
* **广告系列类型**：搜索广告（Search Network）
* **营销目标**：获取潜在客户（Submit lead forms）
* **出价策略**：最大化点击次数（Maximize Clicks），新客与老客出价权重一致
* **每日预算**：**$5.00 / 天**（周度预算约 $35.07，预计周点击 ~1,098 次，预估 Avg. CPC 约 $0.03）
* **投放网络配置**：
  * [x] Google Search Network（谷歌主搜）
  * [x] Google Search Partners（搜索合作伙伴网络）
  * [ ] Google Display Network（**已关闭展示广告网络**，严防预算被垃圾展示吃掉）
* **地理定向（全球 14 国高价值开发者地区）**：
  * 美国 (United States)、英国 (United Kingdom)、德国 (Germany)、法国 (France)、荷兰 (Netherlands)、波兰 (Poland)、瑞士 (Switzerland)、新加坡 (Singapore)、澳大利亚 (Australia)、加拿大 (Canada)、爱沙尼亚 (Estonia)、中国香港 (Hong Kong)、意大利 (Italy)、日本 (Japan)
* **语言定位**：
  * 英语 (English)、德语 (German)、法语 (French)、意大利语 (Italian)、日语 (Japanese)、荷兰语 (Dutch)、波兰语 (Polish)、中文简体 (Chinese Simplified)

---

## 三、 关键词策略 (Keywords)

采用高意向（High-Intent）、聚焦国模与开发工具集成痛点的精准关键词组，避免宽泛词吃掉预算：

```text
qwen 3.8
qwen 3.8 api
qwen 3.8 api key
qwen 3.8 cursor setup
connect qwen 3.8 to claude code cli
how to use qwen 3.8
claude code qwen 3.8
how to connect qwen 3.8 to claude code
qwen 3.8 cursor
qwen 3.8 claude code
```

---

## 四、 广告文案与落地页素材 (Creative & Copy)

### 1. 网址与显示路径
* **最终到达网址 (Final URL)**：
  `https://apivale.com/blog/how-to-connect-qwen-3-8-to-claude-code-cli/`
* **显示路径 (Display Path)**：
  `www.apivale.com/qwen-3-8/setup`
* **商家名称 (Business Name)**：
  `APIVALE`

### 2. 标题库 (Headlines - 15组自适应轮播)
1. `Qwen 3.8 API Key`
2. `Qwen 3.8 Cursor Setup`
3. `Connect Qwen 3.8 to Claude`
4. `How to Use Qwen 3.8`
5. `Qwen 3.8 Claude Code CLI`
6. `Need a GPT API? Try APIVALE`
7. `OpenAI API Free Trial`
8. `Multi-Region AI Proxy`
9. `Zero Identity Checks`
10. `Lightning Fast AI API`
11. `Global AI API Coverage`
12. `Multiple Upstream Providers`
13. `Start Routing in Minutes`
14. `Pay-As-You-Go AI Models`
15. `High Reliability API Hub`

### 3. 描述语 (Descriptions - 4组核心卖点)
* **Desc 1**：`One Key for All Leading AI Models. Free Trial. OpenAI Compatible.`
* **Desc 2**：`High Performance, Reliable Platform with Features Like Multi-Region Proxy, Smart Failover.`
* **Desc 3**：`Pay-as-you-go pricing with real-time usage monitoring.`
* **Desc 4**：`High-availability AI access with multi-node load balancing and automatic failover.`

---

## 五、 追踪与转化代码配置 (Tracking & Measurement)

* **Google Tag (全球标签)**：已成功自动关联网站现存标签 `G-S1SGEC4JS4` / `GT-NFB28WTH`。
* **转化事件代码 (Conversion Snippet for Submit lead form)**：
  ```html
  <!-- Event snippet for Submit lead form conversion page -->
  <script>
    gtag('event', 'conversion', {
        'send_to': 'AW-17908605238/evgiCLDqnvIbELbCvttC',
        'value': 1.0,
        'currency': 'USD'
    });
  </script>
  ```
  * Google Ads Conversion ID: `AW-17908605238`
  * Conversion Label: `evgiCLDqnvIbELbCvttC`
  * 本地代码接入状态：已在 `web/default/index.html` 与 `web/default/src/features/auth/sign-up` 注册流程中完成部署。

---

## 六、 关键技术阻断与排错复盘 (Troubleshooting & Lessons Learned)

### 1. Passkey 认证受阻问题
* **现象**：在发布广告敏感操作时，电脑端 Chrome 弹出 `您的设备无法用于此网站，google.com 可能需要使用一部更新的或不同类型的设备`。
* **底层原因**：当前 Windows 开发机硬件无 TPM 2.0 芯片且无内置蓝牙适配器，无法满足 FIDO2 本地硬件加密或与附近手机无线握手要求。
* **解决办法**：Redmi Note 9 手机开启锁屏密码后，手机端原生具备 Passkey 验证凭据，直接通过手机端（或移动端验证）一键完成身份授权，顺利破局。

### 2. 预算耗尽误警报 (Account budget nearly exhausted)
* **现象**：控制台顶部红条提示 `Account budget exhausted - Your account budget has either reached, or has nearly reached, its spending limit`。
* **核实结果**：账户结算处于 `Active` 状态，存在代理商分配的 `$19.61` 基础预算，因绝对金额较小触发了谷歌算法的预警机制。日预算设为 $5/天可正常消耗 3~4 天，不影响上线。后续消耗到 80% 时找蓝标充值即可。

### 3. 诊断警告 (Ad strength is poor & Missing keywords)
* **定性**：两项均为谷歌自动化算法的通用扩量建议，而非违规阻断。初期为控制成本并精准测试 Qwen 3.8/Cursor 转化率，保持 10 个核心精准词更佳，暂不扩充泛词。

---

## 七、 后续复盘监控指标 (Next Steps)

1. **审核状态观察**：关注广告状态由 `Under review` 变为 `Eligible`（通常 2~24 小时）。
2. **出价学习期 (Learning)**：前 3~5 天为系统机器学习期，不频繁调整竞价与预算。
3. **首期复盘数据观测点**：
   * 实际点击率 (CTR)：预期 $\ge 3.5\%$
   * 实际平均点击成本 (Avg. CPC)：预期 $\le \$0.15$
   * 真实搜索词报告 (Search Terms)：检查是否有与业务无关的词并添加为否定词（Negative Keywords）。
   * 注册与转化数：观察 APIVALE 注册转化漏斗。
