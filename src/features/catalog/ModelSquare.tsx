import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  CreditCard,
  Image as ImageIcon,
  KeyRound,
  LayoutGrid,
  MessageSquareText,
  RotateCcw,
  Rows3,
  Search,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import {
  type ModelKind,
  type ModelModality,
  type ModelProtocol,
  type ModelOffer,
  type ModelRegion,
  type CatalogSelection,
  type CatalogBilling,
  type CatalogSort,
  type OfferType,
  type SupplyOption,
} from "../../domain/catalog";
import { getAccessFlow, sourceActionLabel } from "../../domain/accessPolicy";
import { catalogRepository } from "../../services/catalogRepository";
import { useCatalogModels } from "./useCatalogModels";
import { useCatalogModel } from "./useCatalogModel";

type Filter = "全部供给" | ModelKind;
type ViewMode = "compact" | "cards";
type AccessSelection = CatalogSelection;
type PrecisionFilters = {
  tags: string[];
  offerTypes: OfferType[];
  regions: ModelRegion[];
  maxLatencySeconds?: number;
  minContextWindow?: number;
  protocol?: ModelProtocol;
};
type BillingFilter = CatalogBilling | "全部定价";
type PriceUnit = "1M" | "1K";

const MODALITIES: Array<{ id: ModelModality; title: string; Icon: typeof MessageSquareText }> = [
  { id: "语言", title: "语言", Icon: MessageSquareText },
  { id: "图片", title: "图片", Icon: ImageIcon },
  { id: "视频", title: "视频", Icon: Video },
];

const VIEWS: Array<{ id: ViewMode; label: string; Icon: typeof Rows3 }> = [
  { id: "compact", label: "紧凑列表", Icon: Rows3 },
  { id: "cards", label: "卡片", Icon: LayoutGrid },
];

const FEATURE_FILTERS: Record<ModelModality, string[]> = {
  语言: ["代码", "推理", "长文本", "工具调用", "低延迟", "中文", "可部署"],
  图片: ["文生图", "图像编辑", "参考图", "中文文字", "海报", "可部署"],
  视频: ["文生视频", "图生视频", "镜头运动", "人物动作", "电影感", "可部署"],
};

const REGION_FILTERS: ModelRegion[] = ["中国", "亚太", "全球"];
const PROTOCOL_FILTERS: ModelProtocol[] = ["OpenAI", "Anthropic", "Google"];
const BILLING_FILTERS: CatalogBilling[] = ["按量计费", "按请求"];

const LATENCY_FILTERS = [
  { value: undefined, label: "不限" },
  { value: 2, label: "2 秒内" },
  { value: 5, label: "5 秒内" },
  { value: 20, label: "20 秒内" },
];

const CONTEXT_FILTERS = [
  { value: undefined, label: "不限" },
  { value: 128_000, label: "128K+" },
  { value: 200_000, label: "200K+" },
  { value: 400_000, label: "400K+" },
];

const SORT_OPTIONS: Array<{ id: CatalogSort; label: string }> = [
  { id: "recommended", label: "综合推荐" },
  { id: "price", label: "最低起价" },
  { id: "latency", label: "最快响应" },
  { id: "context", label: "最大上下文" },
];

function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export function ModelSquare({ onOpenDetail }: { onOpenDetail: (modelId: string) => void }) {
  const [modality, setModality] = useState<ModelModality>("语言");
  const [filter, setFilter] = useState<Filter>("全部供给");
  const [view, setView] = useState<ViewMode>("compact");
  const [query, setQuery] = useState("");
  const [showPrecision, setShowPrecision] = useState(false);
  const [precision, setPrecision] = useState<PrecisionFilters>({ tags: [], offerTypes: [], regions: [] });
  const [sort, setSort] = useState<CatalogSort>("recommended");
  const [provider, setProvider] = useState("全部供应商");
  const [billing, setBilling] = useState<BillingFilter>("全部定价");
  const [priceUnit, setPriceUnit] = useState<PriceUnit>("1M");
  const providers = useMemo(() => ["全部供应商", ...new Set(catalogRepository.list({ modality }).map((offer) => offer.family))], [modality]);
  const catalogFilter = useMemo(() => ({
      modality,
      kind: filter === "全部供给" ? undefined : filter,
      query,
      tags: precision.tags,
      offerTypes: precision.offerTypes,
      regions: precision.regions,
      maxLatencySeconds: precision.maxLatencySeconds,
      minContextWindow: precision.minContextWindow,
      protocol: precision.protocol,
      providers: provider === "全部供应商" ? undefined : [provider],
      billingTypes: billing === "全部定价" ? undefined : [billing],
      sort,
  }), [billing, filter, modality, precision, provider, query, sort]);
  const catalogResource = useCatalogModels(catalogFilter);
  const offers = catalogResource.data ?? [];
  const catalogState = catalogResource.status;

  const sourceCount = offers.reduce((total, offer) => total + offer.sources.length, 0);

  const chooseModality = (next: ModelModality) => {
    setModality(next);
    setFilter("全部供给");
    setQuery("");
    setPrecision({ tags: [], offerTypes: [], regions: [] });
    setProvider("全部供应商");
    setBilling("全部定价");
  };

  const precisionCount = precision.tags.length
    + precision.offerTypes.length
    + precision.regions.length
    + Number(precision.maxLatencySeconds !== undefined)
    + Number(precision.minContextWindow !== undefined)
    + Number(precision.protocol !== undefined);

  const resetPrecision = () => setPrecision({ tags: [], offerTypes: [], regions: [] });
  const resetAllFilters = () => {
    setFilter("全部供给");
    setProvider("全部供应商");
    setBilling("全部定价");
    resetPrecision();
    setQuery("");
  };

  const activeFilters = [
    filter !== "全部供给" ? { label: filter, onRemove: () => setFilter("全部供给") } : null,
    provider !== "全部供应商" ? { label: provider, onRemove: () => setProvider("全部供应商") } : null,
    billing !== "全部定价" ? { label: billing, onRemove: () => setBilling("全部定价") } : null,
    ...precision.tags.map((tag) => ({ label: tag, onRemove: () => setPrecision((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) })) })),
    ...precision.regions.map((region) => ({ label: region, onRemove: () => setPrecision((current) => ({ ...current, regions: current.regions.filter((item) => item !== region) })) })),
    precision.protocol ? { label: precision.protocol, onRemove: () => setPrecision((current) => ({ ...current, protocol: undefined })) } : null,
    precision.minContextWindow ? { label: `上下文 ≥ ${Math.round(precision.minContextWindow / 1000)}K`, onRemove: () => setPrecision((current) => ({ ...current, minContextWindow: undefined })) } : null,
    precision.maxLatencySeconds ? { label: `响应 ≤ ${precision.maxLatencySeconds}s`, onRemove: () => setPrecision((current) => ({ ...current, maxLatencySeconds: undefined })) } : null,
  ].filter((item): item is { label: string; onRemove: () => void } => Boolean(item));

  return (
    <main className="market-page">
      <header className="market-header">
        <div><h1>模型广场</h1><p>先看它适合做什么，再比较价格、速度和稳定性。</p></div>
        <label className="catalog-search">
          <Search size={14} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型、厂商或用途" />
        </label>
      </header>

      <section className="market-controls" aria-label="模型筛选与结果工具栏">
        <div className="market-filter-bar">
          <div className="filter-bar-title"><SlidersHorizontal size={13} /><span>筛选</span></div>
          <div className="modality-switcher" aria-label="按生成类型筛选模型">
            {MODALITIES.map(({ id, title, Icon }) => {
              const count = catalogRepository.list({ modality: id }).length;
              return <button key={id} type="button" data-active={modality === id} onClick={() => chooseModality(id)}><Icon size={13} /><span>{title}</span><small>{count}</small></button>;
            })}
          </div>
          <div className="control-divider" />
          <div className="primary-filter-bar" aria-label="常用筛选">
            <label className="filter-select"><span>供给</span><select aria-label="供给类型" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}><option value="全部供给">全部</option><option value="闭源 API">闭源 API</option><option value="开放权重">开放权重</option></select></label>
            <label className="filter-select"><span>供应商</span><select aria-label="供应商" value={provider} onChange={(event) => setProvider(event.target.value)}>{providers.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <label className="filter-select"><span>计费</span><select aria-label="定价方式" value={billing} onChange={(event) => setBilling(event.target.value as BillingFilter)}><option value="全部定价">全部</option>{BILLING_FILTERS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            <button className="precision-trigger" type="button" aria-expanded={showPrecision} onClick={() => setShowPrecision((current) => !current)}><SlidersHorizontal size={13} />更多筛选{precisionCount > 0 && <b>{precisionCount}</b>}</button>
          </div>
        </div>
        <div className="result-tools">
          <div className="price-mode-switch" aria-label="价格显示模式">
            <button type="button" data-active={priceUnit === "1M"} onClick={() => setPriceUnit("1M")}>标准</button>
            <button type="button" data-active={priceUnit === "1K"} onClick={() => setPriceUnit("1K")}>每 1K</button>
          </div>
          <label className="catalog-sort">
            <span>排序</span>
            <select aria-label="模型排序" value={sort} onChange={(event) => setSort(event.target.value as CatalogSort)}>
              {SORT_OPTIONS.filter((option) => modality === "语言" || option.id !== "context").map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <div className="view-switch" aria-label="切换模型呈现方式">
            {VIEWS.map(({ id, label, Icon }) => (
              <button key={id} type="button" aria-label={label} title={label} data-active={view === id} onClick={() => setView(id)}><Icon size={14} /><span>{label}</span></button>
            ))}
          </div>
        </div>
      </section>

      {activeFilters.length > 0 && <div className="active-filter-summary" aria-label="已选筛选条件"><span>已选</span>{activeFilters.map((item) => <button key={item.label} type="button" onClick={item.onRemove}>{item.label}<X size={11} /></button>)}<button className="clear-all-filters" type="button" onClick={resetAllFilters}>清空</button></div>}

      {showPrecision && <AdvancedFilterPanel modality={modality} precision={precision} setPrecision={setPrecision} onReset={resetPrecision} />}

      <section className="market-browser-layout">
        <section className="catalog-section">
          <div className="catalog-meta"><span>{offers.length} 个模型 · {sourceCount} 个可切换来源</span><span>{catalogState === "loading" ? "正在更新目录…" : catalogState === "error" ? "目录更新失败，显示上次结果" : "输入 / 输出价格、延迟与成功率均来自最近一次探测"}</span></div>
          <div className="catalog-layout">
            {view === "compact" && <CompactResults offers={offers} priceUnit={priceUnit} onOpenDetail={(offer) => onOpenDetail(offer.id)} onReset={resetAllFilters} />}
            {view === "cards" && <CardResults offers={offers} priceUnit={priceUnit} onOpenDetail={(offer) => onOpenDetail(offer.id)} onReset={resetAllFilters} />}
          </div>
        </section>
      </section>
    </main>
  );
}

function AdvancedFilterPanel({ modality, precision, setPrecision, onReset }: {
  modality: ModelModality;
  precision: PrecisionFilters;
  setPrecision: React.Dispatch<React.SetStateAction<PrecisionFilters>>;
  onReset: () => void;
}) {
  const selectedCount = precision.tags.length + precision.offerTypes.length + precision.regions.length + Number(precision.maxLatencySeconds !== undefined) + Number(precision.minContextWindow !== undefined) + Number(precision.protocol !== undefined);
  return (
    <section className="advanced-filter-panel" aria-label="更多模型筛选">
      <div className="advanced-filter-head"><div><strong>更多筛选</strong><span>只在需要时展开，用于精确比较能力和线路。</span></div><button type="button" onClick={onReset} disabled={selectedCount === 0}><RotateCcw size={12} />重置</button></div>
      <div className="advanced-filter-grid">
      <FilterSection title="模型标签">
        {FEATURE_FILTERS[modality].map((tag) => <FacetButton key={tag} active={precision.tags.includes(tag)} onClick={() => setPrecision((current) => ({ ...current, tags: toggleValue(current.tags, tag) }))}>{tag}</FacetButton>)}
      </FilterSection>
      <FilterSection title="端点与地区">
        {PROTOCOL_FILTERS.map((protocol) => <FacetButton key={protocol} active={precision.protocol === protocol} onClick={() => setPrecision((current) => ({ ...current, protocol: current.protocol === protocol ? undefined : protocol }))}>{protocol}</FacetButton>)}
        {REGION_FILTERS.map((region) => <FacetButton key={region} active={precision.regions.includes(region)} onClick={() => setPrecision((current) => ({ ...current, regions: toggleValue(current.regions, region) }))}>{region}</FacetButton>)}
      </FilterSection>
      <FilterSection title="上下文与响应">
        <label className="facet-select"><span>上下文</span><select aria-label="最小上下文" value={precision.minContextWindow ?? ""} onChange={(event) => setPrecision((current) => ({ ...current, minContextWindow: event.target.value ? Number(event.target.value) : undefined }))}>{CONTEXT_FILTERS.map((option) => <option key={option.label} value={option.value ?? ""}>{option.label}</option>)}</select></label>
        <label className="facet-select"><span>响应</span><select aria-label="响应上限" value={precision.maxLatencySeconds ?? ""} onChange={(event) => setPrecision((current) => ({ ...current, maxLatencySeconds: event.target.value ? Number(event.target.value) : undefined }))}>{LATENCY_FILTERS.map((option) => <option key={option.label} value={option.value ?? ""}>{option.label}</option>)}</select></label>
      </FilterSection>
      </div>
    </section>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="catalog-filter-section"><h3>{title}</h3><div>{children}</div></section>;
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="precision-group"><span>{label}</span><div>{children}</div></div>;
}

function FacetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className="facet-button" type="button" data-active={active} aria-pressed={active} onClick={onClick}>{children}</button>;
}

export function ModelDetailPage({
  modelId,
  onBack,
  onOpenWorkspace,
}: {
  modelId: string;
  onBack: () => void;
  onOpenWorkspace: (selection: CatalogSelection) => void;
}) {
  const offerResource = useCatalogModel(modelId);
  const offer = offerResource.data;
  const [access, setAccess] = useState<AccessSelection | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setAccess(null);
  }, [modelId]);

  if (!offer && offerResource.status === "loading") {
    return (
      <main className="market-page model-detail-page">
        <nav className="detail-nav" aria-label="模型详情导航"><button type="button" onClick={onBack}><ArrowLeft size={14} />返回模型广场</button></nav>
        <div className="catalog-empty">正在加载模型信息…</div>
      </main>
    );
  }

  if (!offer) {
    return (
      <main className="market-page model-detail-page">
        <nav className="detail-nav" aria-label="模型详情导航"><button type="button" onClick={onBack}><ArrowLeft size={14} />返回模型广场</button></nav>
        <div className="catalog-empty">未找到这个模型，可能已下架或链接有误。</div>
      </main>
    );
  }

  return (
    <main className="market-page model-detail-page">
      <ModelDetail offer={offer} onBack={onBack} onChooseSource={(source) => setAccess({ offer, source })} />
      {access && <AccessDialog selection={access} onClose={() => setAccess(null)} onContinue={() => onOpenWorkspace(access)} />}
    </main>
  );
}

function CompactResults({ offers, priceUnit, onOpenDetail, onReset }: { offers: ModelOffer[]; priceUnit: PriceUnit; onOpenDetail: (offer: ModelOffer) => void; onReset: () => void }) {
  return (
    <div className="catalog-results">
      <div className="result-header" aria-hidden="true"><span>模型</span><span>适合</span><span>可选来源</span><span>价格</span><span>性能</span><span>状态</span><span>操作</span></div>
      <div className="offer-list">
        {offers.map((offer) => (
          <article className="offer-row" key={offer.id}>
            <span className="model-identity">
              <span className="model-glyph" aria-hidden="true">{offer.kind === "开放权重" ? <Cpu size={15} /> : <Code2 size={15} />}</span>
              <span><span className="model-title-line"><strong>{offer.name}</strong><small>{offer.family}</small></span><code className="model-id">{offer.modelId}</code><span className="model-summary">{offer.summary}</span></span>
            </span>
            <span className="offer-use">{offer.tags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}</span>
            <span className="offer-fact"><small>{offer.sources[0]?.recommended ? "主来源" : "可切换来源"}</small><strong>{offer.sources.length} 个来源</strong><em>{offer.sources[0]?.mode ?? offer.offerType}</em></span>
            <span className="offer-price"><strong>{inputPrice(offer, priceUnit)}</strong><small>{outputPrice(offer, priceUnit)}</small></span>
            <span className="offer-latency"><strong>{offer.performance?.latency ?? offer.latency}</strong><small>{offer.performance?.throughput ?? "吞吐待测"}</small></span>
            <span className="offer-health"><strong><i />{offer.performance?.successRate ?? offer.health}</strong><small>{offer.performance?.checkedAt ?? "24h 窗口"}</small></span>
            <button className="row-action" type="button" onClick={() => onOpenDetail(offer)}>查看<ChevronRight size={12} /></button>
          </article>
        ))}
        {offers.length === 0 && <EmptyResults onReset={onReset} />}
      </div>
    </div>
  );
}

function CardResults({ offers, priceUnit, onOpenDetail, onReset }: { offers: ModelOffer[]; priceUnit: PriceUnit; onOpenDetail: (offer: ModelOffer) => void; onReset: () => void }) {
  if (offers.length === 0) return <div className="catalog-results"><EmptyResults onReset={onReset} /></div>;
  return (
    <div className="model-card-grid">
      {offers.map((offer) => (
        <article className="model-card" key={offer.id}>
          <span className="model-card-head"><span><strong>{offer.name}</strong><small>{offer.family}</small></span><em>{offer.kind}</em></span>
          <code className="model-card-id">{offer.modelId}</code>
          <span className="model-card-summary">{offer.summary}</span>
          <span className="model-card-facts">
            <span><small>{offer.pricing?.input ? "输入 / 输出" : "单元价格"}</small><strong>{inputPrice(offer, priceUnit)} · {outputPrice(offer, priceUnit)}</strong></span>
            <span><small>响应 / 吞吐</small><strong>{offer.performance?.latency ?? offer.latency} · {offer.performance?.throughput ?? "—"}</strong></span>
            <span><small>最近成功率</small><strong className="card-health"><i />{offer.performance?.successRate ?? offer.health}</strong></span>
            <span><small>来源 / 接口</small><strong>{offer.sources.length} 个 · {offer.protocol}</strong></span>
          </span>
          <span className="model-card-footer"><small>{offer.sources[0] ? `${offer.sources[0].recommended ? "主来源" : "来源"} · ${offer.sources[0].name}` : offer.protocol}</small><button type="button" onClick={() => onOpenDetail(offer)}>查看详情<ChevronRight size={12} /></button></span>
        </article>
      ))}
    </div>
  );
}

function pricePrimary(offer: ModelOffer): string {
  return offer.pricing?.input ?? offer.pricing?.output ?? offer.price;
}

function priceSecondary(offer: ModelOffer): string {
  if (offer.pricing?.input && offer.pricing.output) return `输出 ${offer.pricing.output}${offer.pricing.unit}`;
  if (offer.pricing?.output) return `${offer.pricing.unit} · ${offer.pricing.billing}`;
  return offer.unit;
}

function inputPrice(offer: ModelOffer, unit: PriceUnit = "1M"): string {
  if (!offer.pricing?.input) return offer.price;
  return unit === "1K" ? `${formatPerThousand(offer.pricing.input)} / 1K` : `${offer.pricing.input}${offer.pricing.unit}`;
}

function outputPrice(offer: ModelOffer, unit: PriceUnit = "1M"): string {
  if (offer.pricing?.output) return unit === "1K" ? `输出 ${formatPerThousand(offer.pricing.output)} / 1K` : `输出 ${offer.pricing.output}${offer.pricing.unit}`;
  return priceSecondary(offer);
}

function formatPerThousand(price: string): string {
  const numeric = Number(price.replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? `¥ ${(numeric / 1000).toFixed(4)}` : price;
}

function ModelDetail({ offer, onBack, onChooseSource }: { offer: ModelOffer; onBack: () => void; onChooseSource: (source: SupplyOption) => void }) {
  const [detailTab, setDetailTab] = useState<"overview" | "performance" | "api">("overview");
  return (
    <>
      <nav className="detail-nav" aria-label="模型详情导航"><button type="button" onClick={onBack}><ArrowLeft size={14} />返回模型广场</button></nav>
      <header className="detail-header">
        <div className="detail-title">
          <span className="detail-glyph">{offer.kind === "开放权重" ? <Cpu size={20} /> : <Code2 size={20} />}</span>
          <div><span className="detail-badges"><i>{offer.modality}模型</i><i>{offer.kind}</i></span><h1>{offer.name}</h1><code>{offer.modelId}</code></div>
        </div>
        <p>{offer.summary}。下面只比较会影响选择的价格、速度和稳定性；选择后 Moyusi 会把专业配置放到正确的位置。</p>
      </header>

      <section className="detail-facts" aria-label="模型核心信息">
        <div><span>适合</span><strong>{offer.tags.slice(0, 2).join("、")}</strong></div>
        <div><span>{offer.pricing?.input ? "输入 / 输出" : "单元价格"}</span><strong>{pricePrimary(offer)}</strong><small>{priceSecondary(offer)}</small></div>
        <div><span>响应 / 吞吐</span><strong>{offer.performance?.latency ?? offer.latency}</strong><small>{offer.performance?.throughput ?? "吞吐待测"}</small></div>
        <div><span>最近成功率</span><strong className="detail-health"><i />{offer.performance?.successRate ?? offer.health}</strong><small>{offer.performance?.checkedAt ?? "演示监测窗口"}</small></div>
      </section>

      <section className="detail-evidence" aria-label="模型能力与接入信息">
        <div><span>接口</span><strong>{offer.protocol}</strong></div>
        <div><span>{offer.specLabel}</span><strong>{offer.specValue}</strong></div>
        <div><span>定价方式</span><strong>{offer.pricing?.billing ?? "按量计费"}</strong></div>
        <div><span>可用能力</span><strong>{offer.tags.slice(0, 4).join(" · ")}</strong></div>
      </section>

      <nav className="detail-tabs" aria-label="模型详情分区">
        <button type="button" data-active={detailTab === "overview"} onClick={() => setDetailTab("overview")}>概览</button>
        <button type="button" data-active={detailTab === "performance"} onClick={() => setDetailTab("performance")}>性能</button>
        <button type="button" data-active={detailTab === "api"} onClick={() => setDetailTab("api")}>API 接入</button>
      </nav>

      {detailTab === "overview" && <section className="detail-sources">
        <div className="detail-section-head"><div><h2>同一模型，选择不同来源</h2><p>模型能力相同，来源会影响价格、速度、稳定性和结算方式。</p></div><span>{offer.sources.length} 个可用来源</span></div>
        <div className="source-table">
          <div className="source-table-head" aria-hidden="true"><span>模型来源</span><span>怎么付费</span><span>价格</span><span>响应 / 排队</span><span>稳定性</span><span>操作</span></div>
          {offer.sources.map((source) => (
            <article className="detail-source-row" key={`${offer.id}-${source.name}`}>
              <div><strong>{source.name}{source.recommended && <em className="source-recommended">主来源</em>}</strong><small>{source.recommended ? "主来源 · " : "备用来源 · "}{source.note}</small></div>
              <span>{source.mode}</span>
              <strong className="source-price">{source.price}</strong>
              <span className="source-latency">{source.latency}</span>
              <span className="source-health"><i />{source.health}</span>
              <button type="button" onClick={() => onChooseSource(source)}>{sourceActionLabel(source.mode)}<ChevronRight size={12} /></button>
            </article>
          ))}
        </div>
        <div className="detail-specs" aria-label="模型规格与能力">
          <div className="detail-spec-card">
            <div className="detail-section-head"><div><h2>模型规格</h2><p>把会影响接入判断的参数集中在这里。</p></div></div>
            <div className="spec-grid">
              <div><span>最大输出</span><strong>{offer.maxOutputTokens ? `${Math.round(offer.maxOutputTokens / 1024)}K tokens` : "按任务规格"}</strong></div>
              <div><span>知识截止</span><strong>{offer.knowledgeCutoff ?? "以模型版本为准"}</strong></div>
              <div><span>许可证</span><strong>{offer.license ?? "未声明"}</strong></div>
              <div><span>数据留存</span><strong>{offer.dataRetention ?? "以来源政策为准"}</strong></div>
              <div><span>接口兼容</span><strong>{offer.endpointTypes?.join(" · ") ?? offer.protocol}</strong></div>
              <div><span>模型分组</span><strong>{offer.groups?.join(" · ") ?? "标准线路"}</strong></div>
            </div>
          </div>
          <div className="detail-spec-card">
            <div className="detail-section-head"><div><h2>能力矩阵</h2><p>能力由目录元数据与来源探测共同确认。</p></div></div>
            <div className="capability-list">{(offer.capabilities ?? offer.tags).map((capability) => <span key={capability}><Check size={11} />{capability}</span>)}</div>
          </div>
        </div>
      </section>}

      {detailTab === "performance" && <section className="detail-performance">
        <div className="detail-section-head"><div><h2>线路性能</h2><p>指标来自最近探测窗口；不同地区和负载下的实际结果会变化。</p></div><span>{offer.performance?.checkedAt ?? "待更新"}</span></div>
        <div className="performance-table">
          <div className="performance-row performance-head"><span>来源</span><span>吞吐</span><span>p50 / p95</span><span>成功率</span><span>样本 / 地区</span><span>状态</span></div>
          {offer.sources.map((source) => <div className="performance-row" key={`${offer.id}-perf-${source.name}`}><strong>{source.name}</strong><span>{source.throughput ?? "—"}</span><span>{source.latencyP50 && source.latencyP95 ? `${source.latencyP50} / ${source.latencyP95}` : source.latency}</span><span className="source-health"><i />{source.successRate ?? source.health}</span><span>{source.sampleCount ? `${source.sampleCount} · ${source.region ?? "—"}` : source.region ?? "—"}</span><span>{source.recommended ? "主来源" : "备用来源"}</span></div>)}
        </div>
        <div className="evidence-note"><ShieldCheck size={14} /><span>成功率是探测结果，不等同于合同 SLA；生产环境会同时展示地区、样本数、p50/p95 和更新时间。</span></div>
      </section>}

      {detailTab === "api" && <section className="detail-api">
        <div className="detail-section-head"><div><h2>调用示例</h2><p>复制后只需替换 Moyusi API Key 和模型 ID；不同协议的参数能力会在请求前校验。</p></div><span>{offer.protocol}</span></div>
        <div className="api-code-card"><div className="api-code-head"><span>cURL · {offer.protocol}</span><button type="button" onClick={() => navigator.clipboard?.writeText(apiSnippet(offer))}>复制示例</button></div><pre><code>{apiSnippet(offer)}</code></pre></div>
        <div className="api-parameter-grid"><div><strong>认证</strong><span>Authorization: Bearer &lt;MOYUSI_KEY&gt;</span></div><div><strong>模型</strong><span>{offer.modelId}</span></div><div><strong>流式</strong><span>{offer.modality === "语言" ? "支持 SSE" : "按任务状态查询"}</span></div><div><strong>工具</strong><span>{offer.tags.includes("工具调用") ? "支持函数 / MCP 适配" : "以模型能力为准"}</span></div></div>
      </section>}

      <section className="access-principle">
        <strong>你只需做选择</strong>
        <span>使用 Moyusi 余额的来源可直接切换；使用自己的账号或服务器时，我们会引导完成一次连接；持续计费的专属算力会在创建前再次确认。</span>
      </section>

      <details className="technical-details">
        <summary>开发者信息</summary>
        <div><span>模型标识</span><code>{offer.modelId}</code><span>兼容方式</span><code>{offer.protocol}</code><span>{offer.specLabel}</span><code>{offer.specValue}</code></div>
      </details>
    </>
  );
}

function apiSnippet(offer: ModelOffer): string {
  const endpoint = offer.protocol.includes("Anthropic") ? "/v1/messages" : "/v1/chat/completions";
  return [
    `curl https://api.moyusi.com${endpoint} \\`,
    `  -H "Authorization: Bearer $MOYUSI_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    "  -d '{",
    `    \"model\": \"${offer.modelId}\",`,
    '    "messages": [{"role": "user", "content": "Hello"}],',
    '    "stream": true',
    "  }'",
  ].join("\n");
}

function AccessDialog({ selection, onClose, onContinue }: { selection: AccessSelection; onClose: () => void; onContinue: () => void }) {
  const flow = getAccessFlow(selection.source.mode);
  const FlowIcon = flow.actionKind === "credential" ? KeyRound : flow.actionKind === "endpoint" ? Server : flow.actionKind === "budget" ? CreditCard : WalletCards;
  return (
    <div className="access-dialog-backdrop" role="presentation">
      <section className="access-dialog" role="dialog" aria-modal="true" aria-labelledby="access-dialog-title">
        <header><div><span className="access-flow-icon"><FlowIcon size={17} /></span><div><h2 id="access-dialog-title">{flow.title}</h2><p>{flow.description}</p></div></div><button type="button" aria-label="关闭" onClick={onClose}><X size={15} /></button></header>
        <dl className="access-summary">
          <div><dt>模型</dt><dd>{selection.offer.name}</dd></div>
          <div><dt>供给</dt><dd>{selection.source.name}</dd></div>
          <div><dt>结算</dt><dd>{selection.source.mode}</dd></div>
          <div><dt>价格</dt><dd>{selection.source.price}</dd></div>
        </dl>
        <div className="access-status"><Check size={14} /><div><strong>{flow.status}</strong><p>{flow.note}</p></div></div>
        <footer><button type="button" onClick={onClose}>返回选择</button><button className="button button-primary" type="button" onClick={onContinue}>{flow.action}<ChevronRight size={13} /></button></footer>
      </section>
    </div>
  );
}

function EmptyResults({ onReset }: { onReset: () => void }) {
  return <div className="catalog-empty"><p>没有匹配项。可以清除精确筛选，或换一个任务类型。</p><button type="button" onClick={onReset}>清除精确筛选</button></div>;
}
