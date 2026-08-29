import { buildModelGraph, type PlatformModelGraph, type PlatformSnapshot } from "../domain/platform";
import { catalogRepository } from "./catalogRepository";

export const platformRepository = {
  getModelGraph(modelId: string): PlatformModelGraph | null {
    const offer = catalogRepository.getById(modelId);
    return offer ? buildModelGraph(offer) : null;
  },

  snapshot(): PlatformSnapshot {
    const offers = catalogRepository.list();
    const graphs = offers.map(buildModelGraph);
    const models = graphs.map((graph) => graph.model);
    const providers = new Set(graphs.flatMap((graph) => graph.providers.map((provider) => provider.id)));
    return {
      catalogVersion: "demo-2026-08-29",
      models,
      providerCount: providers.size,
      routeOfferCount: graphs.reduce((count, graph) => count + graph.routeOffers.length, 0),
      graphCount: graphs.length,
    };
  },
};
