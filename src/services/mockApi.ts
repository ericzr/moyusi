import type { CatalogFilter, ModelOffer } from "../domain/catalog";
import { summarizeWorkspace, type DemoPlatformState, type WorkspaceSummary } from "../domain/demoPlatform";
import { catalogRepository } from "./catalogRepository";

export type ApiSource = "mock";

export type ApiResponse<T> = {
  data: T;
  source: ApiSource;
  receivedAt: string;
};

export class MockApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MockApiError";
  }
}

export async function listCatalogModels(filter: CatalogFilter = {}): Promise<ApiResponse<ModelOffer[]>> {
  await delay(160);
  return response(catalogRepository.list(filter));
}

export async function getWorkspaceSummary(state: DemoPlatformState): Promise<ApiResponse<WorkspaceSummary>> {
  await delay(120);
  return response(summarizeWorkspace(state));
}

function response<T>(data: T): ApiResponse<T> {
  return { data, source: "mock", receivedAt: new Date().toISOString() };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
