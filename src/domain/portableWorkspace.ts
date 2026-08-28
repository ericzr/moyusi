export const BYOK_PROVIDERS = ["Google AI", "OpenRouter", "Anthropic", "OpenAI"] as const;

export type ByokProvider = (typeof BYOK_PROVIDERS)[number];
export type ConnectionState = "bound" | "needs_auth";
export type MigrationTarget = "Codex" | "Claude Code";
export type MigrationOutcome = "exact" | "adapted" | "rebuilt" | "needs_confirm";

export type ByokConnection = {
  id: string;
  provider: ByokProvider;
  state: ConnectionState;
  scope: string;
  connectedAt?: string;
};

export type ImportGrant = {
  id: string;
  provider: ByokProvider;
  issuedAt: string;
  expiresAt: string;
  state: "issued" | "claimed" | "expired";
};

export type MigrationItem = {
  name: string;
  outcome: MigrationOutcome;
  detail: string;
};

export type MigrationReport = {
  target: MigrationTarget;
  createdAt: string;
  appliedAt?: string;
  state: "preview" | "applied";
  items: MigrationItem[];
};

export type PortableWorkspaceState = {
  version: 1;
  connections: ByokConnection[];
  grants: ImportGrant[];
  latestMigration: MigrationReport | null;
};

export function createInitialPortableWorkspaceState(): PortableWorkspaceState {
  return {
    version: 1,
    connections: [
      { id: "connection_google-ai", provider: "Google AI", state: "bound", scope: "模型调用 · 外部结算", connectedAt: "2026-08-26T10:00:00.000Z" },
      { id: "connection_openrouter", provider: "OpenRouter", state: "needs_auth", scope: "等待本机授权" },
    ],
    grants: [],
    latestMigration: null,
  };
}

export function issueImportGrant(state: PortableWorkspaceState, provider: ByokProvider, issuedAt: string): { state: PortableWorkspaceState; grant: ImportGrant } {
  const issuedAtTimestamp = Date.parse(issuedAt);
  const expiresAt = new Date((Number.isFinite(issuedAtTimestamp) ? issuedAtTimestamp : 0) + 10 * 60 * 1000).toISOString();
  const grant: ImportGrant = {
    id: `grant_${provider.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "_")}_${idFragment(issuedAt)}`,
    provider,
    issuedAt,
    expiresAt,
    state: "issued",
  };

  return { state: { ...state, grants: [grant, ...state.grants].slice(0, 8) }, grant };
}

export function claimImportGrant(state: PortableWorkspaceState, grantId: string, claimedAt: string): { state: PortableWorkspaceState; connection: ByokConnection | null } | null {
  const grant = state.grants.find((candidate) => candidate.id === grantId);
  if (!grant || grant.state !== "issued") return null;

  if (Date.parse(claimedAt) > Date.parse(grant.expiresAt)) {
    return {
      state: { ...state, grants: state.grants.map((candidate) => candidate.id === grantId ? { ...candidate, state: "expired" } : candidate) },
      connection: null,
    };
  }

  const connection: ByokConnection = {
    id: `connection_${grant.provider.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "_")}`,
    provider: grant.provider,
    state: "bound",
    scope: "模型调用 · 外部结算",
    connectedAt: claimedAt,
  };
  const hadConnection = state.connections.some((candidate) => candidate.provider === grant.provider);

  return {
    connection,
    state: {
      ...state,
      grants: state.grants.map((candidate) => candidate.id === grantId ? { ...candidate, state: "claimed" } : candidate),
      connections: hadConnection
        ? state.connections.map((candidate) => candidate.provider === grant.provider ? connection : candidate)
        : [...state.connections, connection],
    },
  };
}

export function createMigrationPreview(state: PortableWorkspaceState, target: MigrationTarget, createdAt: string): PortableWorkspaceState {
  return {
    ...state,
    latestMigration: {
      target,
      createdAt,
      state: "preview",
      items: migrationItemsFor(target),
    },
  };
}

export function applyMigrationPreview(state: PortableWorkspaceState, target: MigrationTarget, appliedAt: string): PortableWorkspaceState {
  const report = state.latestMigration;
  if (!report || report.target !== target || report.state !== "preview") return state;
  return { ...state, latestMigration: { ...report, state: "applied", appliedAt } };
}

export function isPortableWorkspaceState(value: unknown): value is PortableWorkspaceState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PortableWorkspaceState>;
  return candidate.version === 1 && Array.isArray(candidate.connections) && Array.isArray(candidate.grants);
}

function migrationItemsFor(target: MigrationTarget): MigrationItem[] {
  const mcpDetail = target === "Claude Code" ? "目标软件需要重新授权 repo scope" : "已保留服务器地址与非敏感参数";
  return [
    { name: "code-review Skill", outcome: "exact", detail: "内容摘要一致" },
    { name: "release Prompt", outcome: "adapted", detail: "指令层已转换为目标格式" },
    { name: "GitHub MCP", outcome: target === "Claude Code" ? "needs_confirm" : "adapted", detail: mcpDetail },
    { name: "会话检查点", outcome: "rebuilt", detail: "在新会话继续，不复制厂商运行时" },
  ];
}

function idFragment(timestamp: string): string {
  const value = Date.parse(timestamp);
  return Number.isFinite(value) ? value.toString(36).toUpperCase() : "LOCAL";
}
