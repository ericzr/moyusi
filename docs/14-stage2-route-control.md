# Stage 2：目录 API 与路由控制

本批次把页面与未来 Control Plane 之间的边界再向前推进一层。

## 已实现

- `services/mockApi.ts` 提供 typed mock API 响应格式：`data`、`source`、`receivedAt`；目录页面不再直接把异步边界当作同步 fixture 使用。
- 模型广场在筛选或排序变化时显示目录更新状态；请求失败时保留上一次结果，不将空白误报成“没有模型”。
- 工作台路由策略进入领域状态并写入本地演示存储：
  - 自动选择：按健康、延迟和价格自动选择并回退；
  - 固定当前来源：只使用当前来源，故障时暂停并提醒；
  - 成本优先：在可用来源中优先选择较低成本线路。
- 旧的本地演示状态缺少新字段时，会通过默认值向后兼容，不影响已有预览。
- 目录列表与模型详情共用 `useAsyncResource` 资源状态，保留 stale data，避免网络抖动把用户带到空白页或误导性错误页。
- 工作台首页增加唯一的“建议下一步”动作，优先引导用户验证当前路由；复杂策略仍收纳在路由页的高级设置中。
- 路由策略已从单一字符串升级为 `RoutePolicy`：策略、优先地区、失败处理和“不保存请求正文”约束统一建模。

## 与生产 API 的替换点

`listCatalogModels` 将来替换为 `GET /api/catalog/models`，保留 `CatalogFilter` 输入和 `ApiResponse` 的时间/来源元数据。生产端还需要加入请求 ID、缓存版本和 stale 标记；前端不得根据本地 fixture 计算余额、账本或线路健康。

`getCatalogModel` 将来替换为 `GET /api/catalog/models/:slug`，与列表 API 共享同一 DTO 映射和错误语义。

`getWorkspaceSummary` 将来替换为 `GET /api/workspace/summary`。路由策略保存应改为服务端版本化策略，桌面端只领取已确认的策略版本并回传应用结果。

## 下一步

1. 为目录 API 加入 loading、empty、error、stale 的统一 resource hook。
2. 为路由策略增加策略版本、目标工具和变更审计记录。
3. 用 Codex/Claude Code 配置 fixture 验证策略应用、备份和回滚。
