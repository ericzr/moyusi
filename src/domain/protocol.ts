import type { GatewayProtocol } from "./gateway";

export type ProtocolField =
  | "model"
  | "input"
  | "instructions"
  | "messages"
  | "system"
  | "stream"
  | "temperature"
  | "max_output_tokens"
  | "max_tokens"
  | "tools"
  | "tool_choice"
  | "response_format"
  | "metadata"
  | "previous_response_id";

export type ProtocolErrorCode = "unsupported-parameter" | "missing-parameter" | "invalid-parameter" | "unknown-endpoint";

export type ProtocolError = {
  code: ProtocolErrorCode;
  message: string;
  field?: string;
  supported?: readonly string[];
};

export class ProtocolAdapterError extends Error {
  readonly details: ProtocolError;

  constructor(details: ProtocolError) {
    super(details.message);
    this.name = "ProtocolAdapterError";
    this.details = details;
  }
}

export type CanonicalGatewayRequest = {
  protocol: GatewayProtocol;
  model: string;
  stream: boolean;
  input?: unknown;
  messages?: readonly unknown[];
  instructions?: string;
  system?: unknown;
  temperature?: number;
  maxOutputTokens?: number;
  tools?: readonly unknown[];
  toolChoice?: unknown;
  responseFormat?: unknown;
  metadata?: unknown;
  previousResponseId?: string;
};

export type ProtocolAdapter = {
  protocol: GatewayProtocol;
  endpoint: string;
  fields: readonly ProtocolField[];
  normalize(body: unknown): CanonicalGatewayRequest;
};

const PROTOCOL_ADAPTERS: Record<GatewayProtocol, ProtocolAdapter> = {
  responses: {
    protocol: "responses",
    endpoint: "/v1/responses",
    fields: ["model", "input", "instructions", "stream", "temperature", "max_output_tokens", "tools", "tool_choice", "metadata", "previous_response_id"],
    normalize: (body) => normalize("responses", body),
  },
  "chat-completions": {
    protocol: "chat-completions",
    endpoint: "/v1/chat/completions",
    fields: ["model", "messages", "stream", "temperature", "max_tokens", "tools", "tool_choice", "response_format", "metadata"],
    normalize: (body) => normalize("chat-completions", body),
  },
  "anthropic-messages": {
    protocol: "anthropic-messages",
    endpoint: "/v1/messages",
    fields: ["model", "messages", "system", "stream", "temperature", "max_tokens", "tools", "tool_choice", "metadata"],
    normalize: (body) => normalize("anthropic-messages", body),
  },
};

export function getProtocolAdapter(protocol: GatewayProtocol): ProtocolAdapter {
  return PROTOCOL_ADAPTERS[protocol];
}

export function protocolForEndpoint(path: string): GatewayProtocol | null {
  const normalized = path.split("?")[0].replace(/\/$/, "");
  if (normalized.endsWith("/v1/responses")) return "responses";
  if (normalized.endsWith("/v1/chat/completions")) return "chat-completions";
  if (normalized.endsWith("/v1/messages")) return "anthropic-messages";
  return null;
}

export function normalizeProtocolRequest(protocol: GatewayProtocol, body: unknown): CanonicalGatewayRequest {
  return getProtocolAdapter(protocol).normalize(body);
}

function normalize(protocol: GatewayProtocol, body: unknown): CanonicalGatewayRequest {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ProtocolAdapterError({ code: "invalid-parameter", message: "请求正文必须是 JSON 对象" });
  }
  const source = body as Record<string, unknown>;
  const adapter = PROTOCOL_ADAPTERS[protocol];
  const supported = new Set(adapter.fields);
  const unsupported = Object.keys(source).filter((field) => !supported.has(field as ProtocolField));
  if (unsupported.length) {
    throw new ProtocolAdapterError({
      code: "unsupported-parameter",
      field: unsupported[0],
      message: `当前协议不支持参数：${unsupported.join(", ")}`,
      supported: adapter.fields,
    });
  }

  const model = stringValue(source.model);
  if (!model) throw new ProtocolAdapterError({ code: "missing-parameter", field: "model", message: "缺少 model 参数" });

  if (protocol === "responses" && source.input === undefined) {
    throw new ProtocolAdapterError({ code: "missing-parameter", field: "input", message: "Responses 请求需要 input" });
  }
  if (protocol === "chat-completions" && !Array.isArray(source.messages)) {
    throw new ProtocolAdapterError({ code: "missing-parameter", field: "messages", message: "Chat Completions 请求需要 messages 数组" });
  }
  if (protocol === "anthropic-messages" && !Array.isArray(source.messages)) {
    throw new ProtocolAdapterError({ code: "missing-parameter", field: "messages", message: "Anthropic Messages 请求需要 messages 数组" });
  }
  if (protocol === "anthropic-messages" && !positiveNumber(source.max_tokens)) {
    throw new ProtocolAdapterError({ code: "missing-parameter", field: "max_tokens", message: "Anthropic Messages 请求需要正数 max_tokens" });
  }

  const stream = source.stream === undefined ? false : source.stream;
  if (typeof stream !== "boolean") {
    throw new ProtocolAdapterError({ code: "invalid-parameter", field: "stream", message: "stream 必须是布尔值" });
  }
  const temperature = optionalNumber(source.temperature, "temperature");
  const maxOutputTokens = protocol === "responses"
    ? optionalNumber(source.max_output_tokens, "max_output_tokens")
    : optionalNumber(source.max_tokens, "max_tokens");

  return {
    protocol,
    model,
    stream,
    input: source.input,
    messages: Array.isArray(source.messages) ? source.messages : undefined,
    instructions: stringValue(source.instructions),
    system: source.system,
    temperature,
    maxOutputTokens,
    tools: Array.isArray(source.tools) ? source.tools : undefined,
    toolChoice: source.tool_choice,
    responseFormat: source.response_format,
    metadata: source.metadata,
    previousResponseId: stringValue(source.previous_response_id),
  };
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function positiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!positiveNumber(value)) {
    throw new ProtocolAdapterError({ code: "invalid-parameter", field, message: `${field} 必须是正数` });
  }
  return value;
}
