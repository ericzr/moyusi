export type ProviderMode = "moyusi" | "byok" | "direct" | "endpoint";
export type ProviderStatus = "active" | "needs-auth" | "offline" | "draft";

export type ProviderSource = {
  id: string;
  name: string;
  vendor: string;
  mode: ProviderMode;
  status: ProviderStatus;
  protocol: string;
  health: string;
  modelCount: number;
  note: string;
  credentialHint?: string;
};

export type ProviderProfile = {
  id: string;
  tool: "Codex" | "Claude Code" | "Gemini CLI";
  sourceId: string;
  model: string;
  enabled: boolean;
  updatedAt: string;
};

export type RouteProfile = {
  id: string;
  profileId: string;
  modelId: string;
  sourceIds: string[];
  strategy: "auto" | "fixed" | "cost";
  preferredRegion: "中国" | "亚太" | "全球";
  enabled: boolean;
  updatedAt: string;
};

export const DEMO_PROVIDER_SOURCES: readonly ProviderSource[] = [
  { id: "moyusi-stable", name: "Moyusi 稳定线路", vendor: "Moyusi", mode: "moyusi", status: "active", protocol: "Responses / Chat", health: "99.95%", modelCount: 12, note: "统一余额 · 亚太与全球入口" },
  { id: "openrouter", name: "OpenRouter", vendor: "OpenRouter", mode: "byok", status: "needs-auth", protocol: "OpenAI-compatible", health: "待授权", modelCount: 300, note: "使用你的账号结算", credentialHint: "本机安全存储" },
  { id: "anthropic-official", name: "Anthropic Official", vendor: "Anthropic", mode: "direct", status: "needs-auth", protocol: "Anthropic Messages", health: "待授权", modelCount: 8, note: "官方账号直连", credentialHint: "OAuth / API Key" },
  { id: "qwen-cluster", name: "Qwen 共享 GPU 集群", vendor: "Moyusi Compute", mode: "endpoint", status: "active", protocol: "OpenAI-compatible", health: "99.76%", modelCount: 6, note: "开放权重 · FP8 · 新加坡" },
];

export const DEMO_PROVIDER_PROFILES: readonly ProviderProfile[] = [
  { id: "profile-codex", tool: "Codex", sourceId: "moyusi-stable", model: "GPT · Coding", enabled: true, updatedAt: "刚刚" },
  { id: "profile-claude", tool: "Claude Code", sourceId: "moyusi-stable", model: "Claude Sonnet", enabled: true, updatedAt: "今天 12:40" },
  { id: "profile-gemini", tool: "Gemini CLI", sourceId: "openrouter", model: "Gemini Flash", enabled: false, updatedAt: "昨天" },
];

export const DEMO_ROUTE_PROFILES: readonly RouteProfile[] = [
  { id: "route-codex", profileId: "profile-codex", modelId: "gpt-coding", sourceIds: ["moyusi-stable", "openrouter"], strategy: "auto", preferredRegion: "亚太", enabled: true, updatedAt: "刚刚" },
  { id: "route-claude", profileId: "profile-claude", modelId: "claude-sonnet", sourceIds: ["moyusi-stable", "anthropic-official"], strategy: "auto", preferredRegion: "亚太", enabled: true, updatedAt: "今天 12:40" },
  { id: "route-gemini", profileId: "profile-gemini", modelId: "gemini-flash", sourceIds: ["openrouter", "moyusi-stable"], strategy: "fixed", preferredRegion: "全球", enabled: false, updatedAt: "昨天" },
];

export function providerModeLabel(mode: ProviderMode): string {
  return mode === "moyusi" ? "统一余额" : mode === "byok" ? "BYOK" : mode === "direct" ? "供应商直连" : "自有端点";
}

export function providerStatusLabel(status: ProviderStatus): string {
  return status === "active" ? "可用" : status === "needs-auth" ? "待授权" : status === "offline" ? "暂不可用" : "未完成";
}

export function providerStatusTone(status: ProviderStatus): "ok" | "warn" | "muted" {
  return status === "active" ? "ok" : status === "needs-auth" ? "warn" : "muted";
}
