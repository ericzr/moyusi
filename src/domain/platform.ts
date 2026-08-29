import type { CatalogBilling, ModelKind, ModelModality, ModelOffer, ModelRegion, OfferType } from "./catalog";

export type EntityLifecycle = "draft" | "published" | "deprecated" | "offline";
export type ProviderKind = "managed" | "external" | "compute" | "byok";
export type EvidenceStatus = "fresh" | "stale" | "unknown";

export type ModelIdentity = {
  id: string;
  slug: string;
  displayName: string;
  family: string;
  modality: ModelModality;
  kind: ModelKind;
  lifecycle: EntityLifecycle;
};

export type ModelVersion = {
  id: string;
  modelId: string;
  label: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  knowledgeCutoff?: string;
  license?: string;
};

export type ProviderIdentity = {
  id: string;
  name: string;
  vendor: string;
  kind: ProviderKind;
  regions: ModelRegion[];
  dataPolicy: string;
};

export type PriceVersion = {
  id: string;
  routeOfferId: string;
  currency: "CNY";
  billing: CatalogBilling;
  input?: string;
  output?: string;
  cache?: string;
  unit: string;
  validFrom: string;
  validTo?: string;
};

export type ProbeWindow = {
  id: string;
  routeOfferId: string;
  region: ModelRegion;
  status: EvidenceStatus;
  latencyP50?: string;
  latencyP95?: string;
  throughput?: string;
  successRate?: string;
  sampleCount?: number;
  checkedAt?: string;
};

export type RouteOffer = {
  id: string;
  modelId: string;
  modelVersionId: string;
  providerId: string;
  sourceId: string;
  supplyMode: OfferType;
  endpointTypes: string[];
  regions: ModelRegion[];
  dataRetention: string;
  lifecycle: EntityLifecycle;
  priceVersionId: string;
  probeWindowId: string;
};

export type PlatformModelGraph = {
  model: ModelIdentity;
  version: ModelVersion;
  providers: ProviderIdentity[];
  routeOffers: RouteOffer[];
  prices: PriceVersion[];
  probes: ProbeWindow[];
};

export type PlatformSnapshot = {
  catalogVersion: string;
  models: ModelIdentity[];
  providerCount: number;
  routeOfferCount: number;
  graphCount: number;
};

export function buildModelGraph(offer: ModelOffer): PlatformModelGraph {
  const model: ModelIdentity = {
    id: offer.id,
    slug: offer.modelId,
    displayName: offer.name,
    family: offer.family,
    modality: offer.modality,
    kind: offer.kind,
    lifecycle: "published",
  };
  const version: ModelVersion = {
    id: `${offer.id}:published`,
    modelId: offer.id,
    label: offer.modelId,
    contextWindow: offer.contextWindow,
    maxOutputTokens: offer.maxOutputTokens,
    knowledgeCutoff: offer.knowledgeCutoff,
    license: offer.license,
  };
  const providers: ProviderIdentity[] = [];
  const routeOffers: RouteOffer[] = [];
  const prices: PriceVersion[] = [];
  const probes: ProbeWindow[] = [];

  offer.sources.forEach((source, index) => {
    const sourceId = `${stableId(source.name)}-${index + 1}`;
    const providerId = `${offer.id}:provider:${sourceId}`;
    const routeOfferId = `${offer.id}:route:${sourceId}`;
    const priceVersionId = `${routeOfferId}:price:current`;
    const probeWindowId = `${routeOfferId}:probe:latest`;
    const region = source.region ?? offer.regions[index % Math.max(offer.regions.length, 1)] ?? "全球";
    const measured = source.mode !== "BYOK" && source.mode !== "自有端点"
      && Boolean(source.sampleCount || source.successRate || source.latencyP50 || source.latencyP95);

    providers.push({
      id: providerId,
      name: source.name,
      vendor: providerVendor(source.mode),
      kind: providerKind(source.mode),
      regions: [region],
      dataPolicy: source.dataPolicy ?? (source.mode === "BYOK" ? "由供应商决定" : offer.dataRetention ?? "以来源政策为准"),
    });
    routeOffers.push({
      id: routeOfferId,
      modelId: offer.id,
      modelVersionId: version.id,
      providerId,
      sourceId,
      supplyMode: source.mode,
      endpointTypes: offer.endpointTypes ?? offer.protocols,
      regions: [region],
      dataRetention: source.dataPolicy ?? offer.dataRetention ?? "以来源政策为准",
      lifecycle: source.health.includes("待") ? "draft" : "published",
      priceVersionId,
      probeWindowId,
    });
    prices.push({
      id: priceVersionId,
      routeOfferId,
      currency: "CNY",
      billing: offer.pricing?.billing ?? (offer.modality === "视频" ? "按请求" : "按量计费"),
      input: offer.pricing?.input,
      output: offer.pricing?.output,
      cache: offer.pricing?.cache,
      unit: offer.pricing?.unit ?? offer.unit,
      validFrom: "2026-08-01T00:00:00.000Z",
    });
    probes.push({
      id: probeWindowId,
      routeOfferId,
      region,
      status: measured ? "fresh" : source.health.includes("待") ? "unknown" : source.mode === "BYOK" || source.mode === "自有端点" ? "unknown" : "stale",
      latencyP50: measured ? source.latencyP50 : undefined,
      latencyP95: measured ? source.latencyP95 : undefined,
      throughput: source.throughput,
      successRate: source.successRate ?? (source.health.endsWith("%") ? source.health : undefined),
      sampleCount: source.sampleCount,
      checkedAt: source.checkedAt,
    });
  });

  return { model, version, providers, routeOffers, prices, probes };
}

function stableId(value: string): string {
  return value.toLocaleLowerCase("en-US").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "source";
}

function providerKind(mode: OfferType): ProviderKind {
  if (mode === "统一余额") return "managed";
  if (mode === "BYOK") return "byok";
  if (mode === "共享算力" || mode === "专属算力") return "compute";
  return "external";
}

function providerVendor(mode: OfferType): string {
  if (mode === "统一余额") return "Moyusi";
  if (mode === "BYOK") return "用户账号";
  if (mode === "共享算力" || mode === "专属算力") return "Moyusi Compute";
  return "用户端点";
}
