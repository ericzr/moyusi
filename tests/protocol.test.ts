import { describe, expect, it } from "vitest";
import { normalizeProtocolRequest, protocolForEndpoint, ProtocolAdapterError } from "../src/domain/protocol";

describe("gateway protocol adapters", () => {
  it("normalizes Responses fields without losing stream or tool intent", () => {
    const request = normalizeProtocolRequest("responses", {
      model: "gpt-coding",
      input: "修复这个函数",
      stream: true,
      max_output_tokens: 1200,
      tools: [{ type: "function", name: "run_tests" }],
      previous_response_id: "resp_prev",
    });

    expect(request).toMatchObject({
      protocol: "responses",
      model: "gpt-coding",
      stream: true,
      maxOutputTokens: 1200,
      previousResponseId: "resp_prev",
    });
    expect(request.tools).toHaveLength(1);
  });

  it("maps Chat Completions and Anthropic max token names to one field", () => {
    expect(normalizeProtocolRequest("chat-completions", {
      model: "gpt-coding",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 64,
    }).maxOutputTokens).toBe(64);
    expect(normalizeProtocolRequest("anthropic-messages", {
      model: "claude-sonnet",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 128,
    }).maxOutputTokens).toBe(128);
  });

  it("rejects unsupported parameters instead of silently dropping them", () => {
    expect(() => normalizeProtocolRequest("responses", {
      model: "gpt-coding",
      input: "hi",
      max_tokens: 100,
    })).toThrowError(ProtocolAdapterError);
    try {
      normalizeProtocolRequest("responses", { model: "gpt-coding", input: "hi", max_tokens: 100 });
    } catch (error) {
      expect((error as ProtocolAdapterError).details.code).toBe("unsupported-parameter");
      expect((error as ProtocolAdapterError).details.field).toBe("max_tokens");
    }
  });

  it("requires protocol-specific fields and positive limits", () => {
    expect(() => normalizeProtocolRequest("responses", { model: "gpt-coding" })).toThrowError(/需要 input/);
    expect(() => normalizeProtocolRequest("anthropic-messages", { model: "claude-sonnet", messages: [] })).toThrowError(/max_tokens/);
    expect(() => normalizeProtocolRequest("chat-completions", { model: "gpt-coding", messages: [], temperature: -1 })).toThrowError(/temperature/);
  });

  it("resolves only supported gateway endpoints", () => {
    expect(protocolForEndpoint("/v1/responses")).toBe("responses");
    expect(protocolForEndpoint("https://api.example.com/v1/chat/completions?stream=true")).toBe("chat-completions");
    expect(protocolForEndpoint("/v1/messages/")).toBe("anthropic-messages");
    expect(protocolForEndpoint("/v1/embeddings")).toBeNull();
  });
});
