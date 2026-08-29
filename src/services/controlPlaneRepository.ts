import { buildControlPlaneSnapshot, type ControlPlaneSnapshot } from "../domain/controlPlane";
import type { DemoPlatformState } from "../domain/demoPlatform";
import { platformRepository } from "./platformRepository";
import { workspaceRepository } from "./workspaceRepository";
import { completeOperation, createMemoryOperationStore, createOperation, type ControlPlaneCommand, type OperationResult, type OperationStore } from "../domain/operations";

export type CommandContext = {
  desktopConnected?: boolean;
};

function commandError(code: string, message: string, retryable: boolean) {
  return { code, message, retryable };
}

export function createControlPlaneRepository(store: OperationStore = createMemoryOperationStore()) {
  return {
  snapshot(state: DemoPlatformState): ControlPlaneSnapshot {
    return buildControlPlaneSnapshot(state, workspaceRepository.listSources(), platformRepository.snapshot().catalogVersion);
  },

    execute(command: ControlPlaneCommand, context: CommandContext = {}, now = new Date().toISOString()): OperationResult {
      const pending = store.put(createOperation(command.kind, undefined, now));
      const projectOk = command.projectId === "project_default";
      if (!projectOk) return store.put(completeOperation(pending, "failed", { error: commandError("project_not_found", "项目不存在或无权访问", false) }, now));
      if (command.kind === "connect-source" && command.sourceId === "missing") return store.put(completeOperation(pending, "failed", { error: commandError("source_not_found", "来源不存在或已下架", false) }, now));
      if ((command.kind === "save-route" || command.kind === "test-endpoint" || command.kind === "create-migration-plan") && context.desktopConnected === false) {
        return store.put(completeOperation(pending, "failed", { error: commandError("desktop_offline", "Desktop 未连接，操作尚未应用", true) }, now));
      }
      if (command.kind === "create-api-credential" && command.scopes.length === 0) {
        return store.put(completeOperation(pending, "failed", { error: commandError("scope_required", "至少需要一个调用权限", false) }, now));
      }
      return store.put(completeOperation(pending, "succeeded", { data: commandResult(command) }, now));
    },

    getOperation(operationId: string): OperationResult | null {
      return store.get(operationId);
    },
  };
}

function commandResult(command: ControlPlaneCommand): Record<string, unknown> {
  if (command.kind === "create-api-credential") return { credentialId: "cred_demo_next", secretAvailableOnce: true };
  if (command.kind === "save-route") return { routeProfileId: command.routeProfileId, modelId: command.modelId, sourceIds: command.sourceIds };
  if (command.kind === "test-endpoint") return { sourceId: command.sourceId, endpointRef: command.endpointRef, probeStatus: "passed" };
  if (command.kind === "create-migration-plan") return { workspaceProfileId: command.workspaceProfileId, target: command.target, reportStatus: "pending-confirmation" };
  return { sourceId: command.sourceId, entitlementStatus: "active" };
}
export const controlPlaneRepository = createControlPlaneRepository();
