
# Moyusi

Moyusi 是一个“极简的 AI 工具控制台 + 模型与算力购买 + AI 工作环境迁移平台”的工作名称。目标不是把 CC Switch 和中转站页面简单拼接，而是把以下链路做成一个可理解、可验证、可追踪的闭环：

> 发现闭源或开放模型 → 选择 API/算力 → 接入本地 AI 工具 → 携带工作环境切换软件 → 查看用量与余额

当前目录已经进入 Stage 1 前端工程开发，但仍不是可上线系统：页面数据、价格、余额、API Key 和用量均为演示数据；仓库尚未建立生产后端、数据库、网关、支付或桌面客户端工程。

## 开发前先读

- [文档导航](./docs/README.md)
- [当前仓库审计](./docs/00-current-state.md)
- [产品定义与边界](./docs/01-product-definition.md)
- [竞品调研](./docs/02-competitive-research.md)
- [模型中转与网关平台第二轮调研](./docs/02b-relay-platform-benchmark.md)
- [MVP 产品需求](./docs/03-prd-mvp.md)
- [体验与界面规范](./docs/04-experience-spec.md)
- [技术架构](./docs/05-technical-architecture.md)
- [路线图与开发就绪清单](./docs/06-roadmap.md)
- [原型清理与复用决策](./docs/07-prototype-cleanup-and-reuse.md)
- [两大产品面与多源模型聚合架构](./docs/08-two-surface-aggregator-architecture.md)
- [开放模型供给与可迁移 AI 工作环境](./docs/09-open-models-portable-workspace.md)
- [前端产品架构与交付计划](./docs/10-frontend-architecture-and-delivery-plan.md)
- [产品架构与开发主线](./docs/11-development-mainline.md)
- [仓库开发约束](./guidelines/Guidelines.md)

## 当前原型

```bash
pnpm install
pnpm dev
pnpm check
```

当前预览已收敛为「模型广场」与「工作台」两个一级产品面，并加入闭源/开放模型选择、路由、模型部署、WorkspaceProfile、用量计费和账户骨架。原型不承载真实凭证、计费或生产模型价格。

## 状态

- 文档基线：2026-08-28
- 产品阶段：Stage 1 前端工程基线
- 生产数据：无
- 生产后端：无
- 生产桌面端：无
- 代码版本控制：已建立 Git 基线并持续私有预览发布
  
