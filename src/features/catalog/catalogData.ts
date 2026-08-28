export type ModelKind = "闭源 API" | "开放权重";
export type OfferType = "统一余额" | "BYOK" | "共享算力" | "自有端点";

export type ModelOffer = {
  id: string;
  name: string;
  family: string;
  summary: string;
  kind: ModelKind;
  offerType: OfferType;
  tags: string[];
  context: string;
  price: string;
  unit: string;
  route: string;
  health: string;
  meta: string;
};

export const MODEL_OFFERS: ModelOffer[] = [
  {
    id: "claude-sonnet",
    name: "Claude Sonnet",
    family: "Anthropic",
    summary: "复杂代码、长上下文与代理任务",
    kind: "闭源 API",
    offerType: "统一余额",
    tags: ["代码", "工具调用", "长文本"],
    context: "200K",
    price: "¥ 12.00",
    unit: "每百万输入 Token 起",
    route: "稳定路由 · 亚太",
    health: "99.92%",
    meta: "3 条可用线路",
  },
  {
    id: "gpt-coding",
    name: "GPT · Coding",
    family: "OpenAI",
    summary: "工程实现、代码审查与多步骤工作",
    kind: "闭源 API",
    offerType: "统一余额",
    tags: ["代码", "推理", "Responses"],
    context: "400K",
    price: "¥ 8.20",
    unit: "每百万输入 Token 起",
    route: "稳定路由 · 全球",
    health: "99.95%",
    meta: "2 条可用线路",
  },
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    family: "Google",
    summary: "快速分析、长文档与低延迟调用",
    kind: "闭源 API",
    offerType: "BYOK",
    tags: ["低延迟", "长文本", "多模态"],
    context: "1M",
    price: "外部计费",
    unit: "使用你的供应商账户",
    route: "本地直连",
    health: "99.81%",
    meta: "已验证适配",
  },
  {
    id: "qwen-coder-open",
    name: "Qwen Coder",
    family: "Qwen",
    summary: "中文编程、仓库理解与工具调用",
    kind: "开放权重",
    offerType: "共享算力",
    tags: ["代码", "中文", "可部署"],
    context: "128K",
    price: "¥ 0.86",
    unit: "每百万输入 Token 起",
    route: "FP8 · vLLM · 新加坡",
    health: "99.76%",
    meta: "热实例",
  },
  {
    id: "deepseek-reasoning-open",
    name: "DeepSeek Reasoning",
    family: "DeepSeek",
    summary: "深度推理、规划和高性价比任务",
    kind: "开放权重",
    offerType: "共享算力",
    tags: ["推理", "可部署", "低成本"],
    context: "128K",
    price: "¥ 1.10",
    unit: "每百万输入 Token 起",
    route: "BF16 · SGLang · 东京",
    health: "99.68%",
    meta: "冷启动约 28 秒",
  },
  {
    id: "private-open-endpoint",
    name: "连接你的开放模型",
    family: "Self-hosted",
    summary: "接入现有 vLLM、SGLang 或兼容端点",
    kind: "开放权重",
    offerType: "自有端点",
    tags: ["私有", "BYOC", "本地优先"],
    context: "由端点决定",
    price: "算力方计费",
    unit: "Moyusi 不代扣推理费",
    route: "Secret 仅本地绑定",
    health: "待探测",
    meta: "支持 OpenAI-compatible",
  },
];
