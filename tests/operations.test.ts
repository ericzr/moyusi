import { describe, expect, it } from "vitest";
import { completeOperation, createMemoryOperationStore, createOperation, isTerminalOperation, type OperationResult } from "../src/domain/operations";

describe("control plane operation contracts", () => {
  it("recognizes pending versus terminal command states", () => {
    expect(isTerminalOperation("pending")).toBe(false);
    expect(isTerminalOperation("succeeded")).toBe(true);
    expect(isTerminalOperation("rollback-required")).toBe(true);
  });

  it("keeps command results status-oriented and error-safe", () => {
    const result: OperationResult = {
      operationId: "op_demo",
      command: "save-route",
      status: "failed",
      createdAt: "2026-08-29T10:00:00.000Z",
      updatedAt: "2026-08-29T10:00:01.000Z",
      error: { code: "desktop_offline", message: "Desktop 未连接", retryable: true },
    };

    expect(result).not.toHaveProperty("secret");
    expect(result.error?.retryable).toBe(true);
  });

  it("creates and completes an operation without mutating the original result", () => {
    const pending = createOperation("save-route", undefined, "2026-08-29T10:00:00.000Z");
    const done = completeOperation(pending, "succeeded", { data: { routeId: "route-codex" } }, "2026-08-29T10:00:01.000Z");
    expect(pending.status).toBe("pending");
    expect(done).toMatchObject({ operationId: pending.operationId, status: "succeeded", data: { routeId: "route-codex" } });
  });

  it("stores operation results by opaque operation id", () => {
    const store = createMemoryOperationStore();
    const result = createOperation("connect-source", undefined, "2026-08-29T10:00:00.000Z");
    store.put(result);
    expect(store.get(result.operationId)).toEqual(result);
  });
});
