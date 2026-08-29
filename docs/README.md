# Moyusi 开发文档

本文档集把已确认事实、产品决策、工程方案和待确认问题分开。所有竞品价格、模型数量、版本和政策都只代表 2026-08-28 的页面快照，开发时必须再次核验。

## 建议阅读顺序

1. [00-current-state.md](./00-current-state.md)：现有代码能做什么，不能做什么。
2. [01-product-definition.md](./01-product-definition.md)：产品定位、边界、用户与成功指标。
3. [02-competitive-research.md](./02-competitive-research.md)：竞品事实、差距与可借鉴结论。
4. [02b-relay-platform-benchmark.md](./02b-relay-platform-benchmark.md)：第二轮中转/网关调研，重点是 ModelFlare、Hvoy 与线路可信度。
5. [03-prd-mvp.md](./03-prd-mvp.md)：MVP 页面、流程、需求与验收标准。
6. [04-experience-spec.md](./04-experience-spec.md)：极简克制的体验原则和组件规范。
7. [05-technical-architecture.md](./05-technical-architecture.md)：云平台、网关、计费账本与桌面端的边界。
8. [06-roadmap.md](./06-roadmap.md)：阶段计划、风险、决策门和开发就绪清单。
9. [07-prototype-cleanup-and-reuse.md](./07-prototype-cleanup-and-reuse.md)：旧原型清理结果，以及保留、改造和删除的视觉决策。
10. [08-two-surface-aggregator-architecture.md](./08-two-surface-aggregator-architecture.md)：模型广场、工作台、三层供给、统一结算与供应商准入。
11. [09-open-models-portable-workspace.md](./09-open-models-portable-workspace.md)：开放模型算力、WorkspaceProfile、MCP/Skills/Prompts/记忆/知识库与跨软件迁移。
12. [10-frontend-architecture-and-delivery-plan.md](./10-frontend-architecture-and-delivery-plan.md)：当前前端模块、URL、状态边界、迭代阶段与发布门。
13. [11-development-mainline.md](./11-development-mainline.md)：冻结后的产品/系统架构、供给经营策略、五条开发主线和阶段退出标准。
14. [12-stage2-vertical-slice.md](./12-stage2-vertical-slice.md)：模型来源选择、一键切换、可恢复路由、模拟调用与费用记录的首条纵向闭环。
15. [13-web-desktop-boundary.md](./13-web-desktop-boundary.md)：CC Switch 能力拆解、网页与桌面端边界及轻量桥接决策。
16. [14-stage2-route-control.md](./14-stage2-route-control.md)：typed mock API、目录状态与路由策略控制的 Stage 2 增量。
17. [15-cc-switch-capability-matrix.md](./15-cc-switch-capability-matrix.md)：逐页核对 CC Switch 截图、能力取舍矩阵与 Moyusi 工作台后续开发主线。

## 当前冻结的产品决策

| 决策 | 结论 |
| --- | --- |
| 产品形态 | 只保留「模型广场」与「工作台」两个一级产品面；工作台整合路由、Key、模型部署、工作环境、用量、计费、设备和账户。 |
| MVP 主闭环 | 模型广场选闭源 API 或开放模型来源 → 加入工作台 → 创建/连接 Key 或端点 → 路由生效 → 首次调用 → 用量可见。 |
| “购买模型”的含义 | 购买可消费额度或套餐，不暗示用户获得模型所有权、官方账号或独占容量。 |
| CC Switch 策略 | 参考并复用其 MIT 许可允许的能力；先做独立品牌的兼容桌面端和上游合并策略，不复用 CC Switch 商标。 |
| 凭证边界 | 平台 Key 在服务端只存不可逆摘要；第三方上游 Key 默认不跨设备同步；桌面端使用系统安全存储。 |
| 供给边界 | 签约供给使用 Moyusi 统一余额；长尾供给默认 BYOK 或供应商直连；广泛收录不等于允许统一销售。 |
| 开放模型边界 | 区分开放权重、开放源代码引擎和闭源 API；模型工件、部署修订、算力与价格分别建模。 |
| 工作环境 | MCP、Skills、Prompts、经审核记忆和知识库归入 WorkspaceProfile；Secret 不随 Profile 导出。 |
| 迁移承诺 | 支持原样携带、适配转换、语义重建和不支持报告；不承诺隐藏推理、厂商会话进程或内部缓存无损迁移。 |
| 计费边界 | 不以请求日志充当账本；使用不可变账本、定价版本和幂等支付事件。 |
| 路由透明度 | 模型、线路、协议、价格和数据处理属性可见；默认不在不同模型家族之间静默替换。 |
| 首发协议 | OpenAI Responses、Chat Completions、Anthropic Messages；Gemini 原生协议进入后续阶段。 |
| 首发模态 | 以语言/代码模型为主；图片、视频工作台不进入 MVP。 |

## 事实标记

- `已观察`：来自当前仓库或本次打开的官方页面。
- `推断`：基于已观察事实形成的产品或工程判断。
- `待确认`：需要业务、法务、供应商或真实用户验证。
- `易变`：价格、版本、模型目录、许可或政策，实施前必须重查。

## 开发启动门

以下 6 项未关闭前，不建议开始支付或生产网关开发：

1. 确定运营主体、目标国家/地区和收款方式。
2. 确认上游模型来源与转售/代理授权范围。
3. 选择 CC Switch 复用方式并完成许可证、NOTICE 与商标审查。
4. 确认货币、税费、退款、额度有效期与发票规则。
5. 冻结 MVP 支持的协议、模型和本地工具。
6. 确认默认日志与内容留存策略。
