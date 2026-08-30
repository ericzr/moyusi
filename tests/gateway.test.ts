import { describe, expect, it } from "vitest";
import {
  appendRouteAttempt,
  createGatewayRequest,
  finalizeUsageEvent,
  GatewayDomainError,
  settleRequest,
} from "../src/domain/gateway";
import { createGatewayRepository } from "../src/services/gatewayRepository";

const baseRequest = {
  id: "req_test_001",
  idempotencyKey: "idem_test_001",
  projectId: "project_default",
  credentialId: "cred_moyusi_default",
  requestedModel: "claude-sonnet",
  protocol: "anthropic-messages" as const,
};

function firstAttempt(record = createGatewayRequest(baseRequest)) {
  return appendRouteAttempt(record, {
    id: "attempt_001",
    modelId: "claude-sonnet",
    routeOfferId: "claude-sonnet:route:anthropic-official-1",
    priceVersionId: "price_official_v1",
    sourceId: "anthropic-official",
  }, "2026-08-30T01:00:00.000Z");
}

describe("gateway metering contract", () => {
  it("pins the request to a route and immutable price version", () => {
    const routed = firstAttempt();
    const completed = finalizeUsageEvent(routed, {
      id: "usage_001",
      attemptId: "attempt_001",
      sourceEventId: "anthropic:evt_001",
      inputUnits: 1000,
      outputUnits: 250,
      upstreamAmountMinor: 42,
    }, "2026-08-30T01:01:00.000Z");
    const settled = settleRequest(completed, { id: "settlement_001", customerAmountMinor: 58, billingScope: "moyusi" });

    expect(settled.request.routeOfferId).toBe("claude-sonnet:route:anthropic-official-1");
    expect(settled.request.priceVersionId).toBe("price_official_v1");
    expect(settled.settlement?.priceVersionId).toBe("price_official_v1");
    expect(settled.settlement?.customerAmount.amountMinor).toBe(58);
  });

  it("allows a same-model fallback only for retryable failures", () => {
    const failed = appendRouteAttempt(createGatewayRequest(baseRequest), {
      id: "attempt_001",
      modelId: "claude-sonnet",
      routeOfferId: "route_primary",
      priceVersionId: "price_primary_v1",
      sourceId: "provider-primary",
      status: "failed",
      failureClass: "timeout",
    });
    const fallback = appendRouteAttempt(failed, {
      id: "attempt_002",
      modelId: "claude-sonnet",
      routeOfferId: "route_backup",
      priceVersionId: "price_backup_v1",
      sourceId: "provider-backup",
    });
    expect(fallback.attempts).toHaveLength(2);
    expect(fallback.request.status).toBe("routing");
  });

  it("does not retry deterministic failures or after streamed output", () => {
    const authFailure = appendRouteAttempt(createGatewayRequest(baseRequest), {
      id: "attempt_auth",
      modelId: "claude-sonnet",
      routeOfferId: "route_primary",
      priceVersionId: "price_primary_v1",
      sourceId: "provider-primary",
      status: "failed",
      failureClass: "auth",
    });
    expect(authFailure.request.status).toBe("failed");
    expect(() => appendRouteAttempt(authFailure, {
      id: "attempt_backup",
      modelId: "claude-sonnet",
      routeOfferId: "route_backup",
      priceVersionId: "price_backup_v1",
      sourceId: "provider-backup",
    })).toThrowError(GatewayDomainError);

    const streaming = firstAttempt();
    const partial = finalizeUsageEvent(streaming, {
      id: "usage_partial",
      attemptId: "attempt_001",
      sourceEventId: "upstream:partial",
      inputUnits: 100,
      outputUnits: 10,
      upstreamAmountMinor: 1,
      final: false,
      streamedOutput: true,
    });
    expect(() => appendRouteAttempt(partial, {
      id: "attempt_backup",
      modelId: "claude-sonnet",
      routeOfferId: "route_backup",
      priceVersionId: "price_backup_v1",
      sourceId: "provider-backup",
    })).toThrowError(/流式响应已开始/);
  });

  it("deduplicates upstream usage events and user settlement", () => {
    const routed = firstAttempt();
    const input = {
      id: "usage_001",
      attemptId: "attempt_001",
      sourceEventId: "upstream:evt_001",
      inputUnits: 10,
      outputUnits: 5,
      upstreamAmountMinor: 2,
    };
    const completed = finalizeUsageEvent(routed, input);
    expect(() => finalizeUsageEvent(completed, { ...input, id: "usage_duplicate" })).toThrowError(/不能重复/);
    const settled = settleRequest(completed, { id: "settlement_001", customerAmountMinor: 3, billingScope: "moyusi" });
    expect(settleRequest(settled, { id: "settlement_001", customerAmountMinor: 3, billingScope: "moyusi" })).toBe(settled);
    expect(() => settleRequest(settled, { id: "settlement_002", customerAmountMinor: 4, billingScope: "moyusi" })).toThrowError(/最终结算/);
  });

  it("keeps BYOK as an external estimate instead of Moyusi settlement", () => {
    const completed = finalizeUsageEvent(firstAttempt(), {
      id: "usage_byok",
      attemptId: "attempt_001",
      sourceEventId: "byok:evt_001",
      inputUnits: 10,
      outputUnits: 5,
      upstreamAmountMinor: 4,
    });
    const settled = settleRequest(completed, { id: "settlement_byok", customerAmountMinor: 4, billingScope: "external" });
    expect(settled.settlement?.status).toBe("estimated");
    expect(settled.settlement?.billingScope).toBe("external");
  });

  it("reuses an idempotent request but rejects a conflicting payload", () => {
    const repository = createGatewayRepository();
    const first = repository.createRequest(baseRequest);
    expect(repository.createRequest({ ...baseRequest, id: "req_test_002" })).toBe(first);
    expect(() => repository.createRequest({ ...baseRequest, id: "req_test_003", requestedModel: "gpt-coding" })).toThrowError(/Idempotency-Key/);
  });
});
