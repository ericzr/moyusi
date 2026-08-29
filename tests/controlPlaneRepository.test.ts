import { describe, expect, it } from "vitest";
import { createInitialDemoState, recordMockUsage } from "../src/domain/demoPlatform";
import { controlPlaneRepository } from "../src/services/controlPlaneRepository";

describe("control plane snapshot", () => {
  it("joins project, entitlements, credentials, devices, billing and assets", () => {
    const snapshot = controlPlaneRepository.snapshot(createInitialDemoState());

    expect(snapshot.project).toMatchObject({ id: "project_default", ownerScope: "personal" });
    expect(snapshot.entitlements.length).toBeGreaterThan(0);
    expect(snapshot.credentials[0]).toMatchObject({ status: "active", secretStored: true });
    expect(snapshot.devices[0]).toMatchObject({ status: "connected", localRouter: "ready" });
    expect(snapshot.assets).toEqual({ mcp: 4, skills: 6, prompts: 3, memoryAndKnowledge: 20 });
  });

  it("keeps external and Moyusi settlement separate in the snapshot", () => {
    const initial = createInitialDemoState();
    const snapshot = controlPlaneRepository.snapshot(initial);
    const moyusi = snapshot.entitlements.find((item) => item.mode === "moyusi");
    const byok = snapshot.entitlements.find((item) => item.mode === "byok");

    expect(moyusi?.settlement).toBe("moyusi");
    expect(byok?.settlement).toBe("external");
    expect(snapshot.billing.availableBalanceCny).toBe(80);
    expect(snapshot.credentials[0]).not.toHaveProperty("secret");
  });

  it("derives billing from the same usage events as the workbench", () => {
    const initial = createInitialDemoState();
    const result = recordMockUsage(initial, "2026-08-29T10:00:00.000Z");
    const snapshot = controlPlaneRepository.snapshot(result.state);

    expect(snapshot.billing.requestCount).toBe(185);
    expect(snapshot.billing.periodCostCny).toBeCloseTo(28.58);
  });
});
