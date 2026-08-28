import type { OfferType } from "./catalog";

export type WorkspaceSection =
  | "overview"
  | "routing"
  | "sources"
  | "deployments"
  | "environment"
  | "billing"
  | "account";

export type AccessFlow = {
  title: string;
  description: string;
  status: string;
  note: string;
  action: string;
  targetSection: WorkspaceSection;
  actionKind: "route" | "credential" | "endpoint" | "budget";
};

export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  "overview",
  "routing",
  "sources",
  "deployments",
  "environment",
  "billing",
  "account",
];

export function isWorkspaceSection(value: string | undefined): value is WorkspaceSection {
  return Boolean(value && WORKSPACE_SECTIONS.includes(value as WorkspaceSection));
}

export function getAccessFlow(mode: OfferType): AccessFlow {
  if (mode === "BYOK") {
    return {
      title: "前往工作台绑定凭证",
      description: "该供给使用你的供应商账户，不经过 Moyusi 充值。",
      status: "外部结算",
      note: "Secret 只在本地授权；工作环境仅保存引用和作用域。",
      action: "前往工作台绑定",
      targetSection: "sources",
      actionKind: "credential",
    };
  }

  if (mode === "自有端点") {
    return {
      title: "前往工作台连接端点",
      description: "接入已有的兼容端点，不经过 Moyusi 支付。",
      status: "无需充值",
      note: "连接后先完成协议、模型身份和健康探测，再允许加入活动路由。",
      action: "前往工作台连接",
      targetSection: "deployments",
      actionKind: "endpoint",
    };
  }

  if (mode === "专属算力") {
    return {
      title: "先确认算力预算",
      description: "专属部署创建后会产生持续成本，需要单独确认。",
      status: "需要预算确认",
      note: "下一步展示最低持续成本、预计月成本、启动时间和自动休眠规则。",
      action: "前往工作台确认",
      targetSection: "deployments",
      actionKind: "budget",
    };
  }

  return {
    title: "确认统一余额计费",
    description: "配置本身不扣费，首次调用后才按实际用量结算。",
    status: "余额可用 · ¥ 86.40",
    note: "余额不足时先进入充值页；充值完成后返回当前模型与供给，不丢失选择。",
    action: "加入工作台",
    targetSection: "routing",
    actionKind: "route",
  };
}

export function sourceActionLabel(mode: OfferType): string {
  if (mode === "BYOK") return "绑定凭证";
  if (mode === "专属算力") return "确认预算";
  if (mode === "自有端点") return "连接端点";
  return "选择供给";
}
