# 竞品调研

调研日期：2026-08-28

> ModelFlare Origin、Hvoy、302.AI、Vercel AI Gateway 的第二轮深度调研与线路可信度框架见 [02b-relay-platform-benchmark.md](./02b-relay-platform-benchmark.md)。

## 调研方法与限制

- 逐页打开 CC Switch 官网、文档和 GitHub 主仓库。
- 使用已登录页面查看 ModelFlare 的概览、公开模型目录、文档、CC-Switch 接入、信任中心与退款政策；本文不记录任何账户余额、Key 或个人数据。
- 使用官方文档核验 OpenRouter、AIHubMix、SiliconFlow、New API 和 LiteLLM。
- 页面内容、版本、价格、模型数量和许可会变化，本文所有数量均为快照。
- `已观察` 只描述页面明确展示的能力；`推断` 是对 Moyusi 的产品结论。

## 市场不是一条赛道

| 层 | 用户问题 | 代表产品 |
| --- | --- | --- |
| 本地工具控制面 | 如何管理多个 AI 编程工具、Provider 与配置文件 | CC Switch |
| 公共模型 API 平台 | 如何买额度、获得 Key、访问多模型与查看用量 | ModelFlare、OpenRouter、AIHubMix、SiliconFlow |
| 自建网关/运营底座 | 如何自建统一 API、路由、Key、预算与多租户 | New API、LiteLLM |
| 评测与导购层 | 如何比较中转站的价格、在线率、延迟与异常风险 | Hvoy |

Moyusi 的机会不在于任一层做得更“大”，而在于用一个克制的体验打通前两层，并只在第三层构建生产所需的最小底座。

## 核心竞品

### CC Switch

**已观察**

- 官网当前展示 v3.20.0，定位是统一管理 AI 编程工具工作流，支持 macOS、Windows 和 Linux。[官网](https://ccswitch.io/zh/)
- 文档列出 Claude Code、Claude Desktop、Codex、Gemini CLI、OpenCode、OpenClaw、Hermes 七类受管应用，以及 Provider、MCP、Prompts、Skills、会话和本地代理能力。[软件介绍](https://ccswitch.io/zh/docs?section=getting-started)
- 本地代理包含请求日志、用量统计、故障转移、熔断器和格式转换；数据使用 SQLite + JSON，本地应用采用 React/TypeScript + Tauri/Rust。[中文 README](https://github.com/farion1231/cc-switch/blob/main/README_ZH.md)
- 架构强调 SSOT、原子写入、配置文件双向同步，以及 Commands → Services → DAO → Database 分层。
- 项目使用 MIT 许可证，复用或分发时要保留版权与许可声明。[LICENSE](https://github.com/farion1231/cc-switch/blob/main/LICENSE)
- 安全模型明确它是本地桌面应用，没有项目运营的云后端和多用户隔离；其本地 HTTP 代理可配置监听地址。[Security Policy](https://github.com/farion1231/cc-switch/security)

**优势**

- 抓住高频痛点：本地工具配置与 Provider 切换。
- 真实处理了配置文件写入、备份、异常恢复和多应用差异。
- 本地优先降低了第三方 Key 上云的信任门槛。
- 社区、跨平台和迭代速度形成明显分发优势。

**不足或不覆盖**

- 不是云模型商店，不负责统一账号、资金账本、支付、平台 Key 或模型销售。
- Provider 和线路主要由用户自行获得与判断。
- 本地代理的安全边界和单机状态不等于云端多租户网关。
- 功能面已经很宽，极简用户容易面对较多工具、设置和高级概念。

**对 Moyusi 的结论**

- 复用配置适配、本地代理、原子写入和异常恢复的成熟思路。
- 不照搬其全部 MCP/Skills/Prompts/Session 页面；MVP 只做服务于跨软件迁移的私有 WorkspaceProfile、版本、diff 和回滚。
- 云端账号、平台 Key、计费和线路健康必须是独立系统，不能塞入本地 SQLite。
- MIT 允许商业复用，但 CC Switch 名称、Logo 和官网视觉不应默认视为已授权商标资产。

### ModelFlare

**已观察**

- 控制台以概览、API Key、数据仪表板、充值/订阅、邀请、推广、资料和工单为主。[概览](https://modelflare.dev/dashboard/overview)
- 公开目录当前显示 25 个启用模型，分语言、图片、视频，并按供应商、协议、币种和 Token 单位筛选；模型下再展示路由分组与相对官方价格。[模型与价格](https://modelflare.dev/zh/pricing)
- 文档给出 OpenAI Responses/Chat Completions、Anthropic Messages、Gemini、图片与异步视频等接入路径。[文档](https://modelflare.dev/zh/docs)
- 平台强调一个“智能 API Key”可访问多个模型，用户无需按模型分别建 Key。
- 与 CC-Switch 已存在直接导入：用户从 Key 页面选择导入到 Claude Code 或 Codex，网页填入 Base URL、Key 和用量查询配置；也支持手动添加统一供应商。[CC-Switch 配置](https://modelflare.dev/zh/docs/cc-switch)
- 信任中心披露标准路径不把完整请求/响应正文作为长期业务记录，短期诊断记录设计为 72 小时过期，请求归档默认关闭；同时明确尚未声称 SOC 2 或 ISO 27001，标准服务不支持 HIPAA。[信任与安全](https://modelflare.dev/zh/trust)
- 退款政策包含 24 小时申请窗口、未使用付费部分、手续费、订阅不退款等明确规则。[充值与退款政策](https://modelflare.dev/zh/topup-refund-policy)

**优势**

- 模型、路由分组、协议、价格、Key、充值、订阅和用量形成完整商业闭环。
- 对 Codex、Claude Code、CC-Switch 等具体工具有落地文档。
- 公开数据处理、退款和服务边界，降低了中转平台的不透明感。

**不足或机会**

- 控制台加入充值活动、公告、邀请、推广、工单、订阅等多个增长和运营入口，首屏信息密度高。
- “从网页导入 CC-Switch”仍是两个品牌、两个应用和两套状态；用户需要理解 Key、分组、工具和模型关系。
- 路由折扣很强，但用户还需要判断低价线路在稳定性、来源、限流和数据政策上的真实取舍。

**对 Moyusi 的结论**

- 直接导入是已验证的需求，但应该升级为一次性、短时、不可在 URL/历史中复用的授权票据。
- 模型页要把“协议 + 线路取舍 + 最终实付”放在一起，但首屏不放活动和公告。
- 信任、退款、数据生命周期与上游责任不是页脚附件，而是模型购买决策的一部分。

### OpenRouter

**已观察**

- 通过一个统一 API 提供大量模型，并自动处理 Provider 选择和回退。[Quickstart](https://openrouter.ai/docs/quickstart)
- 路由可以按价格、吞吐、延迟、数据收集、ZDR、量化、参数支持和最大价格约束；默认考虑近期可用性并偏向低价 Provider。[Provider Routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- 同时支持平台余额与 BYOK；BYOK Key 分优先和后备顺序，并可控制是否回落到 OpenRouter 共享容量。[BYOK](https://openrouter.ai/docs/guides/overview/auth/byok)
- 当前公开规则称推理价格透传，上游充值收取费用；这些费率属于易变信息。[FAQ](https://openrouter.ai/docs/faq)

**优势**

- 模型和 Provider 维度的路由控制最细，透明度高。
- 兼容 API、BYOK、共享容量和可编程路由兼容个人与企业场景。
- 模型发现、价格、性能与路由构成强网络效应。

**对 Moyusi 的结论**

- 不要在 MVP 复制 OpenRouter 的全量路由 DSL。
- 先提供三个清楚选项：`稳定`、`低价`、`指定线路`，底层仍保留可扩展路由策略。
- 实际 Provider、实际模型和价格版本应进入响应元数据与用量记录。

## 相关竞品与基础设施

### AIHubMix

- 当前模型页展示多模态大目录、模型作者、价格、上下文、首 Token 延迟与吞吐，并提供自动路由模型。[模型目录](https://aihubmix.com/models)
- 官方文档强调 OpenAI、Gemini、Anthropic 多协议兼容与统一入口。[文档](https://docs.aihubmix.com/en)
- 使用条款涉及余额、支付、BYOK 服务费和限制再次转售等边界，具体采用前必须逐条核验。[Terms](https://docs.aihubmix.com/en/terms-and-privacy/Terms)

**借鉴**：性能指标和自动路由很有价值，但极大目录会增加选择成本。Moyusi 首发应策展 10–20 个代码/语言模型，而不是追求数量。

### SiliconFlow

- 官方产品强调按量推理、专属资源、预留 GPU 和微调等 MaaS 能力。[产品](https://www.siliconflow.com/products)
- 价格页覆盖语言、图片、视频和音频，并说明按量计费与可设置月度消费上限。[Pricing](https://www.siliconflow.com/pricing)

**借鉴**：它更像模型基础设施与算力平台。Moyusi 不应在 MVP 进入训练、专属 GPU 或工作流平台。

### New API

- New API 是开源的多租户 AI 网关和用量管理系统，包含用户/管理员/Root、Key、日志、充值、订阅、渠道、模型、分组与性能监控。[功能概览](https://github.com/QuantumNous/new-api-docs-v1/blob/main/content/docs/en/guide/feature-guide/index.mdx)
- 当前仓库采用 AGPLv3，并有额外署名/链接要求；闭源或去品牌商业场景需要单独评估商业许可。[LICENSE](https://github.com/QuantumNous/new-api/blob/main/LICENSE) / [NOTICE](https://github.com/QuantumNous/new-api/blob/main/NOTICE)

**借鉴**：可作为运营后台和数据模型清单，但不建议在未完成许可证与架构评估时直接作为闭源 Moyusi SaaS 底座。

### LiteLLM

- LiteLLM 提供 100+ 模型的统一输入输出、协议转换、路由/回退、虚拟 Key、预算、成本跟踪与代理服务器。[官方文档](https://docs.litellm.ai/)
- 仓库将企业目录与其余代码分开授权；非企业部分当前为 MIT，具体版本与组件仍需建立许可证 BOM。[LICENSE](https://github.com/BerriAI/litellm/blob/main/LICENSE)

**借鉴**：适合作为协议适配或早期网关加速层，但不能替代 Moyusi 的订单、账本、定价版本、供应商授权和桌面设备模型。

## 能力矩阵

符号：`●` 强；`◐` 有但不是核心；`○` 基本不覆盖；`自建` 指软件底座而非运营服务。

| 产品 | 本地工具配置 | 公共模型目录 | 平台余额/支付 | BYOK | 路由/回退 | 多租户运营 | 极简首用 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CC Switch | ● | ○ | ○ | ● | ●（本地） | ○ | ◐ |
| ModelFlare | ◐（导入） | ● | ● | ○ | ●（平台） | ● | ◐ |
| OpenRouter | ○ | ● | ● | ● | ● | ● | ◐ |
| AIHubMix | ◐（文档/深链） | ● | ● | ◐ | ● | ● | ◐ |
| SiliconFlow | ○ | ● | ● | ○ | ◐ | ● | ◐ |
| New API | ○ | 自建 | 自建 | 自建 | ● | ● | ○ |
| LiteLLM | ○ | 自建 | ○ | ● | ● | ● | ○ |
| Moyusi 目标 | ● | ●（策展） | ● | ◐（本地） | ●（透明） | ◐ → ● | ● |

## 关键产品空位

1. **工具上下文中的购买**：用户看到一个模型时直接选择“接入 Codex/Claude Code”，不先学习 Base URL 和协议。
2. **购买上下文中的工具状态**：模型页能显示“此设备已连接/未安装/需要更新”，而不是只给代码片段。
3. **本地优先的 BYOK**：用户可以在桌面端使用官方或第三方 Key，而不必把 Key 上传到云端。
4. **线路取舍可解释**：用极少标签说明价格、稳定性、延迟、数据处理与回退范围。
5. **资金和调用同一解释链**：账单流水可追到用量事件、价格版本和实际线路。

## Build / Reuse / Avoid

### Reuse / Adapt

- CC Switch 的配置适配、原子写入、备份恢复、本地代理和多应用差异处理。
- LiteLLM 的协议适配与错误归一化可作为候选基础组件。
- ModelFlare 的“从模型到具体工具”文档结构和导入概念。

### Build

- Moyusi 身份、模型目录、线路报价、平台 Key、账本、支付、对账和管理控制面。
- 安全的一次性桌面导入协议和设备注册。
- 价格版本、实际线路、用量和账本之间的可追溯链。
- 极简的模型策展与首次调用体验。

### Avoid

- 在前端硬编码价格和真实端点。
- 直接复制 New API 代码而忽略 AGPL/NOTICE 或商业授权。
- 将 CC Switch 品牌、Logo、官网截图当作 MIT 代码的一部分自由复用。
- 用“低价”替代对线路来源、稳定性、限流和数据处理的说明。
- 首发就堆入推广、邀请、社区、工作台、技能市场和复杂组织功能。
