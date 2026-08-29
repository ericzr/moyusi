import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  ChevronRight,
  CircleUserRound,
  ChartNoAxesCombined,
  CloudCog,
  Code2,
  Database,
  KeyRound,
  Network,
  MessageSquare,
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
import type { ActiveRoute, DesktopConnection, RoutePolicy, RouteStrategy, UsageEvent } from "../../domain/demoPlatform";
import type { ByokProvider, MigrationOutcome, MigrationTarget } from "../../domain/portableWorkspace";
import { providerModeLabel, providerStatusLabel, providerStatusTone, type ProviderProfile, type ProviderSource } from "../../domain/provider";
import { catalogRepository } from "../../services/catalogRepository";
import { controlPlaneRepository } from "../../services/controlPlaneRepository";
import { workspaceRepository } from "../../services/workspaceRepository";
import type { DemoPlatformController } from "./useDemoPlatform";
import { useDemoPortableWorkspace, type DemoPortableWorkspaceController } from "./useDemoPortableWorkspace";
import { useWorkspaceSummary } from "./useWorkspaceSummary";
import "./workspace.css";

const NAV_GROUPS: { label: string; items: { id: WorkspaceSection; label: string; icon: LucideIcon; count?: string }[] }[] = [
  { label: "开始", items: [
    { id: "overview", label: "总览", icon: Activity },
    { id: "routing", label: "模型切换", icon: Network },
  ] },
  { label: "接入", items: [
    { id: "sources", label: "来源与凭证", icon: KeyRound },
    { id: "deployments", label: "模型与部署", icon: CloudCog },
    { id: "tools", label: "工具与设备", icon: SquareTerminal },
  ] },
  { label: "工作环境", items: [
    { id: "environment", label: "配置与迁移", icon: Sparkles, count: "2" },
    { id: "sessions", label: "会话", icon: MessageSquare },
  ] },
  { label: "费用", items: [
    { id: "usage", label: "用量与请求", icon: ChartNoAxesCombined },
    { id: "billing", label: "余额与账单", icon: ReceiptText },
  ] },
  { label: "设置", items: [
    { id: "settings", label: "账户与偏好", icon: CircleUserRound },
  ] },
];

export function Workspace({
  section,
  pendingSelection,
  platform,
  onActivateSelection,
  onClearPendingSelection,
  onNavigate,
  onBrowseModels,
}: {
  section: WorkspaceSection;
  pendingSelection: CatalogSelection | null;
  platform: DemoPlatformController;
  onActivateSelection: (selection: CatalogSelection) => Promise<void>;
  onClearPendingSelection: () => void;
  onNavigate: (section: WorkspaceSection) => void;
  onBrowseModels: () => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProviderProfile[]>(readProviderProfiles);
  const [provisioningDeployment, setProvisioningDeployment] = useState<{ selection: CatalogSelection; budgetLimitCny: number } | null>(null);
  const portableWorkspace = useDemoPortableWorkspace();
  const summaryResource = useWorkspaceSummary(platform.state);
  const summary = summaryResource.data;
  const desktop = summary?.desktop ?? platform.state.desktop;

  function act(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? null : current)), 1800);
  }

  useEffect(() => {
    try {
      window.localStorage.setItem("moyusi-provider-profiles-v1", JSON.stringify(profiles));
    } catch {
      // The preview remains usable when storage is unavailable.
    }
  }, [profiles]);

  function updateProfile(profile: ProviderProfile) {
    setProfiles((current) => current.map((item) => item.id === profile.id ? profile : item));
  }

  return (
    <main className="workspace-page">
      <aside className="workspace-sidebar">
        <div className="workspace-label">
          <strong>个人空间</strong>
        </div>
        <nav aria-label="工作台子导航">
          {NAV_GROUPS.map((group) => (
            <div className="workspace-nav-group" key={group.label}>
              <span className="workspace-nav-heading">{group.label}</span>
              {group.items.map(({ id, label, icon: Icon, count }) => (
                <button key={id} type="button" data-active={section === id} onClick={() => onNavigate(id)}>
                  <Icon size={15} />
                  <span>{label}</span>
                  {count && <small>{count}</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span><i data-state={desktop.status} /> {summaryResource.status === "loading" ? "正在同步工作台" : summaryResource.status === "error" ? "工作台数据需刷新" : desktopStatusLabel(desktop)}</span>
          <small>{summary ? `${summary.activeTools.length} 个工具已连接 · ${desktop.name}` : `${desktop.name} · 本机`}</small>
        </div>
      </aside>

      <section className="workspace-content">
        {pendingSelection && <PendingSelection selection={pendingSelection} desktop={desktop} onActivate={onActivateSelection} onProvision={(selection, budgetLimitCny) => { setProvisioningDeployment({ selection, budgetLimitCny }); onClearPendingSelection(); }} onAction={act} />}
        {section === "overview" && <Overview activeRoute={platform.state.activeRoute} periodCost={platform.billing.periodCostCny} requestCount={platform.billing.requestCount} routePolicy={platform.state.routePolicy} connectedTools={summary?.activeTools ?? platform.state.connectedTools} pendingAttention={summary?.pendingAttention ?? 2} desktop={desktop} onNavigate={onNavigate} onSimulateCall={platform.simulateCall} onAction={act} />}
        {section === "routing" && <Routing activeRoute={platform.state.activeRoute} previousRoute={platform.state.previousRoute} routePolicy={platform.state.routePolicy} desktop={desktop} onBrowseModels={onBrowseModels} onSimulateCall={platform.simulateCall} onRestore={platform.restore} onUpdatePolicy={platform.updateRoutePolicy} onAction={act} />}
        {section === "sources" && <Sources workspace={portableWorkspace} profiles={profiles} onUpdateProfile={updateProfile} onAction={act} />}
        {section === "deployments" && <Deployments provisioning={provisioningDeployment} onBrowseModels={onBrowseModels} onAction={act} />}
        {section === "tools" && <Tools desktop={desktop} connectedTools={summary?.activeTools ?? platform.state.connectedTools} onAction={act} />}
        {section === "environment" && <Environment workspace={portableWorkspace} onAction={act} />}
        {section === "sessions" && <Sessions onAction={act} />}
        {section === "usage" && <Usage events={platform.state.usageEvents} billing={platform.billing} onAction={act} />}
        {section === "billing" && <Billing events={platform.state.usageEvents} billing={platform.billing} onAction={act} />}
        {section === "settings" && <Account onAction={act} />}
      </section>

      {notice && <div className="workspace-toast" role="status"><Check size={14} />{notice}</div>}
    </main>
  );
}

function PendingSelection({ selection, desktop, onActivate, onProvision, onAction }: { selection: CatalogSelection; desktop: DesktopConnection; onActivate: (selection: CatalogSelection) => Promise<void>; onProvision: (selection: CatalogSelection, budgetLimitCny: number) => void; onAction: (message: string) => void }) {
  const flow = getAccessFlow(selection.source.mode);
  const [working, setWorking] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const actionLabel = flow.actionKind === "credential" ? "连接并使用" : flow.actionKind === "endpoint" ? "连接并使用" : flow.actionKind === "budget" ? "查看费用" : "一键切换";

  async function handleAction() {
    if (flow.actionKind !== "route") {
      setSetupOpen(true);
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
    <>
      <div className="pending-offer" role="status">
        <span className="pending-icon"><Box size={17} /></span>
        <div>
          <strong>{selection.offer.name} · {selection.source.name}</strong>
          <p>{selection.source.mode} · {selection.source.price} · {selection.source.latency} · 已保留你的选择</p>
        </div>
        <button type="button" disabled={working} onClick={handleAction}>{working ? "正在检查并切换…" : actionLabel}</button>
      </div>
      {setupOpen && <AccessSetupDialog selection={selection} desktop={desktop} onClose={() => setSetupOpen(false)} onActivate={onActivate} onProvision={onProvision} onAction={onAction} />}
    </>
  );
}

function AccessSetupDialog({ selection, desktop, onClose, onActivate, onProvision, onAction }: { selection: CatalogSelection; desktop: DesktopConnection; onClose: () => void; onActivate: (selection: CatalogSelection) => Promise<void>; onProvision: (selection: CatalogSelection, budgetLimitCny: number) => void; onAction: (message: string) => void }) {
  const flow = getAccessFlow(selection.source.mode);
  const desktopReady = desktop.status === "connected" && desktop.localRouter === "ready";
  const [endpointUrl, setEndpointUrl] = useState("");
  const [budgetLimitCny, setBudgetLimitCny] = useState(300);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const FlowIcon = flow.actionKind === "credential" ? KeyRound : flow.actionKind === "endpoint" ? Server : Wallet;
  const steps = flow.actionKind === "credential"
    ? ["生成一次性授权", "Desktop 本机保存", "验证后自动切换"]
    : flow.actionKind === "endpoint"
      ? ["填写端点地址", "自动探测协议", "通过后加入路由"]
      : ["确认费用上限", "创建专属实例", "就绪后加入路由"];

  async function completeSetup() {
    setError(null);
    if (flow.actionKind === "endpoint" && !/^https?:\/\//i.test(endpointUrl.trim())) {
      setError("请输入完整的 http:// 或 https:// 端点地址");
      return;
    }

    setWorking(true);
    try {
      const context = { desktopConnected: desktopReady };
      const sourceId = `${selection.offer.id}:${selection.source.name}`;
      const result = flow.actionKind === "credential"
        ? controlPlaneRepository.execute({ kind: "connect-source", projectId: "project_default", sourceId, authorizationMode: "byok" }, context)
        : flow.actionKind === "endpoint"
          ? controlPlaneRepository.execute({ kind: "test-endpoint", projectId: "project_default", sourceId, endpointRef: "desktop://pending-endpoint" }, context)
          : controlPlaneRepository.execute({ kind: "create-deployment-order", projectId: "project_default", modelId: selection.offer.id, sourceName: selection.source.name, rateLabel: selection.source.price, budgetLimitCny }, context);

      if (result.status !== "succeeded") throw new Error(result.error?.message ?? "操作没有完成");

      if (flow.actionKind === "budget") {
        onProvision(selection, budgetLimitCny);
        onAction(`${selection.offer.name} 已进入创建队列，达到 ¥ ${budgetLimitCny} 上限会自动停止`);
        onClose();
        return;
      }

      await onActivate(selection);
      onAction(flow.actionKind === "credential" ? "本机授权已完成，模型已加入当前路由" : "端点探测通过，模型已加入当前路由");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "操作没有完成，请重试");
      setWorking(false);
    }
  }

  return (
    <div className="access-dialog-backdrop" role="presentation">
      <section className="access-dialog access-setup-dialog" role="dialog" aria-modal="true" aria-labelledby="access-setup-title">
        <header><div><span className="access-flow-icon"><FlowIcon size={17} /></span><div><h2 id="access-setup-title">{flow.title}</h2><p>{flow.description}</p></div></div><button type="button" aria-label="关闭" disabled={working} onClick={onClose}><X size={15} /></button></header>
        <dl className="access-summary">
          <div><dt>模型</dt><dd>{selection.offer.name}</dd></div>
          <div><dt>来源</dt><dd>{selection.source.name}</dd></div>
          <div><dt>结算</dt><dd>{selection.source.mode === "专属算力" ? "Moyusi 余额" : "外部结算"}</dd></div>
          <div><dt>费用</dt><dd>{selection.source.price}</dd></div>
        </dl>
        {flow.actionKind === "endpoint" && <label className="byok-provider-field"><span>端点地址</span><input type="url" value={endpointUrl} disabled={working} placeholder="https://your-endpoint.example/v1" onChange={(event) => setEndpointUrl(event.target.value)} /><small>地址和认证信息只交给 Desktop；网页只接收探测结果。</small></label>}
        {flow.actionKind === "budget" && <label className="byok-provider-field"><span>每月费用上限</span><select value={budgetLimitCny} disabled={working} onChange={(event) => setBudgetLimitCny(Number(event.target.value))}><option value={100}>¥ 100 / 月</option><option value={300}>¥ 300 / 月</option><option value={600}>¥ 600 / 月</option></select><small>按小时实际使用计费，达到上限后实例自动停止。</small></label>}
        <div className="access-setup-steps">{steps.map((step, index) => <span key={step}><b>0{index + 1}</b>{step}</span>)}</div>
        <div className="access-status" data-tone={error ? "error" : desktopReady || flow.actionKind === "budget" ? "ready" : "warning"}>{error ? <AlertCircle size={14} /> : <ShieldCheck size={14} />}<div><strong>{error ?? (flow.actionKind === "budget" ? "创建前确认预算，创建后才开始计费" : desktopReady ? "Moyusi Desktop 已连接" : "需要先连接 Moyusi Desktop")}</strong><p>{error ? "原配置没有改变，可以修正后重试。" : flow.note}</p></div></div>
        <footer><button type="button" disabled={working} onClick={onClose}>稍后处理</button><button className="button button-primary" type="button" disabled={working} onClick={completeSetup}>{working ? "正在处理…" : flow.actionKind === "budget" ? "确认预算并创建" : flow.action}<ChevronRight size={13} /></button></footer>
      </section>
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

function Overview({ activeRoute, periodCost, requestCount, routePolicy, connectedTools, pendingAttention, desktop, onNavigate, onSimulateCall, onAction }: { activeRoute: ActiveRoute; periodCost: number; requestCount: number; routePolicy: RoutePolicy; connectedTools: string[]; pendingAttention: number; desktop: DesktopConnection; onNavigate: (section: WorkspaceSection) => void; onSimulateCall: () => Promise<UsageEvent>; onAction: (message: string) => void }) {
  const activeTool = toolLabel(activeRoute);
  const desktopReady = desktop.status === "connected" && desktop.localRouter === "ready";
  return (
    <>
      <PageHead kicker="CONTROL PLANE" title="工作台" description={`模型切换、AI 配置和费用都在这里。今天有 ${pendingAttention} 项需要确认。`} action={<span className="workspace-ready" data-state={desktop.status}><i /> {desktopReady ? "Desktop 已连接" : desktopStatusLabel(desktop)}</span>} />
      <div className="workspace-stats">
        <Metric label="本期费用" value={`¥ ${periodCost.toFixed(2)}`} note="含本机演示调用" />
        <Metric label="今日请求" value={String(requestCount)} note="含本机演示调用" />
        <Metric label="活动模型" value="4" note="2 闭源 · 2 开放" />
        <Metric label="已连接工具" value={String(connectedTools.length)} note={connectedTools.join(" · ")} />
      </div>

      <div className="next-step">
        <div><span>建议下一步</span><strong>{desktopReady ? "验证当前路由是否可用" : "先连接 Moyusi Desktop"}</strong><p>{desktopReady ? `${activeRoute.modelName} · ${activeRoute.sourceName} · ${routePolicy.fallback === "same-model" ? "同型号来源可自动回退" : "故障时暂停并提醒"}` : "网页负责选择与管理；本机工具的切换、密钥和配置迁移由 Desktop 完成。"}</p></div>
        <div>{desktopReady ? <button className="button button-primary compact-button" type="button" onClick={() => onSimulateCall().then((event) => onAction(`${event.modelName} 调用成功 · ${event.costLabel}`)).catch(() => onAction("模拟调用失败，请检查当前来源"))}>测试一次调用</button> : <button className="button button-primary compact-button" type="button" onClick={() => onAction("请在本机打开 Moyusi Desktop 后重新连接；网页不会读取或保存密钥")}>了解连接方式</button>}<button className="button button-quiet compact-button" type="button" onClick={() => onNavigate("routing")}>查看路由</button></div>
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

function Routing({ activeRoute, previousRoute, routePolicy, desktop, onBrowseModels, onSimulateCall, onRestore, onUpdatePolicy, onAction }: { activeRoute: ActiveRoute; previousRoute: ActiveRoute | null; routePolicy: RoutePolicy; desktop: DesktopConnection; onBrowseModels: () => void; onSimulateCall: () => Promise<UsageEvent>; onRestore: () => void; onUpdatePolicy: (patch: Partial<Omit<RoutePolicy, "saveRequestBodies">>) => void; onAction: (message: string) => void }) {
  const [testing, setTesting] = useState(false);
  const activeOffer = catalogRepository.getById(activeRoute.modelId);
  const fallbacks = activeOffer?.sources
    .filter((source) => source.name !== activeRoute.sourceName)
    .slice(0, 2)
    .map((source) => ({
      name: activeRoute.modelName,
      meta: `${source.mode} · ${source.name} · ${source.latency}`,
      health: source.health,
    })) ?? [];

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
      <DesktopBridge desktop={desktop} />
      <Panel>
        <PanelHead eyebrow="PROVIDER PROFILE" title={`${toolLabel(activeRoute)} · 当前模型`} action={<span className="inline-status"><i />{fallbacks.length} 个备用来源</span>} />
        <div className="strategy-bar">
          <div><strong>路由策略</strong><small>{routeStrategyDescription(routePolicy.strategy)}</small></div>
          <label><span className="visually-hidden">选择路由策略</span><select value={routePolicy.strategy} onChange={(event) => { onUpdatePolicy({ strategy: event.target.value as RouteStrategy }); onAction(`已切换为${routeStrategyLabel(event.target.value as RouteStrategy)}`); }}><option value="auto">自动选择</option><option value="fixed">固定当前来源</option><option value="cost">成本优先</option></select></label>
        </div>
        <div className="route-order">
          <RouteOrder index="01" name={activeRoute.modelName} meta={`${activeRoute.sourceMode} · ${activeRoute.sourceName}`} health={activeRoute.health} />
          {fallbacks.map((route, index) => <RouteOrder key={route.name} index={`0${index + 2}`} name={route.name} meta={route.meta} health={route.health} />)}
        </div>
        <div className="panel-footer route-actions"><span>当前来源不可用时，自动尝试下面的备用来源</span><div>{previousRoute && <button type="button" onClick={restore}>恢复 {previousRoute.modelName}</button>}<button className="test-call-button" type="button" disabled={testing} onClick={simulate}>{testing ? "正在调用…" : "模拟调用"}</button></div></div>
      </Panel>
      <details className="workspace-advanced">
        <summary>高级设置</summary>
        <div className="two-column-panels">
          <Panel><PanelHead eyebrow="LOCAL ROUTER" title="本地连接" /><SettingRow label="Desktop 状态" value={desktopStatusLabel(desktop)} /><SettingRow label="本地路由" value={desktop.localRouter === "ready" ? "已就绪" : "未启动"} /><SettingRow label="修改保护" value="自动备份，可恢复" /></Panel>
          <Panel><PanelHead eyebrow="POLICY" title="数据与切换规则" /><div className="policy-control"><span>优先地区</span><select value={routePolicy.preferredRegion} onChange={(event) => onUpdatePolicy({ preferredRegion: event.target.value as RoutePolicy["preferredRegion"] })}><option>中国</option><option>亚太</option><option>全球</option></select></div><div className="policy-control"><span>失败时处理</span><select value={routePolicy.fallback} onChange={(event) => onUpdatePolicy({ fallback: event.target.value as RoutePolicy["fallback"] })}><option value="same-model">同型号来源回退</option><option value="pause">暂停并提醒</option></select></div><SettingRow label="保存请求正文" value="不保存" /></Panel>
        </div>
      </details>
    </>
  );
}

function DesktopBridge({ desktop }: { desktop: DesktopConnection }) {
  const ready = desktop.status === "connected" && desktop.localRouter === "ready";
  return (
    <aside className="desktop-bridge" data-ready={ready}>
      <SquareTerminal size={16} />
      <div><strong>{ready ? "网页策略已由 Desktop 应用到本机工具" : "本机工具的切换需要 Moyusi Desktop"}</strong><p>{ready ? `${desktop.name} ${desktop.version ?? ""} · 本地路由已就绪。密钥、工具配置和回滚只在本机处理。` : "网页可以比较模型、管理费用和保存策略；Desktop 负责本机密钥、路由和配置迁移。"}</p></div>
      <span><i data-state={desktop.status} />{desktopStatusLabel(desktop)}</span>
    </aside>
  );
}

function Sources({ workspace, profiles, onUpdateProfile, onAction }: { workspace: DemoPortableWorkspaceController; profiles: ProviderProfile[]; onUpdateProfile: (profile: ProviderProfile) => void; onAction: (message: string) => void }) {
  const [connectOpen, setConnectOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [provider, setProvider] = useState<ByokProvider>("OpenRouter");
  const [selectedSource, setSelectedSource] = useState<ProviderSource | null>(null);
  const [editingProfile, setEditingProfile] = useState<ProviderProfile | null>(null);
  const [connecting, setConnecting] = useState(false);
  const sources = workspaceRepository.listSources();
  const routes = workspaceRepository.listRoutes();

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
      <PageHead kicker="API & SOURCES" title="来源与凭证" description="先选择来源，再决定哪个工具使用它。自己的密钥只保存在本机，费用由对应平台收取。" action={<div className="head-actions"><button className="button button-quiet compact-button" type="button" onClick={() => setAddOpen(true)}>添加来源</button><button className="button button-primary compact-button" type="button" onClick={() => onAction("调用密钥创建流程已打开；完整值只显示一次")}>创建调用密钥</button></div>} />
      <div className="provider-source-list">
        <Panel><PanelHead eyebrow="SOURCES" title={`${sources.length} 个来源`} action={<span>按可用性排序</span>} /><div className="provider-table-head"><span>来源</span><span>结算</span><span>协议</span><span>状态</span><span>模型</span><span /></div>{sources.map((source) => <ProviderSourceRow key={source.id} source={source} onSelect={() => setSelectedSource(source)} />)}</Panel>
        <Panel><PanelHead eyebrow="PROVIDER PROFILES" title="工具使用配置" action={<span>{profiles.length} 个 Profile · {routes.length} 条路由</span>} /><div className="provider-profile-list">{profiles.map((profile) => { const source = sources.find((candidate) => candidate.id === profile.sourceId); const route = routes.find((candidate) => candidate.profileId === profile.id); return <div className="provider-profile-row" key={profile.id}><span className="profile-tool-icon"><SquareTerminal size={14} /></span><div><strong>{profile.tool}</strong><small>{profile.model} · {source?.name ?? "来源已移除"} · {route ? `${route.sourceIds.length} 个来源 · ${route.strategy === "auto" ? "自动选择" : route.strategy === "cost" ? "成本优先" : "固定来源"}` : "未建立路由"}</small></div><span className="profile-enabled" data-enabled={profile.enabled}>{profile.enabled ? "已启用" : "未启用"}</span><button type="button" onClick={() => setEditingProfile(profile)}>编辑</button></div>; })}</div><div className="panel-footer"><span>切换来源不会覆盖官方登录</span><button type="button" onClick={() => setEditingProfile(profiles[0] ?? null)}>统一管理</button></div></Panel>
      </div>
      <div className="source-grid">
        <Panel><PanelHead eyebrow="MOYUSI KEY" title="Moyusi 调用密钥" action={<span className="inline-status"><i />正常</span>} /><div className="key-display"><KeyRound size={17} /><code>moy_••••••••92F1</code><span>今天使用</span></div><SettingRow label="可用模型" value="4 个" /><SettingRow label="每月限额" value="¥ 120.00" /><SettingRow label="有效期" value="长期" /><div className="panel-footer"><span>完整密钥不会再次显示</span><button type="button" onClick={() => onAction("密钥更换流程已准备")}>更换</button></div></Panel>
        <Panel><PanelHead eyebrow="LOCAL BYOK" title="我的模型账号" /><div className="source-list">{workspace.state.connections.map((connection) => <SourceRow key={connection.id} name={connection.provider} meta={connection.scope} status={connection.state === "bound" ? "已连接" : "待授权"} />)}</div><button className="source-add" type="button" onClick={() => setConnectOpen(true)}>连接新的模型账号 <ChevronRight size={13} /></button></Panel>
      </div>
      <div className="security-note"><ShieldCheck size={17} /><div><strong>密钥不会跟随 AI 配置迁移</strong><p>切换设备或软件时只迁移非敏感设置；模型账号需要在新设备上重新确认。</p></div></div>
      {connectOpen && <ByokDialog provider={provider} connecting={connecting} onProviderChange={setProvider} onClose={() => setConnectOpen(false)} onConnect={connect} />}
      {addOpen && <ProviderPresetDialog sources={sources} onClose={() => setAddOpen(false)} onChoose={(source) => { setAddOpen(false); setSelectedSource(source); onAction(`${source.name} 已加入来源草稿，请继续完成授权或端点连接`); }} />}
      {selectedSource && <ProviderDetailDialog source={selectedSource} onClose={() => setSelectedSource(null)} onConnect={() => { setSelectedSource(null); selectedSource.mode === "byok" || selectedSource.mode === "direct" ? setConnectOpen(true) : onAction(`${selectedSource.name} 的连接检查已加入 Desktop 队列`); }} />}
      {editingProfile && <ProviderProfileDialog profile={editingProfile} onClose={() => setEditingProfile(null)} onSave={(profile) => { onUpdateProfile(profile); setEditingProfile(null); onAction(`${profile.tool} 配置已更新，Desktop 将在下次同步时应用`); }} />}
    </>
  );
}

function ProviderSourceRow({ source, onSelect }: { source: ProviderSource; onSelect: () => void }) {
  return <button className="provider-source-row" type="button" onClick={onSelect}><span><strong>{source.name}</strong><small>{source.vendor} · {source.note}</small></span><span>{providerModeLabel(source.mode)}</span><span>{source.protocol}</span><span className="provider-status" data-state={providerStatusTone(source.status)}><i />{providerStatusLabel(source.status)}</span><span>{source.modelCount} 个</span><span><ChevronRight size={14} /></span></button>;
}

function ProviderPresetDialog({ sources, onClose, onChoose }: { sources: ProviderSource[]; onClose: () => void; onChoose: (source: ProviderSource) => void }) {
  return <div className="access-dialog-backdrop" role="presentation"><section className="access-dialog provider-dialog" role="dialog" aria-modal="true" aria-labelledby="provider-dialog-title"><header><div><span className="access-flow-icon"><PlugZap size={17} /></span><div><h2 id="provider-dialog-title">添加来源</h2><p>先选一个预设，专业协议字段会在连接检查后自动补齐。</p></div></div><button type="button" aria-label="关闭" onClick={onClose}><X size={15} /></button></header><div className="provider-preset-grid">{sources.map((source) => <button type="button" key={source.id} onClick={() => onChoose(source)}><strong>{source.name}</strong><small>{providerModeLabel(source.mode)} · {source.protocol}</small><span>{source.status === "active" ? "可直接使用" : "需要授权"}</span></button>)}<button type="button" className="provider-preset-custom" onClick={() => onChoose({ id: "custom", name: "自定义来源", vendor: "自定义", mode: "endpoint", status: "draft", protocol: "待检测", health: "待检测", modelCount: 0, note: "OpenAI-compatible / Anthropic" })}><strong>自定义来源</strong><small>填写地址后自动探测协议</small><span>高级</span></button></div><footer><button type="button" onClick={onClose}>取消</button></footer></section></div>;
}

function ProviderDetailDialog({ source, onClose, onConnect }: { source: ProviderSource; onClose: () => void; onConnect: () => void }) {
  return <div className="access-dialog-backdrop" role="presentation"><section className="access-dialog provider-dialog" role="dialog" aria-modal="true" aria-labelledby="provider-detail-title"><header><div><span className="access-flow-icon"><Server size={17} /></span><div><h2 id="provider-detail-title">{source.name}</h2><p>{source.vendor} · {providerModeLabel(source.mode)} · {source.protocol}</p></div></div><button type="button" aria-label="关闭" onClick={onClose}><X size={15} /></button></header><div className="access-summary"><div><dt>状态</dt><dd>{providerStatusLabel(source.status)}</dd></div><div><dt>模型</dt><dd>{source.modelCount ? `${source.modelCount} 个可用` : "连接后探测"}</dd></div><div><dt>健康</dt><dd>{source.health}</dd></div><div><dt>凭证</dt><dd>{source.credentialHint ?? "Moyusi 托管"}</dd></div></div><div className="access-status"><ShieldCheck size={14} /><div><strong>{source.mode === "moyusi" ? "使用 Moyusi 余额，不需要额外授权" : "敏感凭证只交给 Desktop 安全存储"}</strong><p>{source.note}。连接后会先检查模型列表和协议能力。</p></div></div><footer><button type="button" onClick={onClose}>稍后</button><button className="button button-primary" type="button" onClick={onConnect}>{source.mode === "moyusi" ? "加入路由" : "继续连接"}<ChevronRight size={13} /></button></footer></section></div>;
}

function ProviderProfileDialog({ profile, onClose, onSave }: { profile: ProviderProfile; onClose: () => void; onSave: (profile: ProviderProfile) => void }) {
  const [draft, setDraft] = useState(profile);
  const models = catalogRepository.list({ modality: "语言" });
  return (
    <div className="access-dialog-backdrop" role="presentation">
      <section className="access-dialog provider-dialog profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title">
        <header><div><span className="access-flow-icon"><Settings2 size={17} /></span><div><h2 id="profile-dialog-title">编辑 {profile.tool} 配置</h2><p>Profile 只保存模型选择和来源策略；本机密钥仍由 Desktop 保管。</p></div></div><button type="button" aria-label="关闭" onClick={onClose}><X size={15} /></button></header>
        <label className="byok-provider-field"><span>模型</span><select value={draft.model} onChange={(event) => setDraft((current) => ({ ...current, model: event.target.value }))}>{models.map((model) => <option key={model.id} value={model.name}>{model.name} · {model.family}</option>)}</select></label>
        <label className="byok-provider-field"><span>来源</span><select value={draft.sourceId} onChange={(event) => setDraft((current) => ({ ...current, sourceId: event.target.value }))}>{workspaceRepository.listSources().map((source) => <option key={source.id} value={source.id}>{source.name} · {providerModeLabel(source.mode)}</option>)}</select></label>
        <label className="profile-toggle"><input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft((current) => ({ ...current, enabled: event.target.checked }))} /><span><strong>启用此 Profile</strong><small>启用后，Desktop 会在对应工具中使用这条路由。</small></span></label>
        <div className="access-status"><ShieldCheck size={14} /><div><strong>安全边界保持不变</strong><p>模型和来源可以同步；API Key、OAuth 会话和系统配置不会写入网页。</p></div></div>
        <footer><button type="button" onClick={onClose}>取消</button><button className="button button-primary" type="button" onClick={() => onSave({ ...draft, updatedAt: "刚刚" })}>保存配置<Check size={13} /></button></footer>
      </section>
    </div>
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

function Deployments({ provisioning, onBrowseModels, onAction }: { provisioning: { selection: CatalogSelection; budgetLimitCny: number } | null; onBrowseModels: () => void; onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="MODELS & DEPLOYMENTS" title="我的模型" description="查看已经使用的开放模型、专属服务器和自己的服务器。成本与运行状态分开显示。" action={<button className="button button-primary compact-button" type="button" onClick={onBrowseModels}>添加开放模型</button>} />
      <div className="deployment-list">
        {provisioning && <Deployment icon={CloudCog} name={provisioning.selection.offer.name} type={provisioning.selection.source.name} state="PROVISIONING" details={[provisioning.selection.source.price, `上限 ¥ ${provisioning.budgetLimitCny} / 月`, "创建后开始计费"]} action="查看进度" onClick={() => onAction("正在分配算力；就绪前不会加入活动路由")} />}
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

function Tools({ desktop, connectedTools, onAction }: { desktop: DesktopConnection; connectedTools: string[]; onAction: (message: string) => void }) {
  const apps = [
    { name: "Codex", version: "0.150.1", state: "已安装 · 可运行", action: "打开" },
    { name: "Claude Code", version: "2.1.251", state: "已安装 · 可升级", action: "检查更新" },
    { name: "Gemini CLI", version: "—", state: "未安装", action: "安装" },
    { name: "OpenCode", version: "1.18.25", state: "已安装 · 环境待检查", action: "检查环境" },
  ];
  return (
    <>
      <PageHead kicker="TOOLS & DEVICES" title="工具与设备" description="查看本机 AI 工具、Desktop Bridge 和路由服务状态。安装、升级与配置写入由 Desktop 执行。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("正在请求 Desktop 重新扫描本机工具")}>重新扫描</button>} />
      <DesktopBridge desktop={desktop} />
      <div className="two-column-panels">
        <Panel><PanelHead eyebrow="CONNECTED TOOLS" title={`${connectedTools.length} 个工具已连接`} />{connectedTools.map((tool) => <SourceRow key={tool} name={tool} meta="Moyusi Desktop · 路由已同步" status="已连接" />)}<button className="source-add" type="button" onClick={() => onAction("连接码已生成，请在目标设备打开 Moyusi Desktop")}>连接新设备 <ChevronRight size={13} /></button></Panel>
        <Panel><PanelHead eyebrow="LOCAL RUNTIME" title="本地路由服务" /><SettingRow label="Desktop 版本" value={desktop.version ?? "未检测"} /><SettingRow label="本地路由" value={desktop.localRouter === "ready" ? "运行中 · loopback" : "未启动"} /><SettingRow label="配置保护" value="自动备份 · 可回滚" /><div className="panel-footer"><span>不会向网页上传第三方密钥</span><button type="button" onClick={() => onAction("本地路由启动请求已发送")}>{desktop.localRouter === "ready" ? "查看日志" : "启动路由"}</button></div></Panel>
      </div>
      <Panel><PanelHead eyebrow="APPLICATION DISCOVERY" title="应用检测" action={<span>最近检查：刚刚</span>} /><div className="app-discovery-list">{apps.map((app) => <div className="app-discovery-row" key={app.name}><span className="app-discovery-icon"><SquareTerminal size={15} /></span><div><strong>{app.name}</strong><small>{app.version} · {app.state}</small></div><span className="app-discovery-state" data-state={app.state === "未安装" ? "muted" : app.state.includes("升级") ? "warn" : "ok"}>{app.state}</span><button type="button" onClick={() => onAction(`${app.name}：${app.action}操作已加入 Desktop 队列`)}>{app.action}</button></div>)}</div></Panel>
    </>
  );
}

function Sessions({ onAction }: { onAction: (message: string) => void }) {
  const sessions = [
    { title: "Moyusi 工作台主线开发", tool: "Codex", model: "GPT · Coding", time: "刚刚", state: "可恢复" },
    { title: "调研 CC Switch 模型平台竞品", tool: "Claude Code", model: "Claude Sonnet", time: "52 分钟前", state: "可恢复" },
    { title: "设计算力与数据市场架构", tool: "Codex", model: "Qwen Coder", time: "12 小时前", state: "需转换" },
  ];
  return (
    <>
      <PageHead kicker="SESSION INDEX" title="会话" description="统一索引不同工具中的会话。先恢复可验证的检查点，不承诺厂商隐藏运行时的无损迁移。" action={<button className="button button-quiet compact-button" type="button" onClick={() => onAction("正在请求 Desktop 同步会话索引")}>同步索引</button>} />
      <Panel><div className="session-toolbar"><strong>{sessions.length} 个会话</strong><div><select aria-label="筛选工具"><option>全部工具</option><option>Codex</option><option>Claude Code</option></select><select aria-label="筛选状态"><option>全部状态</option><option>可恢复</option><option>需转换</option></select></div></div><div className="session-list">{sessions.map((session) => <article className="session-row" key={session.title}><span className="session-icon"><MessageSquare size={15} /></span><div><strong>{session.title}</strong><small>{session.tool} · {session.model} · {session.time}</small></div><span className="session-state" data-state={session.state === "可恢复" ? "ok" : "warn"}>{session.state}</span><button type="button" onClick={() => onAction(`${session.title} 的恢复预览已打开`)}>查看</button></article>)}</div></Panel>
      <div className="security-note"><ShieldCheck size={17} /><div><strong>会话正文默认留在本机</strong><p>网页只同步索引、恢复标识和迁移结果；加密正文、隐藏推理状态和不可兼容内容会明确标记为不支持。</p></div></div>
    </>
  );
}

function Usage({ events, billing, onAction }: { events: UsageEvent[]; billing: DemoPlatformController["billing"]; onAction: (message: string) => void }) {
  const rows = events.length ? events : [
    { id: "req_8FK2", modelName: "GPT · Coding", sourceName: "Moyusi 稳定线路", sourceMode: "统一余额", usage: "18.4K", latency: "2.7s", costLabel: "¥ 0.18" },
    { id: "req_7QD9", modelName: "Qwen Coder", sourceName: "共享算力", sourceMode: "共享算力", usage: "32.1K", latency: "3.1s", costLabel: "¥ 0.07" },
    { id: "req_6MV4", modelName: "Gemini Flash", sourceName: "Google AI", sourceMode: "BYOK", usage: "9.2K", latency: "1.8s", costLabel: "估算 ¥ 0.04" },
  ];
  return (
    <>
      <PageHead kicker="USAGE & REQUESTS" title="用量与请求" description="查看 Token、延迟、状态、实际来源和回退原因。请求日志是调用证据，账本流水请前往余额与账单。" action={<button className="button button-quiet compact-button" type="button" onClick={() => onAction("用量报表导出已准备")}>导出报表</button>} />
      <div className="workspace-stats"><Metric label="今日请求" value={String(billing.requestCount)} note="含本机演示调用" /><Metric label="本期 Token" value="1.31M" note="输入 1.12M · 输出 0.19M" /><Metric label="平均响应" value="2.3s" note="最近 24 小时" /><Metric label="缓存命中" value="74.1%" note="仅统计支持的来源" /></div>
      <Panel><PanelHead eyebrow="REQUEST LOG" title="最近请求" action={<span>默认不保存正文</span>} /><div className="usage-row usage-row-head"><span>请求</span><span>模型 / 来源</span><span>用量</span><span>响应</span><span>费用</span></div>{rows.map((event) => <UsageRow key={event.id} id={event.id} model={event.modelName} route={`${event.sourceName} · ${event.sourceMode}`} tokens={event.usage} latency={event.latency} cost={event.costLabel} />)}</Panel>
    </>
  );
}

function Billing({ events, billing, onAction }: { events: UsageEvent[]; billing: DemoPlatformController["billing"]; onAction: (message: string) => void }) {
  const bars = [24, 38, 31, 52, 45, 67, 58, 76, 62, 88, 71, 82, 64, 91];
  return (
    <>
      <PageHead kicker="BALANCE & LEDGER" title="余额与账单" description="Moyusi 余额、充值、扣费和退款单独记账；BYOK 费用只显示外部估算，不会从 Moyusi 余额扣除。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("充值流程仅作预览，未发起真实支付")}>充值</button>} />
      <div className="workspace-stats"><Metric label="可用余额" value={`¥ ${billing.availableBalanceCny.toFixed(2)}`} note="统一余额" /><Metric label="本期费用" value={`¥ ${billing.periodCostCny.toFixed(2)}`} note="含本机演示调用" /><Metric label="外部估算" value={`¥ ${billing.externalEstimateCny.toFixed(2)}`} note="BYOK 不代扣" /><Metric label="今日请求" value={String(billing.requestCount)} note="含本机演示调用" /></div>
      <Panel className="usage-panel"><PanelHead eyebrow="14 DAYS" title="每日费用" action={<strong>¥ {billing.periodCostCny.toFixed(2)}</strong>} /><div className="usage-bars">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} title={`第 ${index + 1} 天`} />)}</div></Panel>
      <Panel><PanelHead eyebrow="LEDGER" title="最近账本流水" action={<span>不可变记录</span>} /><div className="ledger-row ledger-row-head"><span>时间</span><span>类型</span><span>说明</span><span>金额</span><span>余额</span></div><LedgerRow time="今天 13:17" type="usage_debit" description="GPT · Coding · Moyusi 稳定线路" amount="- ¥ 0.18" balance={`¥ ${billing.availableBalanceCny.toFixed(2)}`} /><LedgerRow time="今天 12:42" type="topup" description="统一余额充值" amount="+ ¥ 20.00" balance="¥ 80.18" /><LedgerRow time="昨天 18:20" type="usage_debit" description="Qwen Coder · 共享算力" amount="- ¥ 0.07" balance="¥ 60.18" /></Panel>
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
function Deployment({ icon: Icon, name, type, state, details, action, onClick }: { icon: LucideIcon; name: string; type: string; state: string; details: string[]; action: string; onClick: () => void }) { return <article className="deployment-row"><span className="deployment-icon"><Icon size={18} /></span><div><strong>{name}</strong><small>{type}</small></div><span className="deployment-state" data-state={state}><i />{state}</span>{details.map((detail) => <span key={detail}>{detail}</span>)}<button type="button" onClick={onClick}>{action}</button></article>; }
function AssetRow({ icon: Icon, name, value, note }: { icon: LucideIcon; name: string; value: string; note: string }) { return <div className="asset-row"><span><Icon size={16} /></span><div><strong>{name}</strong><small>{note}</small></div><b>{value}</b><ChevronRight size={13} /></div>; }
function MigrationTarget({ name, version, exact, adapted, unsupported, status }: { name: string; version: string; exact: string; adapted: string; unsupported: string; status: string }) { return <div className="migration-target"><div><strong>{name}</strong><small>{version}</small></div><dl><div><dt>原样</dt><dd>{exact}</dd></div><div><dt>转换</dt><dd>{adapted}</dd></div><div><dt>不支持</dt><dd>{unsupported}</dd></div></dl><span>{status}</span></div>; }
function MigrationRow({ name, result, detail, warn = false }: { name: string; result: string; detail: string; warn?: boolean }) { return <div className="migration-row"><strong>{name}</strong><span data-warn={warn}>{result}</span><p>{detail}</p></div>; }
function UsageRow({ id, model, route, tokens, latency, cost }: { id: string; model: string; route: string; tokens: string; latency: string; cost: string }) { return <div className="usage-row"><code>{id}</code><div><strong>{model}</strong><small>{route}</small></div><code>{tokens}</code><code>{latency}</code><code>{cost}</code></div>; }
function LedgerRow({ time, type, description, amount, balance }: { time: string; type: string; description: string; amount: string; balance: string }) { return <div className="ledger-row"><span>{time}</span><code>{type}</code><div>{description}</div><strong data-negative={amount.startsWith("-")}>{amount}</strong><code>{balance}</code></div>; }
function toolLabel(route: ActiveRoute): string { return route.modality === "语言" ? "Codex" : route.modality === "图片" ? "图像工作流" : "视频工作流"; }
function desktopStatusLabel(desktop: DesktopConnection): string { return desktop.status === "connected" && desktop.localRouter === "ready" ? "本机已连接" : desktop.status === "not-installed" ? "未安装 Desktop" : "Desktop 离线"; }
function routeStrategyLabel(strategy: RouteStrategy): string { return strategy === "fixed" ? "固定来源" : strategy === "cost" ? "成本优先" : "自动选择"; }
function routeStrategyDescription(strategy: RouteStrategy): string { return strategy === "fixed" ? "只使用当前来源，故障时暂停并提醒" : strategy === "cost" ? "在可用来源中优先选择成本较低的线路" : "按健康、延迟与价格自动选择并回退"; }
function migrationOutcomeLabel(outcome: MigrationOutcome): string { return outcome === "exact" ? "原样" : outcome === "adapted" ? "已转换" : outcome === "rebuilt" ? "已重建" : "待确认"; }

function readProviderProfiles(): ProviderProfile[] {
  try {
    const saved = window.localStorage.getItem("moyusi-provider-profiles-v1");
    if (!saved) return workspaceRepository.listProfiles();
    const parsed: unknown = JSON.parse(saved);
    if (!Array.isArray(parsed)) return workspaceRepository.listProfiles();
    const profiles = parsed.filter((item): item is ProviderProfile => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Partial<ProviderProfile>;
      return typeof candidate.id === "string" && typeof candidate.tool === "string" && typeof candidate.sourceId === "string" && typeof candidate.model === "string" && typeof candidate.enabled === "boolean" && typeof candidate.updatedAt === "string";
    });
    return profiles.length ? profiles : workspaceRepository.listProfiles();
  } catch {
    return workspaceRepository.listProfiles();
  }
}
