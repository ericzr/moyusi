import { describe, expect, it } from "vitest";
import { createControlPlaneRepository } from "../src/services/controlPlaneRepository";

describe("control plane command execution", () => {
  it("succeeds for a valid source connection and returns safe data", () => {
    const repository = createControlPlaneRepository();
    const result = repository.execute({ kind: "connect-source", projectId: "project_default", sourceId: "moyusi-stable", authorizationMode: "moyusi" }, {}, "2026-08-29T10:00:00.000Z");

    expect(result.status).toBe("succeeded");
    expect(result.data).toEqual({ sourceId: "moyusi-stable", entitlementStatus: "active" });
    expect(result).not.toHaveProperty("secret");
    expect(repository.getOperation(result.operationId)).toEqual(result);
  });

  it("fails safely when Desktop is offline for local operations", () => {
    const repository = createControlPlaneRepository();
    const result = repository.execute({ kind: "save-route", projectId: "project_default", routeProfileId: "route-codex", modelId: "gpt-coding", sourceIds: ["moyusi-stable"], strategy: "auto" }, { desktopConnected: false }, "2026-08-29T10:00:00.000Z");

    expect(result).toMatchObject({ status: "failed", error: { code: "desktop_offline", retryable: true } });
  });

  it("rejects invalid commands before applying anything", () => {
    const repository = createControlPlaneRepository();
    expect(repository.execute({ kind: "create-api-credential", projectId: "project_default", scopes: [] }, {}, "2026-08-29T10:00:00.000Z").error?.code).toBe("scope_required");
    expect(repository.execute({ kind: "connect-source", projectId: "wrong", sourceId: "moyusi-stable", authorizationMode: "moyusi" }, {}, "2026-08-29T10:00:00.000Z").error?.code).toBe("project_not_found");
  });
});
