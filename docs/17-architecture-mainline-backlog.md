# 架构主线任务清单

更新时间：2026-08-30

本清单用于控制开发顺序。前端可以先用 mock 实现，但每个 mock 都必须对应未来的 Control Plane、Gateway、Desktop 或 Worker 合同；不再新增无法落到系统边界的页面按钮。

## 当前已完成

- `PlatformModelGraph`：模型身份、模型版本、Provider、RouteOffer、PriceVersion、ProbeWindow 分离建模。
- `Source → ProviderProfile → RouteProfile` typed repository。
- 模型广场到工作台的来源选择、接入分流和可恢复路由演示。
- 统一余额、BYOK、共享/专属算力、自有端点的权限边界表达。
- 模型来源级价格、性能和数据策略证据。
- `ControlPlaneSnapshot`：默认项目、来源授权、脱敏调用 Key、Desktop 设备、费用和 Workspace 资产的只读投影。
- 控制面命令合同：连接来源、创建调用 Key、保存路由、测试端点、创建迁移计划均返回可轮询的 operation 状态。
- 控制面 mock command executor 已完成：支持项目校验、来源校验、空权限校验和 Desktop 离线阻断，并将成功/失败结果写入可替换的 operation store。
- 五类供给接入切片：BYOK 本机授权、自有端点探测、专属算力预算确认与 `DeploymentOrder` 已接入工作台；路由保存统一经过 command executor。
- `CatalogVersion / CatalogSnapshot`：目录版本具备发布状态、来源、模型/来源数量，以及 fresh、stale、unknown 探测证据计数，并通过 typed mock API 暴露。

## 下一批：控制面命令与发布状态（P0）

1. **身份与项目**
   - `User`、默认 `Project`、`DesktopDevice`、`ApiCredential` 类型。
   - 所有目录、路由、用量和资产都绑定 `project_id`，避免未来多账号改造时重写数据层。
2. **来源与授权**
   - `ProviderSource`、`Entitlement`、`SecretBinding`、`EndpointConnection`、`ImportGrant`。
   - 统一余额来源与 BYOK 来源明确区分；网页只保存状态和引用，不保存第三方密钥。
3. **目录发布**
   - `CatalogSnapshot`、`CatalogVersion`、模型/来源上下架状态。
   - 价格版本、探测窗口、许可证和数据政策必须可追溯到发布版本。
4. **命令边界**
   - 把“连接来源、创建 Key、保存路由、测试端点、创建迁移计划”建成独立命令，不允许直接修改快照。
   - 每个命令返回 operation/status，支持 pending、succeeded、failed、expired 和 rollback-required。

## 再下一批：网关与计量合同（P0）

1. `ApiRequest → RouteAttempt[] → UsageEvent → Settlement` 事件链。
2. 为 `request_id`、`idempotency_key`、`price_version_id` 和 `source_event_id` 建立幂等约束。
3. 先支持 OpenAI Responses、Chat Completions、Anthropic Messages；未支持参数返回明确错误。
4. 回退只允许超时、连接错误、明确限流和可恢复 5xx；流式已输出后不得无痕重放。

## Desktop Alpha（P0）

1. 设备心跳和本地路由状态。
2. Codex / Claude Code 配置发现、字段级 diff、备份、原子写入、验证和回滚。
3. 一次性 `ImportGrant` 交换；Secret 仅进入系统安全存储。
4. Web 只发送策略和不含 Secret 的 `MigrationPlan`，Desktop 返回脱敏的 `MigrationReport`。

## 工作环境迁移（P1）

1. WorkspaceProfile manifest 与版本。
2. MCP、Skills、Prompts 的 exact / adapted / rebuilt / unsupported 结果。
3. 会话索引先迁移元数据与规范化 transcript，知识库先迁移源引用、权限和索引重建计划。
4. 目标软件适配器按版本维护 fixture、黄金 diff 和回滚测试。

## 开放模型算力（P1）

1. `ModelArtifact → ServingRevision → ServingEndpoint`。
2. 固定 repo、revision、weights digest、tokenizer、chat template、引擎版本和量化参数。
3. 共享端点按量计费；专属端点使用 DeploymentCostRate 与预算确认，不伪造 Token 单价。

## 支付与运营（P2）

只有以下条件满足后才接入真实充值：运营主体、地区、收款、退款、上游授权、税费和额度有效期均已确认；并完成支付重放、负余额、上游对账、供应商下线和退款演练。

## 每批退出标准

- 有领域类型和 API DTO，而不是仅有组件状态。
- 有成功、失败、离线、过期或回滚状态。
- 有至少一条契约测试和一条幂等/边界测试。
- 不泄露 Secret，不把演示数据描述成真实余额、SLA 或供应商授权。
- `pnpm typecheck`、`pnpm test`、`pnpm build`、`git diff --check` 全部通过。
