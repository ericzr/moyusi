import {
  DEMO_PROVIDER_PROFILES,
  DEMO_PROVIDER_SOURCES,
  DEMO_ROUTE_PROFILES,
  type ProviderProfile,
  type ProviderSource,
  type RouteProfile,
} from "../domain/provider";

export type WorkspaceProviderSnapshot = {
  sources: ProviderSource[];
  profiles: ProviderProfile[];
  routes: RouteProfile[];
};

/**
 * Typed mock boundary for the future Control Plane API. The UI reads a
 * normalized Source → ProviderProfile → RouteProfile graph and never couples
 * directly to fixture constants.
 */
export const workspaceRepository = {
  listSources(): ProviderSource[] {
    return DEMO_PROVIDER_SOURCES.map((source) => ({ ...source }));
  },

  listProfiles(): ProviderProfile[] {
    return DEMO_PROVIDER_PROFILES.map((profile) => ({ ...profile }));
  },

  listRoutes(): RouteProfile[] {
    return DEMO_ROUTE_PROFILES.map((route) => ({ ...route, sourceIds: [...route.sourceIds] }));
  },

  snapshot(): WorkspaceProviderSnapshot {
    return { sources: this.listSources(), profiles: this.listProfiles(), routes: this.listRoutes() };
  },

  resolveRoute(routeId: string): { route: RouteProfile; profile: ProviderProfile; sources: ProviderSource[] } | null {
    const route = this.listRoutes().find((candidate) => candidate.id === routeId);
    if (!route) return null;
    const profile = this.listProfiles().find((candidate) => candidate.id === route.profileId);
    if (!profile) return null;
    const sourceMap = new Map(this.listSources().map((source) => [source.id, source]));
    const sources = route.sourceIds.flatMap((sourceId) => {
      const source = sourceMap.get(sourceId);
      return source ? [source] : [];
    });
    return { route, profile, sources };
  },
};
