import { describe, expect, it } from "vitest";
import { getAccessFlow, isWorkspaceSection, sourceActionLabel } from "../src/domain/accessPolicy";

describe("access policy", () => {
  it.each([
    ["统一余额", "routing", "route"],
    ["共享算力", "routing", "route"],
    ["BYOK", "sources", "credential"],
    ["自有端点", "deployments", "endpoint"],
    ["专属算力", "deployments", "budget"],
  ] as const)("routes %s to the correct workbench boundary", (mode, section, actionKind) => {
    expect(getAccessFlow(mode)).toMatchObject({ targetSection: section, actionKind });
  });

  it("keeps source actions explicit", () => {
    expect(sourceActionLabel("BYOK")).toBe("绑定凭证");
    expect(sourceActionLabel("统一余额")).toBe("选择供给");
  });

  it("rejects unknown workbench routes", () => {
    expect(isWorkspaceSection("billing")).toBe(true);
    expect(isWorkspaceSection("admin")).toBe(false);
  });
});
