export type ModelModality = "语言" | "图片" | "视频";
export type ModelKind = "闭源 API" | "开放权重";
export type OfferType = "统一余额" | "BYOK" | "共享算力" | "专属算力" | "自有端点";
export type ModelRegion = "中国" | "亚太" | "全球";
export type ModelProtocol = "OpenAI" | "Anthropic" | "Google";
export type CatalogSort = "recommended" | "capability" | "price" | "latency" | "context";
export type CatalogBilling = "按量计费" | "按请求";

export type CatalogPricing = {
  billing: CatalogBilling;
  input?: string;
  output?: string;
  cache?: string;
  unit: string;
};

export type CatalogPerformance = {
  latency: string;
  throughput?: string;
  successRate?: string;
  checkedAt?: string;
};

export type ModelVariant = {
  id: string;
  label: string;
  parameterCount?: string;
  quantization?: string;
  framework?: string;
  memory?: string;
  license?: string;
};

export type SupplyCategory = "api" | "account" | "compute" | "endpoint";

export type ComputeProfile = {
  provider: string;
  framework?: string;
  quantization?: string;
  memory?: string;
  coldStart?: string;
  region?: ModelRegion;
};

export type SupplyOption = {
  name: string;
  mode: OfferType;
  category?: SupplyCategory;
  provider?: string;
  variantId?: string;
  compute?: ComputeProfile;
  price: string;
  latency: string;
  health: string;
  note: string;
  recommended?: boolean;
  throughput?: string;
  successRate?: string;
  checkedAt?: string;
  region?: ModelRegion;
  dataPolicy?: string;
  sampleCount?: number;
  latencyP50?: string;
  latencyP95?: string;
};

export type ModelOffer = {
  id: string;
  /** Stable identity shared by API and deployment variants of the same model. */
  canonicalId?: string;
  name: string;
  modelId: string;
  family: string;
  summary: string;
  modality: ModelModality;
  kind: ModelKind;
  offerType: OfferType;
  tags: string[];
  specLabel: string;
  specValue: string;
  protocol: string;
  protocols: ModelProtocol[];
  groups?: string[];
  capabilities?: string[];
  endpointTypes?: string[];
  maxOutputTokens?: number;
  knowledgeCutoff?: string;
  releasedAt?: string;
  license?: string;
  dataRetention?: string;
  pricing?: CatalogPricing;
  performance?: CatalogPerformance;
  /** Normalized fields used only for catalog comparisons; displayed pricing remains source-specific. */
  priceCny?: number;
  latencySeconds?: number;
  contextWindow?: number;
  regions: ModelRegion[];
  price: string;
  unit: string;
  latency: string;
  route: string;
  health: string;
  meta: string;
  sources: SupplyOption[];
  variants?: ModelVariant[];
};

export type CatalogFilter = {
  modality?: ModelModality;
  kind?: ModelKind;
  query?: string;
  tags?: string[];
  offerTypes?: OfferType[];
  regions?: ModelRegion[];
  maxLatencySeconds?: number;
  minContextWindow?: number;
  protocol?: ModelProtocol;
  providers?: string[];
  billingTypes?: CatalogBilling[];
  sort?: CatalogSort;
};

export type CatalogSelection = {
  offer: ModelOffer;
  source: SupplyOption;
};
