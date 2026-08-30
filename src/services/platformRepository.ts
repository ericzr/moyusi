import { buildCatalogSnapshot, buildModelGraph, type CatalogSnapshot, type PlatformModelGraph, type PlatformSnapshot } from "../domain/platform";
import { catalogRepository } from "./catalogRepository";

export const platformRepository = {
  getModelGraph(modelId: string): PlatformModelGraph | null {
    const offer = catalogRepository.getById(modelId);
    return offer ? buildModelGraph(offer) : null;
  },

  snapshot(): PlatformSnapshot {
    const offers = catalogRepository.list();
    const catalog = buildCatalogSnapshot(offers);
    const models = catalog.graphs.map((graph) => graph.model);
    const providers = new Set(catalog.graphs.flatMap((graph) => graph.providers.map((provider) => provider.id)));
    return {
      catalogVersion: catalog.version.id,
      catalogStatus: catalog.version.status,
      models,
      providerCount: providers.size,
      routeOfferCount: catalog.version.routeOfferCount,
      graphCount: catalog.version.modelCount,
    };
  },

  catalogSnapshot(): CatalogSnapshot {
    return buildCatalogSnapshot(catalogRepository.list());
  },
};
