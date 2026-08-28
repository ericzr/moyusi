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

  it("does not mutate its input collection", () => {
    const sample = catalogRepository.list().slice(0, 2);
    expect(filterCatalog(sample, { query: "___missing___" })).toEqual([]);
    expect(sample).toHaveLength(2);
  });
});
