import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogSelection } from "../../domain/catalog";
import {
  activateSelection,
  createInitialDemoState,
  isDemoPlatformState,
  recordMockUsage,
  restorePreviousRoute,
  setRoutePolicy,
  setRouteStrategy,
  summarizeBilling,
  type DemoPlatformState,
  type UsageEvent,
} from "../../domain/demoPlatform";

const STORAGE_KEY = "moyusi-demo-platform-v1";
const MOCK_DELAY_MS = 420;

export function useDemoPlatform() {
  const [state, setState] = useState<DemoPlatformState>(readLocalState);
  const stateRef = useRef(state);
  const billing = useMemo(() => summarizeBilling(state), [state]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The preview remains usable when storage is unavailable.
    }
  }, [state]);

  async function activate(selection: CatalogSelection): Promise<void> {
    await delay(MOCK_DELAY_MS);
    commit((current) => activateSelection(current, selection, new Date().toISOString()));
  }

  async function simulateCall(): Promise<UsageEvent> {
    await delay(MOCK_DELAY_MS);
    const result = recordMockUsage(stateRef.current, new Date().toISOString());
    commit(() => result.state);
    return result.event;
  }

  function restore(): void {
    commit(restorePreviousRoute);
  }

  function updateRouteStrategy(strategy: DemoPlatformState["routePolicy"]["strategy"]): void {
    commit((current) => setRouteStrategy(current, strategy));
  }

  function updateRoutePolicy(patch: Parameters<typeof setRoutePolicy>[1]): void {
    commit((current) => setRoutePolicy(current, patch));
  }

  function commit(update: (current: DemoPlatformState) => DemoPlatformState): void {
    const next = update(stateRef.current);
    stateRef.current = next;
    setState(next);
  }

  return { state, billing, activate, simulateCall, restore, updateRouteStrategy, updateRoutePolicy };
}

export type DemoPlatformController = ReturnType<typeof useDemoPlatform>;

function readLocalState(): DemoPlatformState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialDemoState();
    const parsed: unknown = JSON.parse(saved);
    if (!isDemoPlatformState(parsed)) return createInitialDemoState();
    const legacy = parsed as DemoPlatformState & { routeStrategy?: DemoPlatformState["routePolicy"]["strategy"] };
  return {
      ...parsed,
      routePolicy: parsed.routePolicy ?? { strategy: legacy.routeStrategy ?? "auto", preferredRegion: "亚太", fallback: "same-model", saveRequestBodies: false },
      connectedTools: parsed.connectedTools ?? ["Codex", "Claude Code"],
      desktop: parsed.desktop ?? createInitialDemoState().desktop,
    };
  } catch {
    return createInitialDemoState();
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
