import {
  appendRouteAttempt,
  createGatewayRequest,
  finalizeUsageEvent,
  GatewayDomainError,
  settleRequest,
  type AppendRouteAttemptInput,
  type CreateGatewayRequestInput,
  type FinalizeUsageInput,
  type GatewayRequestRecord,
  type SettleRequestInput,
} from "../domain/gateway";

export type GatewayRepository = {
  createRequest(input: CreateGatewayRequestInput, now?: string): GatewayRequestRecord;
  getRequest(requestId: string): GatewayRequestRecord | null;
  appendAttempt(requestId: string, input: AppendRouteAttemptInput, now?: string): GatewayRequestRecord;
  finalizeUsage(requestId: string, input: FinalizeUsageInput, now?: string): GatewayRequestRecord;
  settle(requestId: string, input: SettleRequestInput, now?: string): GatewayRequestRecord;
};

/**
 * In-memory gateway boundary used by the prototype and contract tests.
 * Production storage should make the same request/event keys unique in one
 * transaction and emit the settlement work to an outbox.
 */
export function createGatewayRepository(): GatewayRepository {
  const records = new Map<string, GatewayRequestRecord>();
  const idempotencyKeys = new Map<string, string>();

  function read(requestId: string): GatewayRequestRecord {
    const record = records.get(requestId);
    if (!record) {
      throw new GatewayDomainError({ code: "request-not-found", message: "请求不存在或已过期", retryable: false });
    }
    return record;
  }

  function write(record: GatewayRequestRecord): GatewayRequestRecord {
    records.set(record.request.id, record);
    return record;
  }

  return {
    createRequest(input, now) {
      const existingId = input.idempotencyKey ? idempotencyKeys.get(`${input.projectId}:${input.idempotencyKey}`) : undefined;
      if (existingId) {
        const existing = read(existingId);
        if (existing.request.requestedModel !== input.requestedModel || existing.request.protocol !== input.protocol || existing.request.credentialId !== input.credentialId) {
          throw new GatewayDomainError({ code: "duplicate-idempotency-key", message: "Idempotency-Key 已用于另一种请求", retryable: false });
        }
        return existing;
      }
      const existingRequest = records.get(input.id);
      if (existingRequest) return existingRequest;
      const record = createGatewayRequest(input, now);
      write(record);
      if (input.idempotencyKey) idempotencyKeys.set(`${input.projectId}:${input.idempotencyKey}`, input.id);
      return record;
    },

    getRequest(requestId) {
      return records.get(requestId) ?? null;
    },

    appendAttempt(requestId, input, now) {
      return write(appendRouteAttempt(read(requestId), input, now));
    },

    finalizeUsage(requestId, input, now) {
      return write(finalizeUsageEvent(read(requestId), input, now));
    },

    settle(requestId, input, now) {
      return write(settleRequest(read(requestId), input, now));
    },
  };
}

export const gatewayRepository = createGatewayRepository();
