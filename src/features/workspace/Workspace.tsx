import { useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleUserRound,
  CloudCog,
  Code2,
  Database,
  KeyRound,
  Network,
  PlugZap,
  ReceiptText,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquareTerminal,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { getAccessFlow, type WorkspaceSection } from "../../domain/accessPolicy";
import type { CatalogSelection } from "../../domain/catalog";
import type { ActiveRoute, UsageEvent } from "../../domain/demoPlatform";
import type { ByokProvider, MigrationOutcome, MigrationTarget } from "../../domain/portableWorkspace";
import type { DemoPlatformController } from "./useDemoPlatform";
import { useDemoPortableWorkspace, type DemoPortableWorkspaceController } from "./useDemoPortableWorkspace";
import "./workspace.css";

const NAV: { id: WorkspaceSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "总览", icon: Activity },
  { id: "routing", label: "模型切换", icon: Network },
  { id: "sources", label: "模型来源", icon: KeyRound },
  { id: "deployments", label: "我的模型", icon: CloudCog },
  { id: "environment", label: "AI 配置与迁移", icon: Sparkles },
  { id: "billing", label: "费用", icon: ReceiptText },
  { id: "account", label: "账户", icon: CircleUserRound },
];

export function Workspace({
  section,
  pendingSelection,
  platform,
  onActivateSelection,
  onNavigate,
  onBrowseModels,
}: {
  section: WorkspaceSection;
  pendingSelection: CatalogSelection | null;
  platform: DemoPlatformController;
  onActivateSelection: (selection: CatalogSelection) => Promise<void>;
  onNavigate: (section: WorkspaceSection) => void;
  onBrowseModels: () => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const portableWorkspace = useDemoPortableWorkspace();

  function act(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1800);
  }

  return (
    <main className="workspace-page">
      <aside className="workspace-sidebar">
        <div className="workspace-label">
          <strong>个人空间</strong>
        </div>
        <nav aria-label="工作台子导航">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" data-active={section === id} onClick={() => onNavigate(id)}>
              <Icon size={15} />
              <span>{label}</span>
              {id === "environment" && <small>2</small>}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span><i /> 一键切换已就绪</span>
          <small>Moyusi Desktop · 本机</small>
        </div>
      </aside>

      <section className="workspace-content">
        {pendingSelection && <PendingSelection selection={pendingSelection} onActivate={onActivateSelection} onAction={act} />}
        {section === "overview" && <Overview activeRoute={platform.state.activeRoute} periodCost={platform.billing.periodCostCny} requestCount={platform.billing.requestCount} onNavigate={onNavigate} />}
        {section === "routing" && <Routing activeRoute={platform.state.activeRoute} previousRoute={platform.state.previousRoute} onBrowseModels={onBrowseModels} onSimulateCall={platform.simulateCall} onRestore={platform.restore} onAction={act} />}
        {section === "sources" && <Sources workspace={portableWorkspace} onAction={act} />}
        {section === "deployments" && <Deployments onBrowseModels={onBrowseModels} onAction={act} />}
        {section === "environment" && <Environment workspace={portableWorkspace} onAction={act} />}
        {section === "billing" && <Billing events={platform.state.usageEvents} billing={platform.billing} onAction={act} />}
        {section === "account" && <Account onAction={act} />}
      </section>

      {notice && <div className="workspace-toast" role="status"><Check size={14} />{notice}</div>}
    </main>
  );
}

function PendingSelection({ selection, onActivate, onAction }: { selection: CatalogSelection; onActivate: (selection: CatalogSelection) => Promise<void>; onAction: (message: string) => void }) {
  const flow = getAccessFlow(selection.source.mode);
  const [working, setWorking] = useState(false);
  const actionLabel = flow.actionKind === "credential" ? "连接并使用" : flow.actionKind === "endpoint" ? "连接并使用" : flow.actionKind === "budget" ? "查看费用" : "一键切换";

  async function handleAction() {
    if (flow.actionKind !== "route") {
      onAction(`${actionLabel}流程将在下一条开发切片接入，目前未执行真实操作`);
      return;
    }
    setWorking(true);
    try {
      await onActivate(selection);
      onAction(`${selection.offer.name} 已切换成功，原配置可恢复`);
    } catch {
      onAction("切换没有完成，原配置未改变，请重试");
      setWorking(false);
    }
  }

  return (
    <div className="pending-offer" role="status">
      <span className="pending-icon"><Box size={17} /></span>
      <div>
        <strong>{selection.offer.name} · {selection.source.name}</strong>
        <p>{selection.source.mode} · {selection.source.price} · {selection.source.latency} · 已保留你的选择</p>
      </div>
      <button type="button" disabled={working} onClick={handleAction}>{working ? "正在检查并切换…" : actionLabel}</button>
    </div>
  );
}

function PageHead({ title, description, action }: { kicker: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="workspace-page-head">
      <div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </header>
  );
}

function Overview({ activeRoute, periodCost, requestCount, onNavigate }: { activeRoute: ActiveRoute; periodCost: number; requestCount: number; onNavigate: (section: WorkspaceSection) => void }) {
  const activeTool = toolLabel(activeRoute);
  return (
    <>
      <PageHead kicker="CONTROL PLANE" title="工作台" description="模型切换、AI 配置和费用都在这里。今天有 2 项需要确认。" action={<span className="workspace-ready"><i /> 运行正常</span>} />
      <div className="workspace-stats">
        <Metric label="本期费用" value={`¥ ${periodCost.toFixed(2)}`} note="含本机演示调用" />
        <Metric label="今日请求" value={String(requestCount)} note="含本机演示调用" />
        <Metric label="活动模型" value="4" note="2 闭源 · 2 开放" />
        <Metric label="已连接工具" value="2" note="Codex · Claude Code" />
      </div>

      <div className="overview-grid">
        <Panel className="active-route-panel">
          <PanelHead eyebrow="ACTIVE ROUTE" title={`${activeTool} · 当前使用`} action={<button type="button" onClick={() => onNavigate("routing")}>切换模型 <ChevronRight size={13} /></button>} />
          <div className="route-path">
            <RouteNode icon={Code2} label={activeTool} detail="当前使用场景" />
            <ArrowRight size={16} />
            <RouteNode icon={Network} label="自动选择" detail="故障时切换" />
            <ArrowRight size={16} />
            <RouteNode icon={Server} label={activeRoute.modelName} detail={activeRoute.sourceName} active />
          </div>
          <div className="route-meta"><span><i /> 当前来源 {activeRoute.health}</span><span>响应 / 排队 {activeRoute.latency}</span><span>本机演示状态</span></div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="WORKSPACE PROFILE" title="我的 AI 配置 · 日常编程" action={<button type="button" onClick={() => onNavigate("environment")}>管理与迁移 <ChevronRight size={13} /></button>} />
          <div className="asset-counts">
            <AssetCount icon={PlugZap} label="MCP 工具" value="4" />
            <AssetCount icon={Wrench} label="Skills 技能" value="6" />
            <AssetCount icon={SquareTerminal} label="Prompts 提示词" value="3" />
            <AssetCount icon={BookOpen} label="记忆与知识库" value="20" />
          </div>
          <div className="sync-summary"><span>Codex</span><strong><i />已同步</strong><span>Claude Code</span><strong className="warn">2 项待确认</strong></div>
        </Panel>
      </div>

      <Panel className="attention-panel">
        <PanelHead eyebrow="NEEDS ATTENTION" title="需要处理" />
        <Attention icon={AlertCircle} title="Claude Code 迁移需要确认 2 项" description="一个提示词会自动转换，一个 MCP 工具需要重新授权。" action="继续迁移" onClick={() => onNavigate("environment")} />
        <Attention icon={Wallet} title="供应商 BYOK 余额未同步" description="费用显示为本地估算，不会从 Moyusi 余额扣除。" action="查看来源" onClick={() => onNavigate("sources")} />
      </Panel>
    </>
  );
}

function Routing({ activeRoute, previousRoute, onBrowseModels, onSimulateCall, onRestore, onAction }: { activeRoute: ActiveRoute; previousRoute: ActiveRoute | null; onBrowseModels: () => void; onSimulateCall: () => Promise<UsageEvent>; onRestore: () => void; onAction: (message: string) => void }) {
  const [testing, setTesting] = useState(false);
  const fallbacks = [
    { name: "GPT · Coding", meta: "统一余额 · 稳定来源", health: "99.95%" },
    { name: "Claude Sonnet", meta: "统一余额 · 同任务备用", health: "99.92%" },
    { name: "Qwen Coder", meta: "共享算力 · 开放权重", health: "99.76%" },
  ].filter((route) => route.name !== activeRoute.modelName).slice(0, 2);

  async function simulate() {
    setTesting(true);
    try {
      const event = await onSimulateCall();
      onAction(`${event.modelName} 调用成功 · ${event.costLabel}，已写入费用记录`);
    } catch {
      onAction("模拟调用失败，没有生成费用记录");
    } finally {
      setTesting(false);
    }
  }

  function restore() {
    if (!previousRoute) return;
    const previousName = previousRoute.modelName;
    onRestore();
    onAction(`已恢复 ${previousName}`);
  }

  return (
    <>
      <PageHead kicker="ROUTING" title="模型切换" description="选择使用场景和模型来源。切换前会先检查可用性，并保留原配置用于恢复。" action={<button className="button button-primary compact-button" type="button" onClick={onBrowseModels}>从广场选择模型</button>} />
      <Panel>
        <PanelHead eyebrow="PROVIDER PROFILE" title={`${toolLabel(activeRoute)} · 当前模型`} action={<span className="inline-status"><i />正在使用</span>} />
        <div className="route-order">
          <RouteOrder index="01" name={activeRoute.modelName} meta={`${activeRoute.sourceMode} · ${activeRoute.sourceName}`} health={activeRoute.health} />
          {fallbacks.map((route, index) => <RouteOrder key={route.name} index={`0${index + 2}`} name={route.name} meta={route.meta} health={route.health} />)}
        </div>
        <div className="panel-footer route-actions"><span>当前来源不可用时，自动尝试下面的备用来源</span><div>{previousRoute && <button type="button" onClick={restore}>恢复 {previousRoute.modelName}</button>}<button className="test-call-button" type="button" disabled={testing} onClick={simulate}>{testing ? "正在调用…" : "模拟调用"}</button></div></div>
      </Panel>
      <details className="workspace-advanced">
        <summary>高级设置</summary>
        <div className="two-column-panels">
          <Panel><PanelHead eyebrow="LOCAL ROUTER" title="本地连接" /><SettingRow label="监听地址" value="127.0.0.1:16888" /><SettingRow label="可用性检查" value="每 30 秒" /><SettingRow label="修改保护" value="自动备份，可恢复" /></Panel>
          <Panel><PanelHead eyebrow="POLICY" title="数据与切换规则" /><SettingRow label="优先地区" value="亚太" /><SettingRow label="保存请求正文" value="不保存" /><SettingRow label="切换到不同型号" value="不允许" /></Panel>
        </div>
      </details>
    </>
  );
}

function Sources({ workspace, onAction }: { workspace: DemoPortableWorkspaceController; onAction: (message: string) => void }) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [provider, setProvider] = useState<ByokProvider>("OpenRouter");
  const [connecting, setConnecting] = useState(false);

  async function connect() {
    setConnecting(true);
    try {
      const connection = await workspace.connectByok(provider);
      setConnectOpen(false);
      onAction(`${connection.provider} 已完成本机授权，Moyusi 只收到绑定状态`);
    } catch {
      onAction("本机授权没有完成，原有来源未改变");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      <PageHead kicker="API & SOURCES" title="模型来源" description="管理 Moyusi 余额来源和你自己的模型账号。自己的密钥只保存在本机，费用由对应平台收取。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("调用密钥创建流程已打开；完整值只显示一次")}>创建调用密钥</button>} />
      <div className="source-grid">
        <Panel><PanelHead eyebrow="MOYUSI KEY" title="Moyusi 调用密钥" action={<span className="inline-status"><i />正常</span>} /><div className="key-display"><KeyRound size={17} /><code>moy_••••••••92F1</code><span>今天使用</span></div><SettingRow label="可用模型" value="4 个" /><SettingRow label="每月限额" value="¥ 120.00" /><SettingRow label="有效期" value="长期" /><div className="panel-footer"><span>完整密钥不会再次显示</span><button type="button" onClick={() => onAction("密钥更换流程已准备")}>更换</button></div></Panel>
        <Panel><PanelHead eyebrow="LOCAL BYOK" title="我的模型账号" /><div className="source-list">{workspace.state.connections.map((connection) => <SourceRow key={connection.id} name={connection.provider} meta={connection.scope} status={connection.state === "bound" ? "已连接" : "待授权"} />)}</div><button className="source-add" type="button" onClick={() => setConnectOpen(true)}>连接新的模型账号 <ChevronRight size={13} /></button></Panel>
      </div>
      <div className="security-note"><ShieldCheck size={17} /><div><strong>密钥不会跟随 AI 配置迁移</strong><p>切换设备或软件时只迁移非敏感设置；模型账号需要在新设备上重新确认。</p></div></div>
      {connectOpen && <ByokDialog provider={provider} connecting={connecting} onProviderChange={setProvider} onClose={() => setConnectOpen(false)} onConnect={connect} />}
    </>
  );
}

function ByokDialog({ provider, connecting, onProviderChange, onClose, onConnect }: { provider: ByokProvider; connecting: boolean; onProviderChange: (provider: ByokProvider) => void; onClose: () => void; onConnect: () => void }) {
  return (
    <div className="access-dialog-backdrop" role="presentation">
      <section className="access-dialog byok-dialog" role="dialog" aria-modal="true" aria-labelledby="byok-dialog-title">
        <header><div><span className="access-flow-icon"><KeyRound size={17} /></span><div><h2 id="byok-dialog-title">在本机绑定模型账号</h2><p>网页只发出一次性授权，密钥不会进入 Moyusi 或迁移包。</p></div></div><button type="button" aria-label="关闭" onClick={onClose}><X size={15} /></button></header>
        <label className="byok-provider-field"><span>选择模型平台</span><select value={provider} onChange={(event) => onProviderChange(event.target.value as ByokProvider)} disabled={connecting}><option>Google AI</option><option>OpenRouter</option><option>Anthropic</option><option>OpenAI</option></select></label>
        <div className="byok-steps"><span><b>01</b>生成一次性授权</span><span><b>02</b>由 Moyusi Desktop 领取</span><span><b>03</b>仅返回已绑定状态</span></div>
        <div className="access-status"><ShieldCheck size={14} /><div><strong>演示模式：不会写入真实密钥</strong><p>完成后来源会显示为“已连接”，费用仍由所选平台直接结算。</p></div></div>
        <footer><button type="button" onClick={onClose}>取消</button><button className="button button-primary" type="button" disabled={connecting} onClick={onConnect}>{connecting ? "正在授权…" : "模拟完成本机授权"}<ChevronRight size={13} /></button></footer>
      </section>
    </div>
  );
}

function Deployments({ onBrowseModels, onAction }: { onBrowseModels: () => void; onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="MODELS & DEPLOYMENTS" title="我的模型" description="查看已经使用的开放模型、专属服务器和自己的服务器。成本与运行状态分开显示。" action={<button className="button button-primary compact-button" type="button" onClick={onBrowseModels}>添加开放模型</button>} />
      <div className="deployment-list">
        <Deployment icon={Server} name="Qwen Coder" type="共享端点" state="WARM" details={["FP8 · vLLM", "新加坡", "¥ 0.86 / M 起"]} action="查看" onClick={() => onAction("共享端点详情已打开")} />
        <Deployment icon={CloudCog} name="DeepSeek Reasoning" type="弹性共享" state="COLD" details={["BF16 · SGLang", "东京", "冷启动约 28 秒"]} action="启动" onClick={() => onAction("启动请求已进入演示队列")} />
        <Deployment icon={Database} name="Private Endpoint" type="用户自有端点" state="HEALTHY" details={["OpenAI-compatible", "私有网络", "外部计费"]} action="测试" onClick={() => onAction("端点协议与能力测试通过")} />
      </div>
      <details className="workspace-advanced"><summary>开发者信息</summary><Panel className="deployment-boundary"><PanelHead eyebrow="SERVING IDENTITY" title="模型版本可追溯" /><div className="identity-code"><code>repo + revision + weights digest + quantization + engine/version</code><p>不同量化、模板或引擎参数不会被静默视为完全相同的模型来源。</p></div></Panel></details>
    </>
  );
}

function Environment({ workspace, onAction }: { workspace: DemoPortableWorkspaceController; onAction: (message: string) => void }) {
  const [profile, setProfile] = useState<"daily" | "team">("daily");
  const [working, setWorking] = useState(false);
  const target: MigrationTarget = profile === "daily" ? "Claude Code" : "Codex";
  const report = workspace.state.latestMigration?.target === target ? workspace.state.latestMigration : null;
  const migrationRows = report?.items ?? [
    { name: "code-review Skill", outcome: "exact" as const, detail: "内容摘要一致" },
    { name: "release Prompt", outcome: "adapted" as const, detail: "developer role 转为目标指令层" },
    { name: "GitHub MCP", outcome: "needs_confirm" as const, detail: "目标软件需要重新授权 repo scope" },
    { name: "会话检查点", outcome: "rebuilt" as const, detail: "新会话继续，不恢复厂商运行时" },
  ];

  async function migrate() {
    setWorking(true);
    try {
      if (!report || report.state === "applied") {
        await workspace.previewMigration(target);
        onAction(`${target} 的迁移差异已生成，请确认后应用`);
      } else {
        const applied = await workspace.applyMigration(target);
        onAction(applied ? `${target} 的非敏感配置已应用，本机密钥仍需重新授权` : "迁移预览已过期，请重新生成");
      }
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <PageHead kicker="PORTABLE WORKSPACE" title="AI 配置与迁移" description="统一管理 MCP 工具、Skills 技能、Prompts 提示词、记忆和知识库，并一键迁移到其他 AI 软件。" action={<button className="button button-primary compact-button" type="button" disabled={working} onClick={migrate}>{working ? "正在检查…" : !report || report.state === "applied" ? "生成迁移预览" : "确认并应用"}</button>} />
      <div className="profile-switcher">
        <button type="button" data-active={profile === "daily"} onClick={() => setProfile("daily")}><span>日常编程</span><small>v12 · 2 个目标</small></button>
        <button type="button" data-active={profile === "team"} onClick={() => setProfile("team")}><span>团队工程</span><small>v4 · 1 个目标</small></button>
      </div>
      <div className="environment-grid">
        <Panel>
          <PanelHead eyebrow="ASSETS" title={profile === "daily" ? "日常编程 · v12" : "团队工程 · v4"} />
          <div className="asset-list">
            <AssetRow icon={PlugZap} name="MCP 工具" value={profile === "daily" ? "4 个服务" : "6 个服务"} note="迁移时会重新确认权限" />
            <AssetRow icon={Wrench} name="Skills 技能" value={profile === "daily" ? "6 个技能" : "9 个技能"} note="脚本已完成安全检查" />
            <AssetRow icon={SquareTerminal} name="Prompts 提示词" value="3 个模板" note="自动适配目标软件" />
            <AssetRow icon={BookOpen} name="会话记忆与知识库" value="18 条 + 2 个库" note="保留来源和访问权限" />
          </div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="TARGETS" title="目标软件" />
          <MigrationTarget name="Codex" version="本机" exact="11" adapted="2" unsupported="0" status={target === "Codex" && report?.state === "applied" ? "已应用" : "可预览"} />
          <MigrationTarget name="Claude Code" version="本机" exact="9" adapted="3" unsupported="1" status={target === "Claude Code" && report?.state === "applied" ? "已应用" : "可预览"} />
          <div className="panel-footer"><span>账号密钥不会被迁移</span><button type="button" onClick={migrate}>{report && report.state === "preview" ? "查看迁移差异" : "生成迁移差异"}</button></div>
        </Panel>
      </div>
      <Panel className="migration-report">
        <PanelHead eyebrow="LATEST MIGRATION" title={report ? `${report.target} · 迁移报告` : "迁移报告"} action={<span>{report ? (report.state === "applied" ? "已应用" : "待确认") : "尚未生成"}</span>} />
        <div className="migration-table-head"><span>资产</span><span>结果</span><span>说明</span></div>
        {migrationRows.map((item) => <MigrationRow key={item.name} name={item.name} result={migrationOutcomeLabel(item.outcome)} detail={item.detail} warn={item.outcome === "needs_confirm"} />)}
      </Panel>
    </>
  );
}

function Billing({ events, billing, onAction }: { events: UsageEvent[]; billing: DemoPlatformController["billing"]; onAction: (message: string) => void }) {
  const bars = [24, 38, 31, 52, 45, 67, 58, 76, 62, 88, 71, 82, 64, 91];
  return (
    <>
      <PageHead kicker="USAGE & BILLING" title="费用" description="Moyusi 余额和其他平台直接收取的费用分开显示，每笔费用都能查到模型与来源。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("充值流程仅作预览，未发起真实支付")}>充值</button>} />
      <div className="workspace-stats"><Metric label="可用余额" value={`¥ ${billing.availableBalanceCny.toFixed(2)}`} note="统一余额" /><Metric label="本期费用" value={`¥ ${billing.periodCostCny.toFixed(2)}`} note="含本机演示调用" /><Metric label="外部估算" value={`¥ ${billing.externalEstimateCny.toFixed(2)}`} note="BYOK 不代扣" /><Metric label="今日请求" value={String(billing.requestCount)} note="含本机演示调用" /></div>
      <Panel className="usage-panel"><PanelHead eyebrow="14 DAYS" title="每日费用" action={<strong>¥ {billing.periodCostCny.toFixed(2)}</strong>} /><div className="usage-bars">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} title={`第 ${index + 1} 天`} />)}</div></Panel>
      <Panel><PanelHead eyebrow="RECENT REQUESTS" title={events.length ? "最近请求 · 本机演示" : "最近请求"} /><div className="usage-row usage-row-head"><span>请求</span><span>模型 / 来源</span><span>用量</span><span>响应 / 排队</span><span>费用</span></div>{events.map((event) => <UsageRow key={event.id} id={event.id} model={event.modelName} route={`${event.sourceName} · ${event.sourceMode}`} tokens={event.usage} latency={event.latency} cost={event.costLabel} />)}<UsageRow id="req_8FK2" model="GPT · Coding" route="稳定 · 统一余额" tokens="18.4K" latency="2.7s" cost="¥ 0.18" /><UsageRow id="req_7QD9" model="Qwen Coder" route="共享算力 · FP8" tokens="32.1K" latency="3.1s" cost="¥ 0.07" /><UsageRow id="req_6MV4" model="Gemini Flash" route="BYOK · 外部" tokens="9.2K" latency="1.8s" cost="估算 ¥ 0.04" /></Panel>
    </>
  );
}

function Account({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="ACCOUNT" title="账户" description="登录、安全、设备、会话、通知与隐私都归入工作台，不再设置新的一级页面。" />
      <div className="two-column-panels">
        <Panel><PanelHead eyebrow="SECURITY" title="登录与安全" /><SettingRow label="邮箱" value="user@example.com" /><SettingRow label="多因素认证" value="未启用" /><SettingRow label="活跃会话" value="2 个" /><div className="panel-footer"><span>最近登录：上海 · 今天</span><button type="button" onClick={() => onAction("安全设置已打开")}>管理</button></div></Panel>
        <Panel><PanelHead eyebrow="DEVICES" title="设备" /><SourceRow name="MacBook Pro" meta="macOS · Desktop 0.1" status="当前设备" /><SourceRow name="Workstation" meta="Windows · 2 天前在线" status="已连接" /><button className="source-add" type="button" onClick={() => onAction("设备连接码已生成")}>连接新设备 <ChevronRight size={13} /></button></Panel>
      </div>
      <Panel><PanelHead eyebrow="DATA & PRIVACY" title="数据与隐私" /><SettingRow label="保存请求正文" value="默认不保存" /><SettingRow label="AI 配置同步" value="只同步非敏感内容" /><SettingRow label="自动生成记忆" value="关闭" /><SettingRow label="导出" value="不包含账号密钥" /></Panel>
    </>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) { return <section className={`workspace-panel ${className}`.trim()}>{children}</section>; }
function PanelHead({ title, action }: { eyebrow: string; title: string; action?: ReactNode }) { return <div className="panel-head"><div><h2>{title}</h2></div>{action}</div>; }
function Metric({ label, value, note }: { label: string; value: string; note: string }) { return <div className="workspace-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function RouteNode({ icon: Icon, label, detail, active = false }: { icon: LucideIcon; label: string; detail: string; active?: boolean }) { return <div className="route-node" data-active={active}><Icon size={17} /><div><strong>{label}</strong><span>{detail}</span></div></div>; }
function AssetCount({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <div><Icon size={15} /><span>{label}</span><strong>{value}</strong></div>; }
function Attention({ icon: Icon, title, description, action, onClick }: { icon: LucideIcon; title: string; description: string; action: string; onClick: () => void }) { return <div className="attention-row"><Icon size={17} /><div><strong>{title}</strong><p>{description}</p></div><button type="button" onClick={onClick}>{action}<ChevronRight size={13} /></button></div>; }
function RouteOrder({ index, name, meta, health }: { index: string; name: string; meta: string; health: string }) { return <div className="route-order-row"><span className="route-index">{index}</span><div><strong>{name}</strong><small>{meta}</small></div><span className="route-health"><i />{health}</span><Settings2 size={14} /></div>; }
function SettingRow({ label, value }: { label: string; value: string }) { return <div className="setting-row"><span>{label}</span><strong>{value}</strong></div>; }
function SourceRow({ name, meta, status }: { name: string; meta: string; status: string }) { return <div className="source-row"><span className="source-icon"><PlugZap size={15} /></span><div><strong>{name}</strong><small>{meta}</small></div><span>{status}</span></div>; }
function Deployment({ icon: Icon, name, type, state, details, action, onClick }: { icon: LucideIcon; name: string; type: string; state: string; details: string[]; action: string; onClick: () => void }) { return <article className="deployment-row"><span className="deployment-icon"><Icon size={18} /></span><div><strong>{name}</strong><small>{type}</small></div><span className="deployment-state"><i />{state}</span>{details.map((detail) => <span key={detail}>{detail}</span>)}<button type="button" onClick={onClick}>{action}</button></article>; }
function AssetRow({ icon: Icon, name, value, note }: { icon: LucideIcon; name: string; value: string; note: string }) { return <div className="asset-row"><span><Icon size={16} /></span><div><strong>{name}</strong><small>{note}</small></div><b>{value}</b><ChevronRight size={13} /></div>; }
function MigrationTarget({ name, version, exact, adapted, unsupported, status }: { name: string; version: string; exact: string; adapted: string; unsupported: string; status: string }) { return <div className="migration-target"><div><strong>{name}</strong><small>{version}</small></div><dl><div><dt>原样</dt><dd>{exact}</dd></div><div><dt>转换</dt><dd>{adapted}</dd></div><div><dt>不支持</dt><dd>{unsupported}</dd></div></dl><span>{status}</span></div>; }
function MigrationRow({ name, result, detail, warn = false }: { name: string; result: string; detail: string; warn?: boolean }) { return <div className="migration-row"><strong>{name}</strong><span data-warn={warn}>{result}</span><p>{detail}</p></div>; }
function UsageRow({ id, model, route, tokens, latency, cost }: { id: string; model: string; route: string; tokens: string; latency: string; cost: string }) { return <div className="usage-row"><code>{id}</code><div><strong>{model}</strong><small>{route}</small></div><code>{tokens}</code><code>{latency}</code><code>{cost}</code></div>; }
function toolLabel(route: ActiveRoute): string { return route.modality === "语言" ? "Codex" : route.modality === "图片" ? "图像工作流" : "视频工作流"; }
function migrationOutcomeLabel(outcome: MigrationOutcome): string { return outcome === "exact" ? "原样" : outcome === "adapted" ? "已转换" : outcome === "rebuilt" ? "已重建" : "待确认"; }
