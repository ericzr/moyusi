import { buildControlPlaneSnapshot, type ControlPlaneSnapshot } from "../domain/controlPlane";
import type { DemoPlatformState } from "../domain/demoPlatform";
import { platformRepository } from "./platformRepository";
import { workspaceRepository } from "./workspaceRepository";

export const controlPlaneRepository = {
  snapshot(state: DemoPlatformState): ControlPlaneSnapshot {
    return buildControlPlaneSnapshot(state, workspaceRepository.listSources(), platformRepository.snapshot().catalogVersion);
  },
};
