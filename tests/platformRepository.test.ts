import { describe, expect, it } from "vitest";
import { platformRepository } from "../src/services/platformRepository";

describe("normalized platform architecture", () => {
  it("keeps model identity, version, route, price and probe boundaries separate", () => {
    const graph = platformRepository.getModelGraph("claude-sonnet");
    expect(graph).not.toBeNull();
    expect(graph?.model.id).toBe("claude-sonnet");
    expect(graph?.version.modelId).toBe(graph?.model.id);
    expect(graph?.routeOffers.length).toBe(graph?.prices.length);
    expect(graph?.routeOffers.length).toBe(graph?.probes.length);
    expect(graph?.routeOffers[0]?.priceVersionId).toBe(graph?.prices[0]?.id);
    expect(graph?.routeOffers[0]?.probeWindowId).toBe(graph?.probes[0]?.id);
  });

  it("retains source-specific evidence and distinguishes unmeasured BYOK", () => {
    const graph = platformRepository.getModelGraph("claude-sonnet")!;
    const managed = graph.probes[0];
    const byok = graph.probes.at(-1);

    expect(managed?.status).toBe("fresh");
    expect(managed?.latencyP50).toBe("2.8s");
    expect(managed?.sampleCount).toBeGreaterThan(0);
    expect(byok?.status).toBe("unknown");
    expect(byok?.sampleCount).toBeUndefined();
  });

  it("builds a catalog snapshot without exposing fixture implementation", () => {
    const snapshot = platformRepository.snapshot();
    expect(snapshot.catalogVersion).toBe("demo-2026-08-29");
    expect(snapshot.graphCount).toBe(snapshot.models.length);
    expect(snapshot.routeOfferCount).toBeGreaterThan(snapshot.graphCount);
    expect(snapshot.providerCount).toBe(snapshot.routeOfferCount);
  });
});
