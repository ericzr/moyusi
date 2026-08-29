import { useMemo } from "react";
import { summarizeWorkspace, type DemoPlatformState, type WorkspaceSummary } from "../../domain/demoPlatform";
import { getWorkspaceSummary } from "../../services/mockApi";
import { useAsyncResource } from "../../shared/asyncState";

export function useWorkspaceSummary(state: DemoPlatformState) {
  const initialData = useMemo<WorkspaceSummary>(() => summarizeWorkspace(state), []);
  return useAsyncResource<WorkspaceSummary>(() => getWorkspaceSummary(state), [state], initialData);
}
