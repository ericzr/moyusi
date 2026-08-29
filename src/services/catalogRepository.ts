import type { CatalogFilter, CatalogSelection, ModelOffer } from "../domain/catalog";
import { CATALOG_OFFERS } from "../features/catalog/catalogData";

export function filterCatalog(offers: readonly ModelOffer[], filter: CatalogFilter = {}): ModelOffer[] {
  const normalized = filter.query?.trim().toLocaleLowerCase("zh-CN") ?? "";

  const filtered = offers.filter((offer) => {
    const matchesModality = !filter.modality || offer.modality === filter.modality;
    const matchesKind = !filter.kind || offer.kind === filter.kind;
    const matchesTags = !filter.tags?.length || filter.tags.every((tag) => offer.tags.includes(tag));
    const matchesOfferTypes = !filter.offerTypes?.length || filter.offerTypes.some((type) => offer.sources.some((source) => source.mode === type));
    const matchesRegions = !filter.regions?.length || filter.regions.some((region) => offer.regions.includes(region));
    const matchesLatency = !filter.maxLatencySeconds || (offer.latencySeconds !== undefined && offer.latencySeconds <= filter.maxLatencySeconds);
    const matchesContext = !filter.minContextWindow || (offer.contextWindow !== undefined && offer.contextWindow >= filter.minContextWindow);
    const matchesProtocol = !filter.protocol || offer.protocols.includes(filter.protocol);
    const matchesProvider = !filter.providers?.length || filter.providers.includes(offer.family);
    const matchesBilling = !filter.billingTypes?.length || filter.billingTypes.includes(offer.pricing?.billing ?? (offer.modality === "视频" ? "按请求" : "按量计费"));
    const searchable = [offer.name, offer.modelId, offer.family, offer.summary, ...offer.tags]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    const matchesQuery = !normalized || searchable.includes(normalized);
    return matchesModality && matchesKind && matchesTags && matchesOfferTypes && matchesRegions && matchesLatency && matchesContext && matchesProtocol && matchesProvider && matchesBilling && matchesQuery;
  });

  return [...filtered].sort((left, right) => {
    if (filter.sort === "capability") {
      // Capability ordering is intentionally explainable: verified capability
      // coverage first, then task tags and context capacity as a tie-breaker.
      const capabilityScore = (offer: ModelOffer) => new Set([...(offer.capabilities ?? []), ...offer.tags]).size * 10
        + offer.tags.length * 3
        + Math.min(offer.contextWindow ?? 0, 1_000_000) / 100_000;
      const leftScore = capabilityScore(left);
      const rightScore = capabilityScore(right);
      return rightScore - leftScore
        || (Number.parseFloat(right.performance?.successRate ?? "0") || 0) - (Number.parseFloat(left.performance?.successRate ?? "0") || 0);
    }
    if (filter.sort === "price") return (left.priceCny ?? Number.POSITIVE_INFINITY) - (right.priceCny ?? Number.POSITIVE_INFINITY);
    if (filter.sort === "latency") return (left.latencySeconds ?? Number.POSITIVE_INFINITY) - (right.latencySeconds ?? Number.POSITIVE_INFINITY);
    if (filter.sort === "context") return (right.contextWindow ?? 0) - (left.contextWindow ?? 0);
    return 0;
  });
}

export const catalogRepository = {
  list(filter: CatalogFilter = {}): ModelOffer[] {
    return filterCatalog(CATALOG_OFFERS, filter);
  },

  getById(modelId: string): ModelOffer | null {
    return CATALOG_OFFERS.find((offer) => offer.id === modelId) ?? null;
  },

  resolveSelection(modelId: string | null, sourceName: string | null): CatalogSelection | null {
    if (!modelId || !sourceName) return null;
    const offer = this.getById(modelId);
    const source = offer?.sources.find((candidate) => candidate.name === sourceName);
    return offer && source ? { offer, source } : null;
  },
};
