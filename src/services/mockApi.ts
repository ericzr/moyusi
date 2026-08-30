import type { CatalogFilter, ModelOffer } from "../domain/catalog";
import { summarizeWorkspace, type DemoPlatformState, type WorkspaceSummary } from "../domain/demoPlatform";
import type { CatalogSnapshot, PlatformModelGraph, PlatformSnapshot } from "../domain/platform";
import { catalogRepository } from "./catalogRepository";
import type { ControlPlaneSnapshot } from "../domain/controlPlane";
import { controlPlaneRepository } from "./controlPlaneRepository";
import { platformRepository } from "./platformRepository";
import type {
  AppendRouteAttemptInput,
  CreateGatewayRequestInput,
  FinalizeUsageInput,
  GatewayRequestRecord,
  SettleRequestInput,
} from "../domain/gateway";
import { gatewayRepository } from "./gatewayRepository";

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

export async function getCatalogModel(modelId: string): Promise<ApiResponse<ModelOffer | null>> {
  await delay(140);
  return response(catalogRepository.getById(modelId));
}

export async function getPlatformModelGraph(modelId: string): Promise<ApiResponse<PlatformModelGraph | null>> {
  await delay(140);
  return response(platformRepository.getModelGraph(modelId));
}

export async function getPlatformSnapshot(): Promise<ApiResponse<PlatformSnapshot>> {
  await delay(100);
  return response(platformRepository.snapshot());
}

export async function getCatalogSnapshot(): Promise<ApiResponse<CatalogSnapshot>> {
  await delay(100);
  return response(platformRepository.catalogSnapshot());
}

export async function getControlPlaneSnapshot(state: DemoPlatformState): Promise<ApiResponse<ControlPlaneSnapshot>> {
  await delay(120);
  return response(controlPlaneRepository.snapshot(state));
}

export async function getWorkspaceSummary(state: DemoPlatformState): Promise<ApiResponse<WorkspaceSummary>> {
  await delay(120);
  return response(summarizeWorkspace(state));
}

export async function createGatewayRequest(input: CreateGatewayRequestInput): Promise<ApiResponse<GatewayRequestRecord>> {
  await delay(80);
  return response(gatewayRepository.createRequest(input));
}

export async function getGatewayRequest(requestId: string): Promise<ApiResponse<GatewayRequestRecord | null>> {
  await delay(60);
  return response(gatewayRepository.getRequest(requestId));
}

export async function appendGatewayAttempt(requestId: string, input: AppendRouteAttemptInput): Promise<ApiResponse<GatewayRequestRecord>> {
  await delay(80);
  return response(gatewayRepository.appendAttempt(requestId, input));
}

export async function finalizeGatewayUsage(requestId: string, input: FinalizeUsageInput): Promise<ApiResponse<GatewayRequestRecord>> {
  await delay(80);
  return response(gatewayRepository.finalizeUsage(requestId, input));
}

export async function settleGatewayRequest(requestId: string, input: SettleRequestInput): Promise<ApiResponse<GatewayRequestRecord>> {
  await delay(80);
  return response(gatewayRepository.settle(requestId, input));
}

function response<T>(data: T): ApiResponse<T> {
  return { data, source: "mock", receivedAt: new Date().toISOString() };
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
