import { describe, expect, it } from "vitest";
import { orderSupplySources } from "../src/features/catalog/ModelSquare";
import { catalogRepository, filterCatalog } from "../src/services/catalogRepository";

describe("catalog repository", () => {
  it("filters by modality before openness", () => {
    const results = catalogRepository.list({ modality: "图片", kind: "开放权重" });
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((offer) => offer.modality === "图片" && offer.kind === "开放权重")).toBe(true);
  });

  it("searches model identity, vendor, summary and tags", () => {
    expect(catalogRepository.list({ query: "Anthropic" }).map((offer) => offer.id)).toContain("claude-sonnet");
    expect(catalogRepository.list({ query: "中文编程" }).map((offer) => offer.id)).toContain("qwen-coder-open");
  });

  it("resolves only a valid model and supply pair", () => {
    const model = catalogRepository.getById("claude-sonnet");
    expect(model).not.toBeNull();
    expect(catalogRepository.resolveSelection("claude-sonnet", model!.sources[0].name)?.offer.id).toBe("claude-sonnet");
    expect(catalogRepository.resolveSelection("claude-sonnet", "不存在的来源")).toBeNull();
  });

  it("keeps every source directly comparable on price, latency and stability", () => {
    for (const offer of catalogRepository.list()) {
      expect(offer.latency).not.toBe("");
      for (const source of offer.sources) {
        expect(source.price).not.toBe("");
        expect(source.latency).not.toBe("");
        expect(source.health).not.toBe("");
      }
    }
  });

  it("filters against structured catalog facts instead of display copy", () => {
    const results = catalogRepository.list({
      modality: "语言",
      tags: ["代码"],
      offerTypes: ["统一余额"],
      regions: ["全球"],
      maxLatencySeconds: 3,
      minContextWindow: 200_000,
      protocol: "OpenAI",
    });

    expect(results.map((offer) => offer.id)).toEqual(expect.arrayContaining(["claude-sonnet", "gpt-coding"]));
    expect(results.every((offer) => offer.sources.some((source) => source.mode === "统一余额"))).toBe(true);
  });

  it("filters by provider and billing shape while keeping catalog evidence attached", () => {
    const results = catalogRepository.list({ providers: ["Anthropic"], billingTypes: ["按量计费"] });

    expect(results.map((offer) => offer.id)).toEqual(["claude-sonnet"]);
    expect(results[0]?.pricing?.input).toBe("¥ 12.00");
    expect(results[0]?.performance?.successRate).toBe("99.92%");
  });

  it("exposes detail-ready capability and API metadata", () => {
    const offer = catalogRepository.getById("claude-sonnet");
    expect(offer?.groups?.length).toBeGreaterThan(0);
    expect(offer?.capabilities).toEqual(expect.arrayContaining(["函数调用", "结构化输出"]));
    expect(offer?.maxOutputTokens).toBe(32_768);
    expect(offer?.dataRetention).toContain("不保存");
  });

  it("keeps performance evidence at the supply level", () => {
    const offer = catalogRepository.getById("claude-sonnet");
    const [primary, backup, byok] = offer?.sources ?? [];

    expect(primary?.throughput).toBe("61.1 t/s");
    expect(primary?.latencyP50).toBe("2.8s");
    expect(primary?.latencyP95).toBe("4.1s");
    expect(primary?.sampleCount).toBeGreaterThan(0);
    expect(primary?.dataPolicy).toContain("不保存");
    expect(backup?.throughput).not.toBe(primary?.throughput);
    expect(byok?.throughput).toBe("供应商直连");
    expect(byok?.sampleCount).toBeUndefined();
  });

  it("keeps model identity separate from supply and deployment metadata", () => {
    const openModel = catalogRepository.getById("qwen-coder-open");
    const closedModel = catalogRepository.getById("claude-sonnet");

    expect(openModel?.canonicalId).toBe("qwen-coder-open");
    expect(openModel?.variants?.length).toBeGreaterThan(0);
    expect(openModel?.sources.find((source) => source.mode === "共享算力")?.category).toBe("compute");
    expect(openModel?.sources.find((source) => source.mode === "共享算力")?.variantId).toBe("qwen-coder-open-standard");
    expect(openModel?.sources.find((source) => source.mode === "自有端点")?.category).toBe("endpoint");
    expect(closedModel?.sources.find((source) => source.mode === "BYOK")?.category).toBe("account");
    expect(closedModel?.sources.find((source) => source.mode === "统一余额")?.category).toBe("api");
  });

  it("does not present image output dimensions as language parameter counts", () => {
    const imageModel = catalogRepository.getById("flux-kontext");
    const languageModel = catalogRepository.getById("qwen-coder-open");

    expect(imageModel?.variants?.[0]?.parameterCount).toBeUndefined();
    expect(languageModel?.variants?.[0]?.parameterCount).toBeUndefined();
    expect(imageModel?.specLabel).toBe("输出规格");
    expect(imageModel?.specValue).toBe("最高 2K");
  });

  it("puts a verified official API before managed and user-owned suppliers", () => {
    const sources = [
      { name: "你的 API Key", mode: "BYOK" as const, price: "外部计费", latency: "直连", health: "直连", note: "用户账号" },
      { name: "Moyusi 稳定线路", mode: "统一余额" as const, price: "¥ 1 / M", latency: "2s", health: "99.9%", note: "平台线路" },
      { name: "官方渠道", provider: "OpenAI", official: true, mode: "统一余额" as const, price: "¥ 2 / M", latency: "2s", health: "99.9%", note: "官方 API" },
    ];

    expect(orderSupplySources(sources).map((source) => source.name)).toEqual(["官方渠道", "Moyusi 稳定线路", "你的 API Key"]);
  });

  it("sorts by normalized measurements without mutating its input", () => {
    const languageOffers = catalogRepository.list({ modality: "语言" });
    const priceSorted = filterCatalog(languageOffers, { sort: "price" });
    const capabilitySorted = filterCatalog(languageOffers, { sort: "capability" });
    const contextSorted = filterCatalog(languageOffers, { sort: "context" });

    expect(priceSorted[0]?.id).toBe("qwen-coder-open");
    expect(capabilitySorted[0]?.id).toBe("gemini-flash");
    expect(contextSorted[0]?.id).toBe("gemini-flash");
    expect(languageOffers[0]?.id).toBe("claude-sonnet");
  });

  it("does not mutate its input collection", () => {
    const sample = catalogRepository.list().slice(0, 2);
    expect(filterCatalog(sample, { query: "___missing___" })).toEqual([]);
    expect(sample).toHaveLength(2);
  });
});
