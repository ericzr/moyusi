/**
 * Gateway domain contracts.
 *
 * These records are deliberately independent from the HTTP implementation. A
 * real gateway can replace the mock repository without changing the catalog,
 * workbench or billing consumers.
 */

export type GatewayProtocol = "responses" | "chat-completions" | "anthropic-messages";
export type GatewayRequestStatus = "accepted" | "routing" | "streaming" | "completed" | "failed" | "cancelled";
export type RouteAttemptStatus = "started" | "succeeded" | "failed" | "cancelled";
export type RouteFailureClass =
  | "timeout"
  | "connection"
  | "rate-limit"
  | "upstream-5xx"
  | "auth"
  | "forbidden"
  | "model-not-found"
  | "invalid-request"
  | "insufficient-balance"
  | "client-cancelled"
  | "stream-interrupted"
  | "unknown";
export type SettlementStatus = "settled" | "estimated" | "void";
export type BillingScope = "moyusi" | "external" | "included";

export type Money = {
  currency: "CNY";
  amountMinor: number;
};

export type ApiRequest = {
  id: string;
  idempotencyKey?: string;
  projectId: string;
  credentialId: string;
  requestedModel: string;
  actualModel?: string;
  routeOfferId?: string;
  protocol: GatewayProtocol;
  status: GatewayRequestStatus;
  streaming: boolean;
  fallbackAllowed: boolean;
  crossModelFallbackAllowed: boolean;
  startedAt: string;
  completedAt?: string;
  priceVersionId?: string;
};

export type RouteAttempt = {
  id: string;
  requestId: string;
  attempt: number;
  modelId: string;
  routeOfferId: string;
  priceVersionId: string;
  sourceId: string;
  status: RouteAttemptStatus;
  startedAt: string;
  completedAt?: string;
  failureClass?: RouteFailureClass;
  failureMessage?: string;
  streamedOutput: boolean;
};

export type UsageEvent = {
  id: string;
  requestId: string;
  attempt: number;
  attemptId: string;
  sourceEventId: string;
  routeOfferId: string;
  priceVersionId: string;
  inputUnits: number;
  outputUnits: number;
  cacheUnits: number;
  upstreamAmount: Money;
  final: boolean;
  observedAt: string;
  payloadVersion: 1;
};

export type Settlement = {
  id: string;
  requestId: string;
  usageEventId: string;
  priceVersionId: string;
  customerAmount: Money;
  upstreamAmount: Money;
  billingScope: BillingScope;
  status: SettlementStatus;
  createdAt: string;
};

export type GatewayError = {
  code:
    | "invalid-request"
    | "duplicate-idempotency-key"
    | "request-not-found"
    | "request-terminal"
    | "attempt-not-found"
    | "attempt-order-invalid"
    | "fallback-not-allowed"
    | "non-retryable-failure"
    | "stream-already-started"
    | "usage-event-duplicate"
    | "usage-event-not-final"
    | "settlement-duplicate"
    | "price-version-required";
  message: string;
  retryable: boolean;
};

export class GatewayDomainError extends Error {
  readonly details: GatewayError;

  constructor(details: GatewayError) {
    super(details.message);
    this.name = "GatewayDomainError";
    this.details = details;
  }
}

export type GatewayRequestRecord = {
  request: ApiRequest;
  attempts: RouteAttempt[];
  usageEvents: UsageEvent[];
  settlement?: Settlement;
};

export type CreateGatewayRequestInput = {
  id: string;
  idempotencyKey?: string;
  projectId: string;
  credentialId: string;
  requestedModel: string;
  protocol: GatewayProtocol;
  streaming?: boolean;
  fallbackAllowed?: boolean;
  crossModelFallbackAllowed?: boolean;
};

export type AppendRouteAttemptInput = {
  id: string;
  modelId: string;
  routeOfferId: string;
  priceVersionId: string;
  sourceId: string;
  status?: RouteAttemptStatus;
  failureClass?: RouteFailureClass;
  failureMessage?: string;
  streamedOutput?: boolean;
};

export type FinalizeUsageInput = {
  id: string;
  attemptId: string;
  sourceEventId: string;
  inputUnits: number;
  outputUnits: number;
  cacheUnits?: number;
  upstreamAmountMinor: number;
  final?: boolean;
  /** Set when the upstream has already emitted bytes to the client. */
  streamedOutput?: boolean;
};

export type SettleRequestInput = {
  id: string;
  customerAmountMinor: number;
  billingScope: BillingScope;
};

export function createGatewayRequest(input: CreateGatewayRequestInput, now = new Date().toISOString()): GatewayRequestRecord {
  if (!input.id || !input.projectId || !input.credentialId || !input.requestedModel) {
    throw gatewayError("invalid-request", "请求缺少必填身份字段", false);
  }
  return {
    request: {
      id: input.id,
      idempotencyKey: input.idempotencyKey,
      projectId: input.projectId,
      credentialId: input.credentialId,
      requestedModel: input.requestedModel,
      protocol: input.protocol,
      status: "accepted",
      streaming: input.streaming ?? false,
      fallbackAllowed: input.fallbackAllowed ?? true,
      crossModelFallbackAllowed: input.crossModelFallbackAllowed ?? false,
      startedAt: now,
    },
    attempts: [],
    usageEvents: [],
  };
}

export function appendRouteAttempt(record: GatewayRequestRecord, input: AppendRouteAttemptInput, now = new Date().toISOString()): GatewayRequestRecord {
  assertRequestCanRoute(record);
  if (!input.id || !input.routeOfferId || !input.priceVersionId || !input.sourceId || !input.modelId) {
    throw gatewayError("invalid-request", "路由尝试缺少模型、来源或价格版本", false);
  }
  if (record.attempts.some((attempt) => attempt.id === input.id)) {
    throw gatewayError("attempt-order-invalid", "路由尝试 ID 已存在", false);
  }
  const previous = record.attempts[record.attempts.length - 1];
  if (previous?.streamedOutput) {
    throw gatewayError("stream-already-started", "流式响应已开始，不能无痕切换来源", false);
  }
  if (previous && previous.status === "succeeded") {
    throw gatewayError("request-terminal", "请求已有成功路由尝试", false);
  }
  if (previous && previous.status === "failed") {
    if (!record.request.fallbackAllowed) {
      throw gatewayError("fallback-not-allowed", "当前请求未允许回退", false);
    }
    if (!isRetryableFailure(previous.failureClass)) {
      throw gatewayError("non-retryable-failure", "上一次失败属于不可回退错误", false);
    }
    if (previous.modelId !== input.modelId && !record.request.crossModelFallbackAllowed) {
      throw gatewayError("fallback-not-allowed", "跨模型回退未获授权", false);
    }
  }
  const attempt: RouteAttempt = {
    id: input.id,
    requestId: record.request.id,
    attempt: record.attempts.length + 1,
    modelId: input.modelId,
    routeOfferId: input.routeOfferId,
    priceVersionId: input.priceVersionId,
    sourceId: input.sourceId,
    status: input.status ?? "started",
    startedAt: now,
    failureClass: input.failureClass,
    failureMessage: input.failureMessage,
    streamedOutput: input.streamedOutput ?? false,
    ...(input.status === "failed" ? { completedAt: now } : {}),
  };
  if (attempt.status === "failed" && !isRetryableFailure(attempt.failureClass)) {
    return {
      ...record,
      request: { ...record.request, status: "failed", completedAt: now },
      attempts: [...record.attempts, attempt],
    };
  }
  return {
    ...record,
    request: { ...record.request, status: "routing" },
    attempts: [...record.attempts, attempt],
  };
}

export function finalizeUsageEvent(record: GatewayRequestRecord, input: FinalizeUsageInput, now = new Date().toISOString()): GatewayRequestRecord {
  const attempt = record.attempts.find((candidate) => candidate.id === input.attemptId);
  if (!attempt) throw gatewayError("attempt-not-found", "找不到对应的路由尝试", false);
  if (attempt.status === "failed" || attempt.status === "cancelled") {
    throw gatewayError("request-terminal", "失败的路由尝试不能写入成功用量", false);
  }
  if ([input.inputUnits, input.outputUnits, input.cacheUnits ?? 0, input.upstreamAmountMinor].some((value) => !Number.isFinite(value) || value < 0)) {
    throw gatewayError("invalid-request", "用量和金额必须是非负数", false);
  }
  const final = input.final ?? true;
  const eventKey = usageEventKey(record.request.id, attempt.attempt, final, input.sourceEventId);
  if (record.usageEvents.some((event) => usageEventKey(event.requestId, event.attempt, event.final, event.sourceEventId) === eventKey)) {
    throw gatewayError("usage-event-duplicate", "同一上游用量事件不能重复写入", false);
  }
  const event: UsageEvent = {
    id: input.id,
    requestId: record.request.id,
    attempt: attempt.attempt,
    attemptId: attempt.id,
    sourceEventId: input.sourceEventId,
    routeOfferId: attempt.routeOfferId,
    priceVersionId: attempt.priceVersionId,
    inputUnits: input.inputUnits,
    outputUnits: input.outputUnits,
    cacheUnits: input.cacheUnits ?? 0,
    upstreamAmount: { currency: "CNY", amountMinor: input.upstreamAmountMinor },
    final,
    observedAt: now,
    payloadVersion: 1,
  };
  const nextAttempts = record.attempts.map((candidate) => candidate.id === attempt.id
    ? {
        ...candidate,
        status: final ? "succeeded" as const : candidate.status,
        streamedOutput: candidate.streamedOutput || Boolean(input.streamedOutput),
        completedAt: final ? now : candidate.completedAt,
      }
    : candidate);
  return {
    ...record,
    request: final
      ? { ...record.request, status: "completed", actualModel: attempt.modelId, routeOfferId: attempt.routeOfferId, priceVersionId: attempt.priceVersionId, completedAt: now }
      : { ...record.request, status: "streaming", actualModel: attempt.modelId, routeOfferId: attempt.routeOfferId, priceVersionId: attempt.priceVersionId },
    attempts: nextAttempts,
    usageEvents: [...record.usageEvents, event],
  };
}

export function settleRequest(record: GatewayRequestRecord, input: SettleRequestInput, now = new Date().toISOString()): GatewayRequestRecord {
  if (record.settlement) {
    if (record.settlement.id === input.id) return record;
    throw gatewayError("settlement-duplicate", "同一请求已经生成最终结算", false);
  }
  if (record.request.status !== "completed") {
    throw gatewayError("usage-event-not-final", "请求尚未收到最终用量，不能结算", false);
  }
  const finalEvent = record.usageEvents.find((event) => event.final);
  if (!finalEvent) throw gatewayError("usage-event-not-final", "请求缺少最终用量事件", false);
  if (!Number.isFinite(input.customerAmountMinor) || input.customerAmountMinor < 0) {
    throw gatewayError("invalid-request", "用户结算金额必须是非负数", false);
  }
  const settlement: Settlement = {
    id: input.id,
    requestId: record.request.id,
    usageEventId: finalEvent.id,
    priceVersionId: finalEvent.priceVersionId,
    customerAmount: { currency: "CNY", amountMinor: input.customerAmountMinor },
    upstreamAmount: finalEvent.upstreamAmount,
    billingScope: input.billingScope,
    status: input.billingScope === "moyusi" ? "settled" : "estimated",
    createdAt: now,
  };
  return { ...record, settlement };
}

export function isRetryableFailure(failureClass?: RouteFailureClass): boolean {
  return failureClass === "timeout"
    || failureClass === "connection"
    || failureClass === "rate-limit"
    || failureClass === "upstream-5xx";
}

export function usageEventKey(requestId: string, attempt: number, final: boolean, sourceEventId: string): string {
  return `${requestId}:${attempt}:${final ? "final" : "interim"}:${sourceEventId}`;
}

function assertRequestCanRoute(record: GatewayRequestRecord): void {
  if (["completed", "failed", "cancelled"].includes(record.request.status)) {
    throw gatewayError("request-terminal", "请求已经结束，不能继续路由", false);
  }
}

function gatewayError(code: GatewayError["code"], message: string, retryable: boolean): GatewayDomainError {
  return new GatewayDomainError({ code, message, retryable });
}
