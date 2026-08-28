import { useEffect, useRef, useState } from "react";
import {
  applyMigrationPreview,
  claimImportGrant,
  createInitialPortableWorkspaceState,
  createMigrationPreview,
  isPortableWorkspaceState,
  issueImportGrant,
  type ByokConnection,
  type ByokProvider,
  type MigrationTarget,
  type PortableWorkspaceState,
} from "../../domain/portableWorkspace";

const STORAGE_KEY = "moyusi-demo-portable-workspace-v1";
const MOCK_DELAY_MS = 360;

export function useDemoPortableWorkspace() {
  const [state, setState] = useState<PortableWorkspaceState>(readLocalState);
  const stateRef = useRef(state);

  useEffect(() => {
    try {
      // The preview intentionally stores status metadata only, never a credential value.
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // The preview remains usable when storage is unavailable.
    }
  }, [state]);

  async function connectByok(provider: ByokProvider): Promise<ByokConnection> {
    await delay(MOCK_DELAY_MS);
    const issuedAt = new Date().toISOString();
    const issued = issueImportGrant(stateRef.current, provider, issuedAt);
    const claimed = claimImportGrant(issued.state, issued.grant.id, new Date().toISOString());
    commit(() => claimed?.state ?? issued.state);
    if (!claimed?.connection) throw new Error("Import grant could not be claimed");
    return claimed.connection;
  }

  async function previewMigration(target: MigrationTarget): Promise<void> {
    await delay(MOCK_DELAY_MS);
    commit((current) => createMigrationPreview(current, target, new Date().toISOString()));
  }

  async function applyMigration(target: MigrationTarget): Promise<boolean> {
    await delay(MOCK_DELAY_MS);
    const current = stateRef.current;
    if (current.latestMigration?.target !== target || current.latestMigration.state !== "preview") return false;
    commit((next) => applyMigrationPreview(next, target, new Date().toISOString()));
    return true;
  }

  function commit(update: (current: PortableWorkspaceState) => PortableWorkspaceState): void {
    const next = update(stateRef.current);
    stateRef.current = next;
    setState(next);
  }

  return { state, connectByok, previewMigration, applyMigration };
}

export type DemoPortableWorkspaceController = ReturnType<typeof useDemoPortableWorkspace>;

function readLocalState(): PortableWorkspaceState {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialPortableWorkspaceState();
    const parsed: unknown = JSON.parse(saved);
    return isPortableWorkspaceState(parsed) ? parsed : createInitialPortableWorkspaceState();
  } catch {
    return createInitialPortableWorkspaceState();
  }
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}
