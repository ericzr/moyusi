# 当前仓库审计

审计日期：2026-08-28

## 结论

当前目录是一个已完成双产品面收敛的交互前端预览，表达“语言/图片/视频任务选型 + 闭源/开放模型供给 + 路由与部署 + 可迁移工作环境 + 用量账户”的产品架构，但仍不是生产工程。旧视觉导出、气候数据面板、占位品牌、仿真密钥和无关 UI 组件已迁出工作区；模型广场与工作台已经拆成 feature，下一步应接入 Router、有类型的 mock API 和自动化测试。

## 当前可验证的产品资产

- 两个一级产品面：模型广场、工作台。
- 策展模型目录：先按语言、图片、视频选择任务，再筛选闭源 API、开放权重、共享/专属算力和自有端点，并比较多供给来源后带入工作台。
- 工作台子域：总览、路由、API 与来源、模型与部署、工作环境、用量与计费、账户。
- WorkspaceProfile 的 MCP、Skills、Prompts、知识来源与迁移结果展示。
- 用户提供的日间/夜间 Logo、主题偏好、桌面与窄屏布局。
- 用量趋势、调用记录、遮蔽 Key、余额和账本的最小展示形态。

所有模型、价格、余额、线路健康、请求和 Key 都是明确标注的演示数据。

## 本轮已完成的清理

| 项目 | 当前状态 | 结果 |
| --- | --- | --- |
| 旧占位品牌和域名 | 已清除 | 界面、样式变量和示例端点统一为 Moyusi 语义 |
| 旧气候数据面板 | 已迁出 | 地图、热力点、天气/过敏数据和截图不再参与构建 |
| 设计工具导出层 | 已迁出 | 删除绝对定位导入组件和无使用的通用组件集合 |
| 旧方案目录 | 已迁出 | 不再把旧页面生成计划当产品需求 |
| 仿真密钥 | 已替换 | 只保留明显遮蔽的演示值；接入示例使用占位端点 |
| 外部字体与冗余样式链 | 已移除 | 使用系统字体和单一主题样式入口 |
| 依赖与锁文件 | 已收敛 | 运行时只保留 React、React DOM 与图标库，并生成 pnpm 锁文件 |

## 仍不能作为生产基础的部分

| 问题 | 当前证据 | 风险 | 下一步 |
| --- | --- | --- | --- |
| 路由与领域仍是预览骨架 | 当前只有 catalog/workspace 两个 feature，URL 仍由内存状态切换 | 无法深链、独立加载和按域测试 | 引入 Router，并按 routing、sources、deployments、profile、billing 拆分 |
| 状态仅在内存 | 刷新后恢复演示初始态 | 无并发、持久化和审计 | 先接有类型的 mock API，再接 control plane |
| 数据硬编码 | 模型、价格、健康和账本均为 fixture | 容易被误认为生产事实 | 将 fixture 移入独立目录，并由有类型 mock API 驱动 |
| 没有后端与桌面端 | 当前只有 Vite Web 原型 | 无法实现安全 Key、真实配置写入和调用 | 建 control plane、gateway 与 desktop 工程 |
| 没有生产测试 | 目前以构建和浏览器人工验收为主 | 回归不可控 | 建类型检查、单测、合同测试与最小 E2E |
| 版本控制刚建立 | 当前已初始化 Git，但仍处于首版原型历史 | 评审基线和发布流程仍需固化 | 建分支保护、提交规范和持续集成 |

## 当前原型与目标领域的映射

| 原型概念 | 生产领域 | 决策 |
| --- | --- | --- |
| 模型供给行 | Model + RouteOffer/ServingEndpoint + PriceVersion | 服务端维护、版本化发布 |
| 24h 证据 | RouteEvidenceWindow | 必须带窗口、地区、样本量和新鲜度 |
| 接入弹窗 | ImportGrant + Desktop ChangeSet | 网页不直接写本机文件或传递明文 Key |
| 工作台路由 | Device + ToolProfile + RoutingPolicy | 真实状态由桌面端上报，云端只保留必要元数据 |
| 工作环境与迁移 | WorkspaceProfile + MigrationPlan/Report | Adapter 生成，桌面端确认、验证与回滚 |
| 用量条形图 | UsageRecord 聚合 | 由结算事件生成，不由前端造数 |
| 余额与流水 | LedgerAccount + LedgerEntry | 余额由不可变账本派生，不能直接改数值 |
| 遮蔽 Key | API Credential | 明文仅创建时展示一次，服务端保存摘要 |

## 建议的前端拆分

```text
apps/web/
  src/
    app/                 # 路由与全局布局
    features/
      catalog/           # 模型与线路报价
      api-keys/          # 创建、吊销、范围和配额
      usage/             # 请求与费用聚合
      billing/           # 充值、订单、账本流水
      desktop/           # 设备与安全导入
    entities/            # Model, RouteOffer, ApiKey, Device
    shared/              # UI、格式化、API client

apps/desktop/
  src/                   # React UI
  src-tauri/             # Rust 命令、配置适配器、本地代理

services/
  control-plane/         # 账号、目录、Key、计费、管理
  gateway/               # 兼容协议、路由、计量
  worker/                # 支付回调、结算、通知、对账
```

## 迁移顺序

1. 初始化 Git、格式化、类型检查、测试和 CI。
2. 把 `App.tsx` 拆成页面和领域组件，保持已验收的行为不变。
3. 用有类型的 mock server 替换页面常量，冻结 API contract。
4. 实现 control plane 与桌面配置变更预览，再接 gateway。
5. 最后接账本、支付和真实上游，避免在边界未稳时处理资金。

## 安全提醒

上线代码、示例、截图、日志和测试快照中不得出现真实 API Key。第三方 BYOK 默认只进入桌面系统安全存储；网页不得直接写本机配置，也不得把 Key 放进 URL。
