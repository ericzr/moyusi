import { describe, expect, it } from "vitest";
import { isTerminalOperation, type OperationResult } from "../src/domain/operations";

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
});
