import { describe, expect, it } from "vitest";
import {
  applyMigrationPreview,
  claimImportGrant,
  createInitialPortableWorkspaceState,
  createMigrationPreview,
  issueImportGrant,
} from "../src/domain/portableWorkspace";

describe("portable workspace boundaries", () => {
  it("claims a one-time BYOK import grant without persisting a credential value", () => {
    const initial = createInitialPortableWorkspaceState();
    const issued = issueImportGrant(initial, "OpenRouter", "2026-08-29T10:00:00.000Z");
    const claimed = claimImportGrant(issued.state, issued.grant.id, "2026-08-29T10:02:00.000Z");

    expect(claimed?.connection).toMatchObject({ provider: "OpenRouter", state: "bound", scope: "模型调用 · 外部结算" });
    expect(claimed?.state.grants[0]).toMatchObject({ state: "claimed" });
    expect(JSON.stringify(claimed?.state)).not.toContain("sk-");
    expect(JSON.stringify(claimed?.state)).not.toContain("api_key");
  });

  it("marks an expired import grant without changing the source connection", () => {
    const initial = createInitialPortableWorkspaceState();
    const issued = issueImportGrant(initial, "Anthropic", "2026-08-29T10:00:00.000Z");
    const expired = claimImportGrant(issued.state, issued.grant.id, "2026-08-29T10:11:00.000Z");

    expect(expired?.connection).toBeNull();
    expect(expired?.state.grants[0].state).toBe("expired");
    expect(expired?.state.connections.find((connection) => connection.provider === "Anthropic")).toBeUndefined();
  });

  it("requires a target-specific preview before recording a migration application", () => {
    const initial = createInitialPortableWorkspaceState();
    const preview = createMigrationPreview(initial, "Claude Code", "2026-08-29T10:00:00.000Z");
    const applied = applyMigrationPreview(preview, "Claude Code", "2026-08-29T10:01:00.000Z");

    expect(preview.latestMigration).toMatchObject({ target: "Claude Code", state: "preview" });
    expect(applied.latestMigration).toMatchObject({ target: "Claude Code", state: "applied", appliedAt: "2026-08-29T10:01:00.000Z" });
    expect(applyMigrationPreview(preview, "Codex", "2026-08-29T10:01:00.000Z")).toBe(preview);
  });
});
