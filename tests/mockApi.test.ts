import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "../src/domain/demoPlatform";
import { getCatalogModel, getCatalogSnapshot, getPlatformModelGraph, getPlatformSnapshot, getWorkspaceSummary, listCatalogModels } from "../src/services/mockApi";

describe("typed mock API boundary", () => {
  it("returns catalog data with a source and timestamp", async () => {
    const result = await listCatalogModels({ modality: "图片", kind: "开放权重" });
    expect(result.source).toBe("mock");
    expect(Number.isNaN(Date.parse(result.receivedAt))).toBe(false);
    expect(result.data.every((offer) => offer.modality === "图片" && offer.kind === "开放权重")).toBe(true);
  });

  it("returns a workbench summary from platform state", async () => {
    const result = await getWorkspaceSummary(createInitialDemoState());
    expect(result.data).toMatchObject({ activeModel: "GPT · Coding", activeSource: "Moyusi 稳定线路", routeStatus: "ready" });
  });

  it("keeps detail reads on the same catalog API boundary", async () => {
    const result = await getCatalogModel("gpt-coding");
    expect(result.data?.name).toBe("GPT · Coding");
    expect(await getCatalogModel("missing-model")).toMatchObject({ data: null, source: "mock" });
  });

  it("exposes normalized platform graph and snapshot through the API boundary", async () => {
    const graph = await getPlatformModelGraph("claude-sonnet");
    const snapshot = await getPlatformSnapshot();

    expect(graph.data?.routeOffers[0]?.priceVersionId).toBe(graph.data?.prices[0]?.id);
    expect(snapshot.data.graphCount).toBeGreaterThan(0);
    expect(graph.source).toBe("mock");
  });

  it("exposes a versioned catalog snapshot through the API boundary", async () => {
    const result = await getCatalogSnapshot();

    expect(result.source).toBe("mock");
    expect(result.data.version.status).toBe("published");
    expect(result.data.version.freshProbeCount).toBeGreaterThan(0);
    expect(result.data.graphs.length).toBe(result.data.version.modelCount);
  });
});
