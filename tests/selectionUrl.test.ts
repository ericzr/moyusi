import { describe, expect, it } from "vitest";
import { workspaceSelectionPath } from "../src/app/selectionUrl";
import { catalogRepository } from "../src/services/catalogRepository";

describe("workspace selection URL", () => {
  it("preserves the chosen unified-balance supply in a shareable routing URL", () => {
    const offer = catalogRepository.getById("claude-sonnet")!;
    const source = offer.sources.find((candidate) => candidate.mode === "统一余额")!;
    const path = workspaceSelectionPath({ offer, source });
    expect(path).toContain("/workspace/routing?");
    expect(new URL(`https://moyusi.local${path}`).searchParams.get("source")).toBe(source.name);
  });

  it("sends BYOK choices to the credential boundary", () => {
    const offer = catalogRepository.getById("gemini-flash")!;
    const source = offer.sources.find((candidate) => candidate.mode === "BYOK")!;
    expect(workspaceSelectionPath({ offer, source })).toContain("/workspace/sources?");
  });
});
