# 路线图与开发就绪清单

## 规划假设

- 团队：4–6 人，至少包含产品/设计、Web/后端、网关/Rust、桌面/Rust、测试/运维的职责覆盖。
- 目标：先做语言/代码模型、单币种、单支付渠道、个人账号、Codex + Claude Code；开放模型只验证一个共享端点和一个自有端点连接器。
- 周期：约 18–22 周到受控公测；任何上游授权、开放模型许可/算力、支付或合规阻塞都会改变周期。
- 不以“页面完成”作为阶段结束，以端到端事实链闭环作为结束条件。

## Phase 0：决策与风险关闭（1–2 周）

### 工作

- 确定运营主体、首发地区、币种、支付渠道、退款与额度规则。
- 获得首批上游供应授权证据，确认是否允许代理、转售和故障转移。
- 冻结首发 10–20 个模型、2–3 个统一余额供应商、3 类协议和 2 个桌面工具。
- 冻结首发开放模型的 revision、许可、量化、引擎、算力来源、地区和成本边界。
- 冻结 P0 WorkspaceProfile 资产范围、Secret 不迁移原则和 Codex/Claude Code 目标版本矩阵。
- 决定 CC Switch 的验证方式：安全导入适配还是临时 fork。
- 完成 Moyusi 品牌、域名和商标初筛。
- 定义日志正文、计量、审计和财务数据的留存政策。

### 退出门

- 每个首发 RouteOffer 都能指向授权负责人和证据。
- 支付、退款、额度、税费与发票有书面规则。
- CC Switch/LiteLLM/其他依赖有许可证 BOM 和采用结论。
- 首发开放模型权重、推理引擎、容器和模板有许可/来源证据；不满足条件时退回用户自有端点模式。
- 本文档中的 6 个业务待确认问题有所有者和截止日期。

## Phase 1：工程基线与原型收敛（2 周）

### 工作

- 初始化 Git、分支保护、CODEOWNERS、锁文件和 CI。
- 建 monorepo 骨架、环境分层、Secret 管理和数据库迁移。
- 以已清理的原型为交互基线，保持旧素材不再进入工作区和构建链。
- 拆分现有 `App.tsx`，保留模型目录和接入体验。
- 建 OpenAPI/JSON Schema 合同与 mock server。
- 定义 WorkspaceProfile、SkillBundle、McpServer、PromptTemplate、ServingRevision 与 MigrationReport Schema。
- 建 Codex/Claude Code 多版本 Profile fixture、恶意 MCP/Skill fixture 和开放模型端点 fixture。
- 建 Key 扫描、依赖扫描、格式化、类型检查和最小端到端测试。

### 退出门

- 新成员能用一条命令启动 Web + mock API。
- CI 能阻止类型错误、secret-like 字符串和未授权依赖进入主分支。
- 模型、线路、价格、Key、用量不再由页面常量直接驱动。
- Profile 迁移和开放模型身份可以在 mock 环境中生成可验证的计划/报告。

## Phase 2：目录、Key、Profile 与桌面导入闭环（4 周）

### 工作

- Control Plane：账号、Catalog、PriceVersion、平台 Key、Device、ImportGrant。
- Web：模型广场与工作台两个一级产品面，以及接入确认。
- Desktop：设备注册、Codex/Claude Code 发现、Target Adapter、变更预览、原子写入、备份恢复。
- Asset Registry：WorkspaceProfile，以及私有 MCP、Skills、Prompts 的导入、版本和通用导出。
- 实现一次性、短时、设备绑定的导入票据。
- 使用无资金的 mock gateway 完成连接测试。

### 退出门

- 全新用户能在干净环境完成“模型 → Key → Profile → 桌面确认 → mock 首次调用”。
- 导入票据重放、换设备和过期均失败。
- 配置写入失败不会破坏原文件。
- Profile 的每个资产明确标记 exact/adapted/rebuilt/unsupported，且导出包不含 Secret。

## Phase 3：生产网关、开放模型与计量闭环（5 周）

### 工作

- 实现 Responses、Chat Completions、Anthropic Messages 兼容面。
- 实现平台 Key 认证、范围、额度预留、速率限制和取消。
- 接首批授权上游；建立同模型多线路路由、回退和熔断。
- 接一个固定 ServingRevision 的共享开放模型，并支持连接一个用户自有 OpenAI-compatible 端点。
- 建 ModelArtifact、ServingRevision、ServingEndpoint、冷启动与能力矩阵，不在 P0 自研通用 GPU 调度器。
- 建版本化合成探测与线路证据聚合，记录地区、样本量、成功率、TTFT/总时延和计量差异。
- 标准化用量事件、价格版本和请求元数据。
- 建用量页、线路健康面板与端到端 Trace。
- 执行协议合同测试和故障注入。

### 退出门

- 每个首发模型通过流式、非流式、工具调用、错误和取消测试。
- 任一请求可追到实际模型、RouteOffer、PriceVersion 和 UsageEvent。
- 开放模型请求还能追到权重 revision/digest、量化、chat template、引擎与端点版本。
- 回退不跨越未授权模型边界，部分流后不做无痕重放。
- 任一公开健康状态可追到新鲜的探测/被动样本；样本不足或过期时显示 unknown/stale。

## Phase 4：账本、支付与管理运营（3–4 周）

### 工作

- 建双分录账本、预留/释放、结算、赠送、退款和调账。
- 接单一支付渠道，验证 webhook、重放、拒付和退款。
- 建账单页、流水详情和余额不足体验。
- 建管理端模型/线路、价格发布、订单、调账、账号/Key 和审计。
- 建平台计量、支付和上游成本日对账。

### 退出门

- 任何支付 webhook 重放不会重复入账。
- 任一结算可以按历史 PriceVersion 重建。
- 账本始终平衡，人工调账有理由和审批。
- 沙盒与小额真实交易均完成端到端核对。

## Phase 5：受控公测与加固（2–3 周）

### 工作

- 邀请 20–50 名目标用户，观察首次接入和连续使用。
- 做容量、故障、Key 泄漏、上游撤线、支付异常和恢复演练。
- 建状态页、支持流程、漏洞报告、事故响应和退款流程。
- 完成隐私、条款、可接受使用、模型/线路说明和开源 Notices。
- 对 Profile 迁移、恶意 MCP/Skill、开放模型供应链和端点失效做恢复演练。
- 优化首次调用和首次迁移时间与错误文案，不增加新功能面。

### 退出门

- 一键接入成功率 ≥ 95%。
- WorkspaceProfile 部署成功率 ≥ 95%，失败迁移可回滚。
- 注册到首次成功调用中位时间 ≤ 3 分钟。
- 无 P0/P1 安全、账务或数据一致性问题。
- 值班、回滚、上游下线和人工冻结流程可执行。

## Epic 清单

| Epic | 主要产出 | 前置 |
| --- | --- | --- |
| E01 工程基线 | monorepo、CI、环境、Secret、迁移 | 无 |
| E02 身份 | 登录、会话、近期认证 | E01 |
| E03 Catalog | Model/Capability/RouteOffer/PriceVersion | E01 |
| E04 平台 Key | 创建、范围、限额、吊销 | E02 |
| E05 Desktop | 设备、工具适配、原子写入、Keychain | E01/E04 |
| E06 ImportGrant | 深链、单次交换、设备证明 | E02/E05 |
| E07 Gateway | 协议、认证、路由、流式 | E03/E04 |
| E08 Metering | UsageEvent、计量、PriceVersion 绑定 | E03/E07 |
| E09 Ledger | 预留、结算、余额、补偿 | E08 |
| E10 Payments | 订单、Webhook、退款、拒付 | E09 |
| E11 Console | 模型、Key、用量、账单、设备 | E02–E10 |
| E12 Admin/Ops | 线路、定价、订单、调账、审计 | E03/E09/E10 |
| E13 Trust | 政策、留存、状态、Notices、事件响应 | 全程 |
| E14 Open Serving | ModelArtifact、ServingRevision、共享/BYOC 端点 | E03/E07 |
| E15 Workspace Profile | MCP、Skills、Prompts、版本与导出 | E01/E05 |
| E16 Target Adapters | Codex/Claude Code 计划、diff、验证、回滚 | E05/E15 |
| E17 Memory/Knowledge | 经审核记忆、源文档、ACL、索引 projection（P1） | E15 |

## 第一迭代建议（10 个工作日）

1. 初始化 Git 与包管理锁文件。
2. 建 `apps/web`、`apps/desktop`、`services/control-plane`、`services/gateway` 骨架。
3. 把所有 secret-like 演示字符串替换为明显占位符；确认是否需要轮换任何真实 Key。
4. 把 `MODELS` 转成 Catalog fixture，并从 mock API 读取。
5. 拆出模型广场与工作台两个一级产品面；工作台内部再分路由、API 与来源、模型与部署、工作环境、用量计费、账户。
6. 定义 Model、RouteOffer、PriceVersion、ApiCredential、ImportGrant、ServingRevision 和 WorkspaceProfile Schema。
7. 完成 Codex 和 Claude Code 配置/Profile fixture 收集，不接真实 Key。
8. 做 ImportGrant 威胁建模和 API 合同。
9. 建端到端测试：选模型 → 建假 Key → 导入 Profile → 假设备应用 → mock 调用。
10. 输出三层供给清单和上游授权/支付/许可决策表，未决项进入发布阻塞列表。

## 风险登记

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 上游不允许转售或账号共享 | 高 | 致命 | 只接有书面授权的渠道；RouteOffer 绑定授权证据 |
| 低价线路突然失效或涨价 | 高 | 高 | 多渠道、PriceVersion、生效时间、熔断与下线流程 |
| 账本与上游计量不一致 | 中 | 致命 | 原始计量留证、幂等结算、日对账、补偿分录 |
| Key 泄漏造成资金损失 | 中 | 致命 | 只显示一次、摘要存储、限额、设备绑定、异常检测 |
| CC Switch 上游漂移 | 高 | 中 | 小 patch stack、适配器边界、定期合并与 fixture 回归 |
| AGPL/商标/第三方许可不合规 | 中 | 高 | SBOM/NOTICE、法律审查、避免未经授权去品牌 |
| 协议“兼容”但工具调用失败 | 高 | 高 | 按工具版本做合同测试，不只测试简单聊天 |
| 用户误解线路为官方 | 中 | 高 | 文案规则、来源/等级可见、禁止无证据“官方”标签 |
| 活动与增长功能稀释极简体验 | 高 | 中 | MVP 导航冻结，任何新入口需证明不影响首用 |
| 单文件原型继续承载生产逻辑 | 高 | 高 | Phase 1 拆分是强制门，不允许跳过 |
| 开放模型许可或权重来源不允许商用 | 中 | 致命 | 发布前固定 revision 和许可证据；不确定时只允许用户自有部署 |
| 量化/模板/引擎变化导致“同模型”行为漂移 | 高 | 高 | ServingRevision 不可变；能力合同、digest 和响应元数据可追踪 |
| MCP/Skill 迁移引入本地代码执行风险 | 高 | 致命 | 来源/签名/扫描、最小权限、用户确认、沙箱和审计 |
| 对跨软件会话做虚假无损承诺 | 中 | 高 | 只提供新会话检查点；迁移报告明确 rebuilt/unsupported |

## Definition of Ready

一个研发故事进入开发前必须具备：

- 明确用户结果和不在范围内的内容。
- API/Schema、权限、错误和审计要求。
- 资金或计量影响说明。
- 安全/隐私数据分类。
- 可自动化的验收标准。
- 设计稿中无依赖硬编码价格或真实 Key。

## Definition of Done

- 代码、迁移、合同与 SDK 同步。
- 单元、集成、端到端和相关安全测试通过。
- 日志不含敏感数据，Metrics/Trace 可观察。
- 失败、重试、重复事件和回滚路径已测试。
- 账务相关变更通过双人评审与对账样本。
- 用户文档、管理文档和开源 Notices 已更新。
- 功能开关可关闭，发布可回滚。

## 需要产品负责人拍板的 10 个问题

1. Moyusi 首发服务哪些国家/地区？
2. 运营主体、收款主体和结算币种是什么？
3. 哪些上游已明确允许商业代理/转售？
4. 首发支持哪些模型和线路等级？
5. 充值余额是否过期，是否退款，赠送额度如何处理？
6. 是否允许用户把第三方 BYOK 上传云端，还是坚持本地保存？
7. 桌面端是否基于 CC Switch fork，是否开源？
8. 是否必须首发 Gemini CLI，还是先只做 Codex + Claude Code？
9. 默认是否完全不保存请求/响应正文？
10. `Moyusi` 是正式品牌还是项目代号？
