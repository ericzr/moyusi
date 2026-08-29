import { summarizeBilling, type BillingSummary, type DemoPlatformState } from "./demoPlatform";
import type { ProviderMode, ProviderSource } from "./provider";

export type ProjectIdentity = {
  id: string;
  name: string;
  ownerScope: "personal";
};

export type SourceEntitlement = {
  sourceId: string;
  mode: ProviderMode;
  settlement: "moyusi" | "external" | "compute";
  status: "active" | "needs-auth" | "offline" | "draft";
  modelCount: number;
};

export type ApiCredentialSummary = {
  id: string;
  prefix: string;
  status: "active" | "revoked";
  scopes: string[];
  secretStored: true;
};

export type DesktopDeviceSummary = {
  id: string;
  name: string;
  status: DemoPlatformState["desktop"]["status"];
  localRouter: DemoPlatformState["desktop"]["localRouter"];
  clientVersion?: string;
};

export type WorkspaceAssetSummary = {
  mcp: number;
  skills: number;
  prompts: number;
  memoryAndKnowledge: number;
};

export type ControlPlaneSnapshot = {
  project: ProjectIdentity;
  catalogVersion: string;
  entitlements: SourceEntitlement[];
  credentials: ApiCredentialSummary[];
  devices: DesktopDeviceSummary[];
  billing: BillingSummary;
  assets: WorkspaceAssetSummary;
};

export function buildControlPlaneSnapshot(
  state: DemoPlatformState,
  sources: readonly ProviderSource[],
  catalogVersion: string,
): ControlPlaneSnapshot {
  return {
    project: { id: "project_default", name: "个人空间", ownerScope: "personal" },
    catalogVersion,
    entitlements: sources.map((source) => ({
      sourceId: source.id,
      mode: source.mode,
      settlement: settlementFor(source.mode),
      status: source.status,
      modelCount: source.modelCount,
    })),
    credentials: [{
      id: "cred_moyusi_default",
      prefix: "moy_••••••••92F1",
      status: "active",
      scopes: ["models:read", "responses:create"],
      secretStored: true,
    }],
    devices: [{
      id: "device_current",
      name: state.desktop.name,
      status: state.desktop.status,
      localRouter: state.desktop.localRouter,
      clientVersion: state.desktop.version,
    }],
    billing: summarizeBilling(state),
    assets: { mcp: 4, skills: 6, prompts: 3, memoryAndKnowledge: 20 },
  };
}

function settlementFor(mode: ProviderMode): SourceEntitlement["settlement"] {
  if (mode === "moyusi") return "moyusi";
  if (mode === "endpoint") return "compute";
  return "external";
}
