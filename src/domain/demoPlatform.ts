import type { CatalogSelection, ModelKind, ModelModality, OfferType } from "./catalog";

export type RouteStrategy = "auto" | "fixed" | "cost";

export type ActiveRoute = {
  modelId: string;
  modelName: string;
  modelKind: ModelKind;
  modality: ModelModality;
  sourceName: string;
  sourceMode: OfferType;
  price: string;
  latency: string;
  health: string;
  activatedAt: string;
};

export type UsageEvent = {
  id: string;
  createdAt: string;
  modelId: string;
  modelName: string;
  sourceName: string;
  sourceMode: OfferType;
  usage: string;
  latency: string;
  costCny: number;
  costLabel: string;
  billingScope: "moyusi" | "external" | "included";
};

export type DemoPlatformState = {
  version: 1;
  activeRoute: ActiveRoute;
  previousRoute: ActiveRoute | null;
  usageEvents: UsageEvent[];
  routeStrategy: RouteStrategy;
  connectedTools: string[];
};

export type WorkspaceSummary = {
  routeStatus: "ready" | "degraded";
  activeModel: string;
  activeSource: string;
  activeTools: string[];
  pendingAttention: number;
};

export type BillingSummary = {
  availableBalanceCny: number;
  periodCostCny: number;
  externalEstimateCny: number;
  requestCount: number;
};

export function createInitialDemoState(): DemoPlatformState {
  return {
    version: 1,
    activeRoute: {
      modelId: "gpt-coding",
      modelName: "GPT · Coding",
      modelKind: "闭源 API",
      modality: "语言",
      sourceName: "Moyusi 稳定线路",
      sourceMode: "统一余额",
      price: "¥ 8.20 / M",
      latency: "2.3s",
      health: "99.95%",
      activatedAt: "2026-08-26T10:00:00.000Z",
    },
    previousRoute: null,
    usageEvents: [],
    routeStrategy: "auto",
    connectedTools: ["Codex", "Claude Code"],
  };
}

export function setRouteStrategy(state: DemoPlatformState, strategy: RouteStrategy): DemoPlatformState {
  return state.routeStrategy === strategy ? state : { ...state, routeStrategy: strategy };
}

export function summarizeWorkspace(state: DemoPlatformState): WorkspaceSummary {
  return {
    routeStatus: state.activeRoute.health === "待探测" ? "degraded" : "ready",
    activeModel: state.activeRoute.modelName,
    activeSource: state.activeRoute.sourceName,
    activeTools: state.connectedTools,
    pendingAttention: state.connectedTools.length ? 2 : 3,
  };
}

export function activateSelection(state: DemoPlatformState, selection: CatalogSelection, activatedAt: string): DemoPlatformState {
  const nextRoute: ActiveRoute = {
    modelId: selection.offer.id,
    modelName: selection.offer.name,
    modelKind: selection.offer.kind,
    modality: selection.offer.modality,
    sourceName: selection.source.name,
    sourceMode: selection.source.mode,
    price: selection.source.price,
    latency: selection.source.latency,
    health: selection.source.health,
    activatedAt,
  };

  const unchanged = state.activeRoute.modelId === nextRoute.modelId && state.activeRoute.sourceName === nextRoute.sourceName;
  return unchanged ? state : { ...state, activeRoute: nextRoute, previousRoute: state.activeRoute };
}

export function restorePreviousRoute(state: DemoPlatformState): DemoPlatformState {
  if (!state.previousRoute) return state;
  return { ...state, activeRoute: state.previousRoute, previousRoute: state.activeRoute };
}

export function recordMockUsage(state: DemoPlatformState, createdAt: string): { state: DemoPlatformState; event: UsageEvent } {
  const pricing = mockPricing(state.activeRoute);
  const timestamp = Date.parse(createdAt);
  const event: UsageEvent = {
    id: `req_demo_${Number.isFinite(timestamp) ? timestamp.toString(36).slice(-6).toUpperCase() : "LOCAL"}`,
    createdAt,
    modelId: state.activeRoute.modelId,
    modelName: state.activeRoute.modelName,
    sourceName: state.activeRoute.sourceName,
    sourceMode: state.activeRoute.sourceMode,
    usage: state.activeRoute.modality === "语言" ? "12.8K" : state.activeRoute.modality === "图片" ? "1 张" : "5 秒",
    latency: state.activeRoute.latency,
    ...pricing,
  };

  return {
    event,
    state: { ...state, usageEvents: [event, ...state.usageEvents].slice(0, 20) },
  };
}

export function summarizeBilling(state: DemoPlatformState): BillingSummary {
  const moyusiCost = state.usageEvents.filter((event) => event.billingScope === "moyusi").reduce((sum, event) => sum + event.costCny, 0);
  const externalCost = state.usageEvents.filter((event) => event.billingScope === "external").reduce((sum, event) => sum + event.costCny, 0);
  return {
    availableBalanceCny: Math.max(0, 80 - moyusiCost),
    periodCostCny: 28.4 + moyusiCost,
    externalEstimateCny: 6.2 + externalCost,
    requestCount: 184 + state.usageEvents.length,
  };
}

export function isDemoPlatformState(value: unknown): value is DemoPlatformState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DemoPlatformState>;
  return candidate.version === 1 && Boolean(candidate.activeRoute?.modelId) && Array.isArray(candidate.usageEvents);
}

function mockPricing(route: ActiveRoute): Pick<UsageEvent, "costCny" | "costLabel" | "billingScope"> {
  if (route.sourceMode === "BYOK" || route.sourceMode === "自有端点") {
    return { costCny: 0.04, costLabel: "估算 ¥ 0.04", billingScope: "external" };
  }
  if (route.sourceMode === "专属算力") {
    return { costCny: 0, costLabel: "已含算力费", billingScope: "included" };
  }
  const costCny = route.modality === "语言" ? (route.sourceMode === "共享算力" ? 0.07 : 0.18) : route.modality === "图片" ? 0.28 : 2.6;
  return { costCny, costLabel: `¥ ${costCny.toFixed(2)}`, billingScope: "moyusi" };
}
