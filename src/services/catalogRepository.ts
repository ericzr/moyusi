import type { CatalogFilter, CatalogSelection, ModelOffer } from "../domain/catalog";
import { MODEL_OFFERS } from "../features/catalog/catalogData";

export function filterCatalog(offers: readonly ModelOffer[], filter: CatalogFilter = {}): ModelOffer[] {
  const normalized = filter.query?.trim().toLocaleLowerCase("zh-CN") ?? "";

  return offers.filter((offer) => {
    const matchesModality = !filter.modality || offer.modality === filter.modality;
    const matchesKind = !filter.kind || offer.kind === filter.kind;
    const searchable = [offer.name, offer.modelId, offer.family, offer.summary, ...offer.tags]
      .join(" ")
      .toLocaleLowerCase("zh-CN");
    const matchesQuery = !normalized || searchable.includes(normalized);
    return matchesModality && matchesKind && matchesQuery;
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
