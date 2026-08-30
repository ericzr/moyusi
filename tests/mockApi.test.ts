import { describe, expect, it } from "vitest";
import { createInitialDemoState } from "../src/domain/demoPlatform";
import { appendGatewayAttempt, createGatewayRequest, finalizeGatewayUsage, getCatalogModel, getCatalogSnapshot, getPlatformModelGraph, getPlatformSnapshot, getWorkspaceSummary, settleGatewayRequest, listCatalogModels } from "../src/services/mockApi";

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

  it("keeps gateway request, usage and settlement on one typed API boundary", async () => {
    const request = await createGatewayRequest({
      id: "req_api_test",
      idempotencyKey: "idem_api_test",
      projectId: "project_default",
      credentialId: "cred_moyusi_default",
      requestedModel: "gpt-coding",
      protocol: "responses",
    });
    const attempted = await appendGatewayAttempt(request.data.request.id, {
      id: "attempt_api_test",
      modelId: "gpt-coding",
      routeOfferId: "gpt-coding:route:moyusi-stable-1",
      priceVersionId: "price_api_test",
      sourceId: "moyusi-stable",
    });
    const metered = await finalizeGatewayUsage(attempted.data.request.id, {
      id: "usage_api_test",
      attemptId: "attempt_api_test",
      sourceEventId: "moyusi:event_api_test",
      inputUnits: 120,
      outputUnits: 30,
      upstreamAmountMinor: 8,
    });
    const settled = await settleGatewayRequest(metered.data.request.id, {
      id: "settlement_api_test",
      customerAmountMinor: 12,
      billingScope: "moyusi",
    });

    expect(request.source).toBe("mock");
    expect(settled.data.settlement?.status).toBe("settled");
    expect(settled.data.settlement?.priceVersionId).toBe("price_api_test");
  });
});
