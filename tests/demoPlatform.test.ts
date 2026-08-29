import { describe, expect, it } from "vitest";
import {
  activateSelection,
  createInitialDemoState,
  recordMockUsage,
  restorePreviousRoute,
  setRouteStrategy,
  summarizeWorkspace,
  summarizeBilling,
} from "../src/domain/demoPlatform";
import { catalogRepository } from "../src/services/catalogRepository";

describe("demo platform vertical slice", () => {
  it("activates the exact model and source while keeping a recoverable previous route", () => {
    const initial = createInitialDemoState();
    const offer = catalogRepository.getById("claude-sonnet")!;
    const source = offer.sources[0];
    const switched = activateSelection(initial, { offer, source }, "2026-08-28T12:00:00.000Z");

    expect(switched.activeRoute).toMatchObject({ modelId: offer.id, sourceName: source.name, latency: source.latency });
    expect(switched.previousRoute).toEqual(initial.activeRoute);
    expect(restorePreviousRoute(switched).activeRoute).toEqual(initial.activeRoute);
  });

  it("does not create redundant history when choosing the active route again", () => {
    const initial = createInitialDemoState();
    const offer = catalogRepository.getById("gpt-coding")!;
    const source = offer.sources.find((candidate) => candidate.name === initial.activeRoute.sourceName)!;
    expect(activateSelection(initial, { offer, source }, "2026-08-28T12:00:00.000Z")).toBe(initial);
  });

  it("records a Moyusi-billed call against the route that actually handled it", () => {
    const initial = createInitialDemoState();
    const result = recordMockUsage(initial, "2026-08-28T12:01:00.000Z");
    const summary = summarizeBilling(result.state);

    expect(result.event).toMatchObject({ modelId: initial.activeRoute.modelId, sourceName: initial.activeRoute.sourceName, billingScope: "moyusi" });
    expect(summary.availableBalanceCny).toBe(79.82);
    expect(summary.periodCostCny).toBeCloseTo(28.58);
    expect(summary.requestCount).toBe(185);
  });

  it("keeps BYOK estimates outside the Moyusi balance", () => {
    const initial = createInitialDemoState();
    const offer = catalogRepository.getById("gemini-flash")!;
    const source = offer.sources.find((candidate) => candidate.mode === "BYOK")!;
    const switched = activateSelection(initial, { offer, source }, "2026-08-28T12:00:00.000Z");
    const result = recordMockUsage(switched, "2026-08-28T12:01:00.000Z");
    const summary = summarizeBilling(result.state);

    expect(result.event.billingScope).toBe("external");
    expect(summary.availableBalanceCny).toBe(80);
    expect(summary.externalEstimateCny).toBeCloseTo(6.24);
  });

  it("persists an explicit routing strategy without changing the active route", () => {
    const initial = createInitialDemoState();
    const updated = setRouteStrategy(initial, "cost");
    expect(updated.routePolicy.strategy).toBe("cost");
    expect(updated.activeRoute).toEqual(initial.activeRoute);
    expect(setRouteStrategy(updated, "cost")).toBe(updated);
  });

  it("summarizes the current workbench from platform state", () => {
    const summary = summarizeWorkspace(createInitialDemoState());
    expect(summary).toMatchObject({ routeStatus: "ready", activeModel: "GPT · Coding", activeSource: "Moyusi 稳定线路", pendingAttention: 2 });
    expect(summary.activeTools).toEqual(["Codex", "Claude Code"]);
    expect(summary.desktop).toMatchObject({ status: "connected", localRouter: "ready", name: "Moyusi Desktop" });
  });

  it("adds one attention item when the desktop bridge is offline", () => {
    const state = createInitialDemoState();
    const summary = summarizeWorkspace({ ...state, desktop: { ...state.desktop, status: "offline", localRouter: "stopped" } });
    expect(summary.pendingAttention).toBe(3);
  });
});
