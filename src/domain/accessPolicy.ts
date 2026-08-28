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
      description: "这个来源使用你已有的模型账号，Moyusi 不重复收费。",
      status: "外部结算",
      note: "密钥只保存在本机安全存储中；迁移 AI 配置时不会复制密钥。",
      action: "连接账号并使用",
      targetSection: "sources",
      actionKind: "credential",
    };
  }

  if (mode === "自有端点") {
    return {
      title: "前往工作台连接端点",
      description: "使用你已有的服务器，不经过 Moyusi 支付。",
      status: "无需充值",
      note: "连接后会自动检查模型、速度和可用性，通过后即可切换。",
      action: "连接服务器并使用",
      targetSection: "deployments",
      actionKind: "endpoint",
    };
  }

  if (mode === "专属算力") {
    return {
      title: "先确认专属算力费用",
      description: "专属服务器创建后会持续计费，需要在开通前确认。",
      status: "需要预算确认",
      note: "下一步会清楚展示最低费用、预计月费用、启动时间和自动休眠规则。",
      action: "查看费用并开通",
      targetSection: "deployments",
      actionKind: "budget",
    };
  }

  return {
    title: "一键切换到这个来源",
    description: "切换本身不收费，开始使用后才按实际用量从 Moyusi 余额扣费。",
    status: "余额可用 · ¥ 86.40",
    note: "如果余额不足，会先引导充值；完成后自动回到这里，不会丢失选择。",
    action: "一键切换",
    targetSection: "routing",
    actionKind: "route",
  };
}

export function sourceActionLabel(mode: OfferType): string {
  if (mode === "BYOK") return "连接并使用";
  if (mode === "专属算力") return "查看费用";
  if (mode === "自有端点") return "连接并使用";
  return "一键切换";
}
