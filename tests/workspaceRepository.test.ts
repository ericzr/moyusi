import { describe, expect, it } from "vitest";
import { workspaceRepository } from "../src/services/workspaceRepository";

describe("workspace provider repository", () => {
  it("exposes a typed source, profile and route graph", () => {
    const snapshot = workspaceRepository.snapshot();

    expect(snapshot.sources.length).toBeGreaterThan(0);
    expect(snapshot.profiles.length).toBeGreaterThan(0);
    expect(snapshot.routes).toHaveLength(snapshot.profiles.length);
    expect(snapshot.routes.every((route) => snapshot.profiles.some((profile) => profile.id === route.profileId))).toBe(true);
  });

  it("resolves a route profile to its provider profile and ordered sources", () => {
    const resolved = workspaceRepository.resolveRoute("route-codex");

    expect(resolved?.profile.tool).toBe("Codex");
    expect(resolved?.route.strategy).toBe("auto");
    expect(resolved?.sources.map((source) => source.id)).toEqual(["moyusi-stable", "openrouter"]);
  });

  it("returns defensive copies so UI edits cannot mutate fixtures", () => {
    const sources = workspaceRepository.listSources();
    sources[0].name = "本地改名";

    expect(workspaceRepository.listSources()[0]?.name).not.toBe("本地改名");
  });
});
