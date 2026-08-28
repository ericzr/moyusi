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
  Rows3,
  Search,
  Server,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import {
  type ModelKind,
  type ModelModality,
  type ModelOffer,
  type CatalogSelection,
  type SupplyOption,
} from "../../domain/catalog";
import { getAccessFlow, sourceActionLabel } from "../../domain/accessPolicy";
import { catalogRepository } from "../../services/catalogRepository";

type Filter = "全部供给" | ModelKind;
type ViewMode = "compact" | "cards";
type AccessSelection = CatalogSelection;

const MODALITIES: Array<{ id: ModelModality; title: string; Icon: typeof MessageSquareText }> = [
  { id: "语言", title: "语言", Icon: MessageSquareText },
  { id: "图片", title: "图片", Icon: ImageIcon },
  { id: "视频", title: "视频", Icon: Video },
];

const VIEWS: Array<{ id: ViewMode; label: string; Icon: typeof Rows3 }> = [
  { id: "compact", label: "紧凑列表", Icon: Rows3 },
  { id: "cards", label: "卡片", Icon: LayoutGrid },
];

export function ModelSquare({ onOpenDetail }: { onOpenDetail: (modelId: string) => void }) {
  const [modality, setModality] = useState<ModelModality>("语言");
  const [filter, setFilter] = useState<Filter>("全部供给");
  const [view, setView] = useState<ViewMode>("compact");
  const [query, setQuery] = useState("");
  const offers = useMemo(() => {
    return catalogRepository.list({
      modality,
      kind: filter === "全部供给" ? undefined : filter,
      query,
    });
  }, [filter, modality, query]);

  const sourceCount = offers.reduce((total, offer) => total + offer.sources.length, 0);

  const chooseModality = (next: ModelModality) => {
    setModality(next);
    setFilter("全部供给");
    setQuery("");
  };

  return (
    <main className="market-page">
      <header className="market-header">
        <div><h1>模型广场</h1><p>先看它适合做什么，再比较价格、速度和稳定性。</p></div>
        <label className="catalog-search">
          <Search size={14} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型、厂商或用途" />
        </label>
      </header>

      <section className="market-controls" aria-label="模型筛选与视图">
        <div className="modality-switcher" aria-label="按生成类型选择模型">
          {MODALITIES.map(({ id, title, Icon }) => {
            const count = catalogRepository.list({ modality: id }).length;
            return <button key={id} type="button" data-active={modality === id} onClick={() => chooseModality(id)}><Icon size={14} /><span>{title}</span><small>{count}</small></button>;
          })}
        </div>
        <div className="control-divider" />
        <div className="filter-tabs" aria-label="按开放性筛选模型">
          {(["全部供给", "闭源 API", "开放权重"] as Filter[]).map((item) => (
            <button key={item} type="button" data-active={filter === item} onClick={() => setFilter(item)}>{item}</button>
          ))}
        </div>
        <div className="view-switch" aria-label="切换模型呈现方式">
          {VIEWS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-label={label} title={label} data-active={view === id} onClick={() => setView(id)}><Icon size={14} /><span>{label}</span></button>
          ))}
        </div>
      </section>

      <section className="catalog-section">
        <div className="catalog-meta"><span>{offers.length} 个模型 · {sourceCount} 个可切换来源</span><span>价格、延迟与状态为演示数据</span></div>
        <div className="catalog-layout">
          {view === "compact" && <CompactResults offers={offers} onOpenDetail={(offer) => onOpenDetail(offer.id)} />}
          {view === "cards" && <CardResults offers={offers} onOpenDetail={(offer) => onOpenDetail(offer.id)} />}
        </div>
      </section>
    </main>
  );
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
  const offer = catalogRepository.getById(modelId);
  const [access, setAccess] = useState<AccessSelection | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    setAccess(null);
  }, [modelId]);

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

function CompactResults({ offers, onOpenDetail }: { offers: ModelOffer[]; onOpenDetail: (offer: ModelOffer) => void }) {
  return (
    <div className="catalog-results">
      <div className="result-header" aria-hidden="true"><span>模型</span><span>适合</span><span>来源</span><span>起始价格</span><span>响应 / 排队</span><span>稳定性</span><span>操作</span></div>
      <div className="offer-list">
        {offers.map((offer) => (
          <article className="offer-row" key={offer.id}>
            <span className="model-identity">
              <span className="model-glyph" aria-hidden="true">{offer.kind === "开放权重" ? <Cpu size={15} /> : <Code2 size={15} />}</span>
              <span><span className="model-title-line"><strong>{offer.name}</strong><small>{offer.family}</small></span><span className="model-summary">{offer.summary}</span></span>
            </span>
            <span className="offer-use">{offer.tags.slice(0, 2).map((tag) => <small key={tag}>{tag}</small>)}</span>
            <span className="offer-fact"><small>{offer.kind}</small><strong>{offer.sources.length} 个来源</strong><em>{offer.offerType}</em></span>
            <span className="offer-price"><strong>{offer.price}</strong><small>{offer.unit}</small></span>
            <span className="offer-latency"><strong>{offer.latency}</strong><small>推荐来源 · 演示</small></span>
            <span className="offer-health"><strong><i />{offer.health}</strong><small>24h 窗口</small></span>
            <button className="row-action" type="button" onClick={() => onOpenDetail(offer)}>查看<ChevronRight size={12} /></button>
          </article>
        ))}
        {offers.length === 0 && <EmptyResults />}
      </div>
    </div>
  );
}

function CardResults({ offers, onOpenDetail }: { offers: ModelOffer[]; onOpenDetail: (offer: ModelOffer) => void }) {
  if (offers.length === 0) return <div className="catalog-results"><EmptyResults /></div>;
  return (
    <div className="model-card-grid">
      {offers.map((offer) => (
        <article className="model-card" key={offer.id}>
          <span className="model-card-head"><span><strong>{offer.name}</strong><small>{offer.family}</small></span><em>{offer.kind}</em></span>
          <span className="model-card-summary">{offer.summary}</span>
          <span className="model-card-facts">
            <span><small>起始价格</small><strong>{offer.price}</strong></span>
            <span><small>响应 / 排队</small><strong>{offer.latency}</strong></span>
            <span><small>状态</small><strong className="card-health"><i />{offer.health}</strong></span>
            <span><small>供给来源</small><strong>{offer.sources.length} 个</strong></span>
          </span>
          <span className="model-card-footer"><small>{offer.protocol}</small><button type="button" onClick={() => onOpenDetail(offer)}>查看详情<ChevronRight size={12} /></button></span>
        </article>
      ))}
    </div>
  );
}

function ModelDetail({ offer, onBack, onChooseSource }: { offer: ModelOffer; onBack: () => void; onChooseSource: (source: SupplyOption) => void }) {
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
        <div><span>推荐来源响应 / 排队</span><strong>{offer.latency}</strong><small>演示窗口</small></div>
        <div><span>起始价格</span><strong>{offer.price}</strong><small>{offer.unit}</small></div>
        <div><span>24h 状态</span><strong className="detail-health"><i />{offer.health}</strong><small>演示监测窗口</small></div>
      </section>

      <section className="detail-sources">
        <div className="detail-section-head"><div><h2>同一模型，选择不同来源</h2><p>模型能力相同，来源会影响价格、速度、稳定性和结算方式。</p></div><span>{offer.sources.length} 个可用来源</span></div>
        <div className="source-table">
          <div className="source-table-head" aria-hidden="true"><span>模型来源</span><span>怎么付费</span><span>价格</span><span>响应 / 排队</span><span>稳定性</span><span>操作</span></div>
          {offer.sources.map((source) => (
            <article className="detail-source-row" key={`${offer.id}-${source.name}`}>
              <div><strong>{source.name}{source.recommended && <em className="source-recommended">推荐</em>}</strong><small>{source.note}</small></div>
              <span>{source.mode}</span>
              <strong className="source-price">{source.price}</strong>
              <span className="source-latency">{source.latency}</span>
              <span className="source-health"><i />{source.health}</span>
              <button type="button" onClick={() => onChooseSource(source)}>{sourceActionLabel(source.mode)}<ChevronRight size={12} /></button>
            </article>
          ))}
        </div>
      </section>

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

function EmptyResults() {
  return <div className="catalog-empty">没有匹配项。清除搜索或切换供给类型。</div>;
}
