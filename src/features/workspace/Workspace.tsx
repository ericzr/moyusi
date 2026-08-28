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
  type LucideIcon,
} from "lucide-react";
import { getAccessFlow, type WorkspaceSection } from "../../domain/accessPolicy";
import type { CatalogSelection } from "../../domain/catalog";
import "./workspace.css";

const NAV: { id: WorkspaceSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "总览", icon: Activity },
  { id: "routing", label: "路由", icon: Network },
  { id: "sources", label: "API 与来源", icon: KeyRound },
  { id: "deployments", label: "模型与部署", icon: CloudCog },
  { id: "environment", label: "工作环境", icon: Sparkles },
  { id: "billing", label: "用量与计费", icon: ReceiptText },
  { id: "account", label: "账户", icon: CircleUserRound },
];

export function Workspace({
  section,
  pendingSelection,
  onNavigate,
  onBrowseModels,
}: {
  section: WorkspaceSection;
  pendingSelection: CatalogSelection | null;
  onNavigate: (section: WorkspaceSection) => void;
  onBrowseModels: () => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);

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
          <span><i /> 本地路由器在线</span>
          <small>Desktop 0.1 preview</small>
        </div>
      </aside>

      <section className="workspace-content">
        {pendingSelection && <PendingSelection selection={pendingSelection} onAction={act} />}
        {section === "overview" && <Overview onNavigate={onNavigate} />}
        {section === "routing" && <Routing onBrowseModels={onBrowseModels} onAction={act} />}
        {section === "sources" && <Sources onAction={act} />}
        {section === "deployments" && <Deployments onBrowseModels={onBrowseModels} onAction={act} />}
        {section === "environment" && <Environment onAction={act} />}
        {section === "billing" && <Billing onAction={act} />}
        {section === "account" && <Account onAction={act} />}
      </section>

      {notice && <div className="workspace-toast" role="status"><Check size={14} />{notice}</div>}
    </main>
  );
}

function PendingSelection({ selection, onAction }: { selection: CatalogSelection; onAction: (message: string) => void }) {
  const flow = getAccessFlow(selection.source.mode);
  const actionLabel = flow.actionKind === "credential" ? "绑定凭证" : flow.actionKind === "endpoint" ? "验证端点" : flow.actionKind === "budget" ? "查看预算" : "保存并验证";
  return (
    <div className="pending-offer" role="status">
      <span className="pending-icon"><Box size={17} /></span>
      <div>
        <strong>{selection.offer.name} · {selection.source.name}</strong>
        <p>{selection.source.mode} · {selection.source.price} · 已从模型详情带入当前步骤</p>
      </div>
      <button type="button" onClick={() => onAction(`${selection.offer.name}：${actionLabel}流程已准备`)}>{actionLabel}</button>
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

function Overview({ onNavigate }: { onNavigate: (section: WorkspaceSection) => void }) {
  return (
    <>
      <PageHead kicker="CONTROL PLANE" title="工作台" description="今天需要关注 2 项。其余路由、资产和费用均在预期范围内。" action={<span className="workspace-ready"><i /> ALL SYSTEMS READY</span>} />
      <div className="workspace-stats">
        <Metric label="本期费用" value="¥ 28.40" note="预算的 36%" />
        <Metric label="今日请求" value="184" note="成功率 99.8%" />
        <Metric label="活动模型" value="4" note="2 闭源 · 2 开放" />
        <Metric label="已连接工具" value="2" note="Codex · Claude Code" />
      </div>

      <div className="overview-grid">
        <Panel className="active-route-panel">
          <PanelHead eyebrow="ACTIVE ROUTE" title="Codex · 日常编程" action={<button type="button" onClick={() => onNavigate("routing")}>管理路由 <ChevronRight size={13} /></button>} />
          <div className="route-path">
            <RouteNode icon={Code2} label="Codex" detail="本地代理" />
            <ArrowRight size={16} />
            <RouteNode icon={Network} label="稳定策略" detail="2 条回退" />
            <ArrowRight size={16} />
            <RouteNode icon={Server} label="GPT · Coding" detail="统一余额" active />
          </div>
          <div className="route-meta"><span><i /> 当前线路健康</span><span>p95 3.8s</span><span>最近切换 2 天前</span></div>
        </Panel>

        <Panel>
          <PanelHead eyebrow="WORKSPACE PROFILE" title="日常编程 · v12" action={<button type="button" onClick={() => onNavigate("environment")}>查看环境 <ChevronRight size={13} /></button>} />
          <div className="asset-counts">
            <AssetCount icon={PlugZap} label="MCP" value="4" />
            <AssetCount icon={Wrench} label="Skills" value="6" />
            <AssetCount icon={SquareTerminal} label="Prompts" value="3" />
            <AssetCount icon={BookOpen} label="知识库" value="2" />
          </div>
          <div className="sync-summary"><span>Codex</span><strong><i />已同步</strong><span>Claude Code</span><strong className="warn">2 项待确认</strong></div>
        </Panel>
      </div>

      <Panel className="attention-panel">
        <PanelHead eyebrow="NEEDS ATTENTION" title="需要处理" />
        <Attention icon={AlertCircle} title="Claude Code 有 2 项适配变更" description="一个 Prompt 角色将转换，一个 MCP 权限需要重新确认。" action="查看迁移" onClick={() => onNavigate("environment")} />
        <Attention icon={Wallet} title="供应商 BYOK 余额未同步" description="费用显示为本地估算，不会从 Moyusi 余额扣除。" action="查看来源" onClick={() => onNavigate("sources")} />
      </Panel>
    </>
  );
}

function Routing({ onBrowseModels, onAction }: { onBrowseModels: () => void; onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="ROUTING" title="路由" description="按工具管理模型映射、优先级、回退与数据策略。跨模型回退默认关闭。" action={<button className="button button-primary compact-button" type="button" onClick={onBrowseModels}>添加模型</button>} />
      <Panel>
        <PanelHead eyebrow="PROVIDER PROFILE" title="Codex · 日常编程" action={<span className="inline-status"><i />活动中</span>} />
        <div className="route-order">
          <RouteOrder index="01" name="GPT · Coding" meta="统一余额 · 稳定线路" health="99.95%" />
          <RouteOrder index="02" name="Claude Sonnet" meta="统一余额 · 同任务回退" health="99.92%" />
          <RouteOrder index="03" name="Qwen Coder" meta="共享算力 · 开放权重" health="99.76%" />
        </div>
        <div className="panel-footer"><span>仅在超时、429 或可恢复 5xx 时回退</span><button type="button" onClick={() => onAction("路由策略预览已打开")}>编辑策略</button></div>
      </Panel>
      <div className="two-column-panels">
        <Panel><PanelHead eyebrow="LOCAL ROUTER" title="本地路由器" /><SettingRow label="监听地址" value="127.0.0.1:16888" /><SettingRow label="健康检查" value="每 30 秒" /><SettingRow label="配置写入" value="原子写入 + 自动备份" /></Panel>
        <Panel><PanelHead eyebrow="POLICY" title="默认约束" /><SettingRow label="数据地区" value="亚太优先" /><SettingRow label="正文留存" value="不允许" /><SettingRow label="跨模型回退" value="关闭" /></Panel>
      </div>
    </>
  );
}

function Sources({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="API & SOURCES" title="API 与来源" description="平台 Key、BYOK 和供应商连接使用不同安全与计费边界。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("已创建演示 Key；生产版完整 Key 仅显示一次")}>创建 Key</button>} />
      <div className="source-grid">
        <Panel><PanelHead eyebrow="MOYUSI KEY" title="平台 Key" action={<span className="inline-status"><i />正常</span>} /><div className="key-display"><KeyRound size={17} /><code>moy_••••••••92F1</code><span>今天使用</span></div><SettingRow label="允许模型" value="4 个" /><SettingRow label="本月限额" value="¥ 120.00" /><SettingRow label="到期" value="永不过期" /><div className="panel-footer"><span>明文不会再次显示</span><button type="button" onClick={() => onAction("Key 轮换流程已准备")}>轮换</button></div></Panel>
        <Panel><PanelHead eyebrow="LOCAL BYOK" title="本地凭证" /><SourceRow name="Google AI" meta="Keychain · 不上传云端" status="已连接" /><SourceRow name="OpenRouter" meta="Keychain · 费用外部结算" status="待同步" /><button className="source-add" type="button" onClick={() => onAction("已打开本地凭证连接流程")}>连接新的供应商 <ChevronRight size={13} /></button></Panel>
      </div>
      <div className="security-note"><ShieldCheck size={17} /><div><strong>Secret 不进入工作环境包</strong><p>跨设备或软件迁移时只携带 Secret reference 和所需作用域，目标环境必须重新授权。</p></div></div>
    </>
  );
}

function Deployments({ onBrowseModels, onAction }: { onBrowseModels: () => void; onAction: (message: string) => void }) {
  return (
    <>
      <PageHead kicker="MODELS & DEPLOYMENTS" title="模型与部署" description="共享开放模型、专属端点和自有算力进入同一套路由，但成本与运行状态分开表达。" action={<button className="button button-primary compact-button" type="button" onClick={onBrowseModels}>浏览开放模型</button>} />
      <div className="deployment-list">
        <Deployment icon={Server} name="Qwen Coder" type="共享端点" state="WARM" details={["FP8 · vLLM", "新加坡", "¥ 0.86 / M 起"]} action="查看" onClick={() => onAction("共享端点详情已打开")} />
        <Deployment icon={CloudCog} name="DeepSeek Reasoning" type="弹性共享" state="COLD" details={["BF16 · SGLang", "东京", "冷启动约 28 秒"]} action="启动" onClick={() => onAction("启动请求已进入演示队列")} />
        <Deployment icon={Database} name="Private Endpoint" type="用户自有端点" state="HEALTHY" details={["OpenAI-compatible", "私有网络", "外部计费"]} action="测试" onClick={() => onAction("端点协议与能力测试通过")} />
      </div>
      <Panel className="deployment-boundary"><PanelHead eyebrow="SERVING IDENTITY" title="部署身份可追溯" /><div className="identity-code"><code>repo + revision + weights digest + quantization + engine/version</code><p>不同量化、模板或引擎参数不会被静默视为完全相同的模型线路。</p></div></Panel>
    </>
  );
}

function Environment({ onAction }: { onAction: (message: string) => void }) {
  const [profile, setProfile] = useState<"daily" | "team">("daily");
  return (
    <>
      <PageHead kicker="PORTABLE WORKSPACE" title="工作环境" description="把路由、MCP、Skills、Prompts、经审核记忆和知识源组织成一个可迁移 Profile。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("已生成目标软件兼容性报告")}>部署到软件</button>} />
      <div className="profile-switcher">
        <button type="button" data-active={profile === "daily"} onClick={() => setProfile("daily")}><span>日常编程</span><small>v12 · 2 个目标</small></button>
        <button type="button" data-active={profile === "team"} onClick={() => setProfile("team")}><span>团队工程</span><small>v4 · 1 个目标</small></button>
      </div>
      <div className="environment-grid">
        <Panel>
          <PanelHead eyebrow="ASSETS" title={profile === "daily" ? "日常编程 · v12" : "团队工程 · v4"} />
          <div className="asset-list">
            <AssetRow icon={PlugZap} name="MCP" value={profile === "daily" ? "4 个服务" : "6 个服务"} note="权限在目标软件重新确认" />
            <AssetRow icon={Wrench} name="Skills" value={profile === "daily" ? "6 个技能" : "9 个技能"} note="2 个包含已扫描脚本" />
            <AssetRow icon={SquareTerminal} name="Prompts" value="3 个模板" note="保留目标模型变体" />
            <AssetRow icon={BookOpen} name="记忆与知识" value="18 + 2" note="源文档与 ACL 为事实源" />
          </div>
        </Panel>
        <Panel>
          <PanelHead eyebrow="TARGETS" title="目标软件" />
          <MigrationTarget name="Codex" version="本机" exact="11" adapted="2" unsupported="0" status="已部署" />
          <MigrationTarget name="Claude Code" version="本机" exact="9" adapted="3" unsupported="1" status="有更新" />
          <div className="panel-footer"><span>Secret 不计入迁移资产</span><button type="button" onClick={() => onAction("迁移 diff 已生成")}>查看完整 diff</button></div>
        </Panel>
      </div>
      <Panel className="migration-report">
        <PanelHead eyebrow="LATEST MIGRATION" title="最近迁移报告" action={<span>今天 10:42</span>} />
        <div className="migration-table-head"><span>资产</span><span>结果</span><span>说明</span></div>
        <MigrationRow name="code-review Skill" result="原样" detail="内容摘要一致" />
        <MigrationRow name="release Prompt" result="已转换" detail="developer role 转为目标指令层" />
        <MigrationRow name="GitHub MCP" result="待确认" detail="目标软件需要重新授权 repo scope" warn />
        <MigrationRow name="会话检查点" result="已重建" detail="新会话继续，不恢复厂商运行时" />
      </Panel>
    </>
  );
}

function Billing({ onAction }: { onAction: (message: string) => void }) {
  const bars = [24, 38, 31, 52, 45, 67, 58, 76, 62, 88, 71, 82, 64, 91];
  return (
    <>
      <PageHead kicker="USAGE & BILLING" title="用量与计费" description="统一余额与外部费用分开，任一扣费都能追到实际模型、线路和价格版本。" action={<button className="button button-primary compact-button" type="button" onClick={() => onAction("充值流程仅作预览，未发起真实支付")}>充值</button>} />
      <div className="workspace-stats"><Metric label="可用余额" value="¥ 80.00" note="统一余额" /><Metric label="本期费用" value="¥ 28.40" note="较上期 -8%" /><Metric label="外部估算" value="¥ 6.20" note="BYOK 不代扣" /><Metric label="预算使用" value="36%" note="¥ 120 上限" /></div>
      <Panel className="usage-panel"><PanelHead eyebrow="14 DAYS" title="每日费用" action={<strong>¥ 28.40</strong>} /><div className="usage-bars">{bars.map((height, index) => <span key={index} style={{ height: `${height}%` }} title={`第 ${index + 1} 天`} />)}</div></Panel>
      <Panel><PanelHead eyebrow="RECENT REQUESTS" title="最近请求" /><div className="usage-row usage-row-head"><span>请求</span><span>模型 / 线路</span><span>Token</span><span>延迟</span><span>费用</span></div><UsageRow id="req_8FK2" model="GPT · Coding" route="稳定 · 统一余额" tokens="18.4K" latency="2.7s" cost="¥ 0.18" /><UsageRow id="req_7QD9" model="Qwen Coder" route="共享算力 · FP8" tokens="32.1K" latency="3.1s" cost="¥ 0.07" /><UsageRow id="req_6MV4" model="Gemini Flash" route="BYOK · 外部" tokens="9.2K" latency="1.8s" cost="估算 ¥ 0.04" /></Panel>
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
      <Panel><PanelHead eyebrow="DATA & PRIVACY" title="数据与隐私" /><SettingRow label="请求正文" value="默认不持久化" /><SettingRow label="工作环境同步" value="仅非敏感资产" /><SettingRow label="记忆自动提取" value="关闭" /><SettingRow label="导出" value="不包含明文 Secret" /></Panel>
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
