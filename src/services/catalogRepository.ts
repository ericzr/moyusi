import type { CatalogFilter, CatalogSelection, ModelOffer } from "../domain/catalog";
import { MODEL_OFFERS } from "../features/catalog/catalogData";

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
    const searchable = [offer.name, offer.modelId, offer.family, offer.summary, ...offer.tags]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    const matchesQuery = !normalized || searchable.includes(normalized);
    return matchesModality && matchesKind && matchesTags && matchesOfferTypes && matchesRegions && matchesLatency && matchesContext && matchesProtocol && matchesQuery;
  });

  return [...filtered].sort((left, right) => {
    if (filter.sort === "price") return (left.priceCny ?? Number.POSITIVE_INFINITY) - (right.priceCny ?? Number.POSITIVE_INFINITY);
    if (filter.sort === "latency") return (left.latencySeconds ?? Number.POSITIVE_INFINITY) - (right.latencySeconds ?? Number.POSITIVE_INFINITY);
    if (filter.sort === "context") return (right.contextWindow ?? 0) - (left.contextWindow ?? 0);
    return 0;
  });
}

export const catalogRepository = {
  list(filter: CatalogFilter = {}): ModelOffer[] {
    return filterCatalog(MODEL_OFFERS, filter);
  },

  getById(modelId: string): ModelOffer | null {
    return MODEL_OFFERS.find((offer) => offer.id === modelId) ?? null;
  },

  resolveSelection(modelId: string | null, sourceName: string | null): CatalogSelection | null {
    if (!modelId || !sourceName) return null;
    const offer = this.getById(modelId);
    const source = offer?.sources.find((candidate) => candidate.name === sourceName);
    return offer && source ? { offer, source } : null;
  },
};
