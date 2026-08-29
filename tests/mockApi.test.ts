import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "../src/domain/demoPlatform";
import { getCatalogModel, getWorkspaceSummary, listCatalogModels } from "../src/services/mockApi";

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
});
