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

export type ControlPlaneCommand =
  | ConnectSourceCommand
  | CreateApiCredentialCommand
  | SaveRouteCommand
  | TestEndpointCommand
  | CreateMigrationPlanCommand;

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

export function isTerminalOperation(status: OperationStatus): boolean {
  return status !== "pending";
}
