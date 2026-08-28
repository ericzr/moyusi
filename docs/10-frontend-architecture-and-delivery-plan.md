# 前端产品架构与交付计划

状态：首个双产品面预览已落地  
日期：2026-08-28

## 1. 当前结果

仓库已经从“四个并列演示页”进入双产品面架构：

```text
Moyusi
├── 模型广场
│   ├── 闭源 API
│   ├── 开放权重共享算力
│   └── 用户自有端点
└── 工作台
    ├── 总览
    ├── 路由
    ├── API 与来源
    ├── 模型与部署
    ├── 工作环境
    ├── 用量与计费
    └── 账户
```

当前预览已经包含：

- 用户提供的日间黑字 Logo 与夜间白字 Logo；
- 主题跟随系统、手动切换和本地偏好保存；
- 模型搜索、闭源/开放权重筛选和接入状态；
- 从模型广场把候选模型带入工作台路由配置；
- 路由、来源、开放模型部署、WorkspaceProfile、用量和账户的产品骨架；
- 桌面与窄屏响应式布局；
- 明确的演示数据标记，不伪装成真实报价、健康或支付。

这仍是前端产品预览，不包含真实后端、支付、模型调用、桌面文件写入或 Secret。

## 2. 视觉与品牌规则

### Logo

```text
public/brand/moyusi-light.png   # 日间模式：红色标志 + 黑色字标
public/brand/moyusi-dark.png    # 夜间模式：红色标志 + 白色字标
```

- 不使用 CSS 反色或滤镜修改 Logo；
- 红色只用于品牌标志、少量关键图标和键盘焦点；
- Logo 保持原始比例，不裁切立体标志；
- 主题在 React 挂载前读取，避免先闪现错误字标；
- 后续如需 favicon，应从品牌方提供的纯标志文件生成，不从宽幅 PNG 截图替代。

### 极简克制

- 无大面积渐变、发光背景、Logo 墙和活动横幅；
- 页面按任务组织，首屏不同时展开所有设置；
- 技术字段使用等宽数字，正文使用系统字体；
- 状态不只依赖颜色，同时有文字与图形；
- 模型来源、费用、数据策略和迁移损失不能为“简洁”而隐藏。

## 3. 前端模块边界

当前代码按产品领域开始拆分：

```text
src/
├── app/
│   └── App.tsx                       # 双产品面 Shell、主题与跨面跳转
├── features/
│   ├── catalog/
│   │   ├── ModelSquare.tsx           # 模型发现、筛选和选择
│   │   └── catalogData.ts            # 仅供预览的目录 fixture
│   └── workspace/
│       ├── Workspace.tsx             # 工作台子域与交互骨架
│       └── workspace.css
└── styles/
    ├── theme.css                     # 品牌和语义 token
    └── index.css                     # Shell 与模型广场样式
```

生产化时扩展为：

```text
src/
├── app/                 # Router、Provider、权限门、错误边界
├── pages/               # /market、/market/:slug、/workspace/*
├── features/
│   ├── catalog/
│   ├── routing/
│   ├── sources/
│   ├── deployments/
│   ├── workspace-profile/
│   ├── usage/
│   ├── billing/
│   └── account/
├── entities/            # Model、RouteOffer、ServingRevision 等
├── shared/
│   ├── api/             # OpenAPI 生成 client、错误映射
│   ├── ui/              # 无领域语义的 UI primitives
│   ├── format/          # 金额、Token、时间、状态格式化
│   └── security/        # Secret 脱敏、敏感字段防渲染
└── fixtures/            # 明确隔离的演示/测试数据
```

`App.tsx` 只负责 Shell 和跨产品面状态，不继续承载目录、账本、Profile 或路由业务逻辑。

## 4. 页面与 URL 规划

### 公共与模型广场

```text
/                         定位与模型广场入口
/market                   模型广场
/market/:modelSlug        模型身份、能力与多供给比较
/trust                    数据、线路、计量和安全边界
/download                 桌面端下载与版本要求
```

### 工作台

```text
/workspace                总览
/workspace/routing        路由与工具 Profile
/workspace/sources        平台 Key、BYOK、供应商连接
/workspace/deployments    共享、专属和自有开放模型端点
/workspace/environments   WorkspaceProfile 与迁移报告
/workspace/billing        用量、余额、账本和订单
/workspace/account        账号、设备、会话与隐私
```

一级导航始终只有「模型广场」和「工作台」。工作台子路由可以复制链接，但不会升级成新的一级产品面。

## 5. 状态与数据策略

### 本地 UI 状态

只保存以下非敏感内容：

- 主题偏好；
- 当前筛选、排序和展开状态；
- 未提交表单草稿；
- 桌面端可以安全缓存的非敏感 Profile manifest。

不得写入 `localStorage`：平台 API Key、BYOK Secret、OAuth token、支付凭证、请求正文和知识库私密内容。

### 服务端状态

- Catalog、RouteOffer、PriceVersion、健康窗口；
- 用户、设备、平台 Key 摘要与权限；
- WorkspaceProfile 的非敏感资产和版本；
- UsageEvent、Settlement、Ledger 和订单；
- MigrationPlan 与脱敏 MigrationReport。

### 桌面端状态

- 系统安全存储中的 BYOK 与 SecretBinding；
- 目标软件发现结果；
- 配置备份、字段 diff 和回滚状态；
- 本地代理和自有端点连接状态。

## 6. 前端 API 合同优先级

第一批只冻结读取和无资金写入：

```text
GET  /api/catalog/models
GET  /api/catalog/models/:slug
GET  /api/workspace/summary
GET  /api/routing/profiles
POST /api/desktop/import-grants
GET  /api/workspace-profiles
POST /api/workspace-profiles/:id/migration-plans
GET  /api/deployments
POST /api/endpoint-connections:test
```

第二批再接资金与高风险操作：

```text
POST /api/keys
POST /api/keys/:id/revoke
GET  /api/usage/requests
GET  /api/ledger/transactions
POST /api/billing/orders
POST /api/deployments
```

前端不得自行计算生产价格、余额、扣费或线路健康结论。

## 7. 开发阶段

### Stage 0：产品预览，已完成

- 双产品面 Shell；
- 日间/夜间 Logo 与主题；
- 模型广场第一屏和目录；
- 工作台七个子域的真实内容骨架；
- 基础交互、响应式和构建验证。

### Stage 1：前端工程基线，1–2 周

- 引入正式 Router，将当前内存页面状态变成可分享 URL；
- 增加 TypeScript 类型检查、ESLint、单元测试和 Playwright 最小流程；
- 抽出 UI primitives、领域实体和 fixtures；
- 建 OpenAPI/JSON Schema client 与 mock server；
- 加载、空、错误、过期和无权限状态；
- 形成深浅主题视觉回归基线。

退出标准：模型广场和工作台在 mock API 下可独立刷新、可深链、可自动测试。

### Stage 2：模型到桌面接入，2–3 周

- 接 Catalog、RouteOffer、PriceVersion 和健康证据；
- 完成模型详情与多来源比较；
- 接平台 Key 的创建、范围、限额和吊销演示环境；
- 建 ImportGrant、设备发现、配置 diff、确认和回滚 UI；
- 支持 Codex 与 Claude Code 的 fixture 合同测试。

退出标准：用户能完成“选模型 → 创建演示 Key → 桌面确认 → mock 首次调用”。

### Stage 3：开放模型与工作环境，3–4 周

- 接 ModelArtifact、ServingRevision、ServingEndpoint 和能力矩阵；
- 完成共享端点和用户自有 OpenAI-compatible 端点流程；
- 接 WorkspaceProfile、MCP、Skills、Prompts 的版本与通用导出；
- 实现 exact/adapted/rebuilt/unsupported 迁移报告；
- 加入 Secret 重新绑定、权限 diff 和失败回滚体验。

退出标准：同一个 Profile 可在 Codex 与 Claude Code fixture 间完成可解释迁移。

### Stage 4：计量、账本与受控公测，4–6 周

- 接实际请求、计量、价格版本和线路元数据；
- 接余额、预留、结算和不可变账本；
- 接单一支付渠道的沙盒流程；
- 建异常、对账和管理运营入口；
- 完成安全、性能、可访问性和恢复演练。

退出标准：任一调用与扣费可追溯，任何支付重放不重复入账，关键功能可关闭和回滚。

## 8. 第一开发迭代

建议接下来 10 个工作日只做以下内容：

1. 初始化 Git、CI、类型检查和测试。
2. 把当前两个产品面接入正式 Router。
3. 将 `catalogData.ts` 移到独立 fixtures，并明确禁止生产导入。
4. 定义 Model、RouteOffer、ServingRevision、WorkspaceProfile Schema。
5. 建 Catalog 与 Workspace Summary mock API。
6. 完成模型详情抽屉和多供给比较。
7. 完成工作台加载、空、错误、未知健康和余额不足状态。
8. 建 Codex/Claude Code 多版本配置 fixture。
9. 建“模型 → 工作台路由”的端到端测试。
10. 为 Logo、主题和 390px/桌面布局建立视觉回归快照。

## 9. 发布门

- 演示数据与生产 API 不能混用；
- 未核验许可证的开放权重模型不能标记为可销售；
- 未签约的闭源线路不能使用统一余额；
- Secret 不进入网页 URL、日志、截图、Profile 或导出包；
- 工作环境迁移必须逐项报告损失，不能只显示“同步成功”；
- 日间/夜间 Logo、键盘操作、窄屏和减少动态效果必须通过验收；
- 支付、定价和调账上线前需要独立审计与回滚演练。
