import { describe, expect, it } from "vitest";
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

  it("sorts by normalized measurements without mutating its input", () => {
    const languageOffers = catalogRepository.list({ modality: "语言" });
    const priceSorted = filterCatalog(languageOffers, { sort: "price" });
    const contextSorted = filterCatalog(languageOffers, { sort: "context" });

    expect(priceSorted[0]?.id).toBe("qwen-coder-open");
    expect(contextSorted[0]?.id).toBe("gemini-flash");
    expect(languageOffers[0]?.id).toBe("claude-sonnet");
  });

  it("does not mutate its input collection", () => {
    const sample = catalogRepository.list().slice(0, 2);
    expect(filterCatalog(sample, { query: "___missing___" })).toEqual([]);
    expect(sample).toHaveLength(2);
  });
});
