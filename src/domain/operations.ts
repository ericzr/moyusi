export type OperationStatus = "pending" | "succeeded" | "failed" | "expired" | "rollback-required";

export type ConnectSourceCommand = {
  kind: "connect-source";
  projectId: string;
  sourceId: string;
  authorizationMode: "moyusi" | "byok" | "direct" | "endpoint";
};

export type CreateApiCredentialCommand = {
  kind: "create-api-credential";
  projectId: string;
  scopes: string[];
  spendLimitCny?: number;
};

export type SaveRouteCommand = {
  kind: "save-route";
  projectId: string;
  routeProfileId: string;
  modelId: string;
  sourceIds: string[];
  strategy: "auto" | "fixed" | "cost";
};

export type TestEndpointCommand = {
  kind: "test-endpoint";
  projectId: string;
  sourceId: string;
  endpointRef: string;
};

export type CreateMigrationPlanCommand = {
  kind: "create-migration-plan";
  projectId: string;
  workspaceProfileId: string;
  target: "Codex" | "Claude Code" | "Gemini CLI";
};

export type CreateDeploymentOrderCommand = {
  kind: "create-deployment-order";
  projectId: string;
  modelId: string;
  sourceName: string;
  rateLabel: string;
  budgetLimitCny: number;
};

export type ControlPlaneCommand =
  | ConnectSourceCommand
  | CreateApiCredentialCommand
  | SaveRouteCommand
  | TestEndpointCommand
  | CreateMigrationPlanCommand
  | CreateDeploymentOrderCommand;

export type OperationError = {
  code: string;
  message: string;
  retryable: boolean;
};

export type OperationResult<T = unknown> = {
  operationId: string;
  command: ControlPlaneCommand["kind"];
  status: OperationStatus;
  createdAt: string;
  updatedAt: string;
  data?: T;
  error?: OperationError;
};

export type OperationStore = {
  get(operationId: string): OperationResult | null;
  put<T>(result: OperationResult<T>): OperationResult<T>;
};

export function createOperation<T>(command: ControlPlaneCommand["kind"], data?: T, now = new Date().toISOString()): OperationResult<T> {
  const operationId = `op_${command}_${Date.parse(now).toString(36)}`;
  return { operationId, command, status: "pending", createdAt: now, updatedAt: now, data };
}

export function completeOperation<T>(operation: OperationResult<T>, status: Exclude<OperationStatus, "pending">, patch: Pick<OperationResult<T>, "data" | "error"> = {}, updatedAt = new Date().toISOString()): OperationResult<T> {
  return { ...operation, ...patch, status, updatedAt };
}

export function createMemoryOperationStore(): OperationStore {
  const operations = new Map<string, OperationResult>();
  return {
    get(operationId) {
      return operations.get(operationId) ?? null;
    },
    put(result) {
      operations.set(result.operationId, result);
      return result;
    },
  };
}

export function isTerminalOperation(status: OperationStatus): boolean {
  return status !== "pending";
}
