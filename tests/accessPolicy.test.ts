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
    expect(sourceActionLabel("BYOK")).toBe("连接并使用");
    expect(sourceActionLabel("统一余额")).toBe("一键切换");
  });

  it("rejects unknown workbench routes", () => {
    expect(isWorkspaceSection("billing")).toBe(true);
    expect(isWorkspaceSection("tools")).toBe(true);
    expect(isWorkspaceSection("sessions")).toBe(true);
    expect(isWorkspaceSection("usage")).toBe(true);
    expect(isWorkspaceSection("settings")).toBe(true);
    expect(isWorkspaceSection("admin")).toBe(false);
  });
});
