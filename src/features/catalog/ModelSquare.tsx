import { useMemo, useState } from "react";
import {
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Image as ImageIcon,
  LayoutGrid,
  MessageSquareText,
  Rows3,
  Search,
  Video,
} from "lucide-react";
import { MODEL_OFFERS, type ModelKind, type ModelModality, type ModelOffer } from "./catalogData";

type Filter = "全部供给" | ModelKind;
type ViewMode = "compact" | "cards";

const MODALITIES: Array<{
  id: ModelModality;
  title: string;
  Icon: typeof MessageSquareText;
}> = [
  { id: "语言", title: "语言", Icon: MessageSquareText },
  { id: "图片", title: "图片", Icon: ImageIcon },
  { id: "视频", title: "视频", Icon: Video },
];

const VIEWS: Array<{ id: ViewMode; label: string; Icon: typeof Rows3 }> = [
  { id: "compact", label: "紧凑列表", Icon: Rows3 },
  { id: "cards", label: "卡片", Icon: LayoutGrid },
];

export function ModelSquare({ onOpenWorkspace }: { onOpenWorkspace: (offer?: ModelOffer) => void }) {
  const [modality, setModality] = useState<ModelModality>("语言");
  const [filter, setFilter] = useState<Filter>("全部供给");
  const [view, setView] = useState<ViewMode>("compact");
  const [query, setQuery] = useState("");
  const [prepared, setPrepared] = useState<ModelOffer | null>(null);

  const offers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MODEL_OFFERS.filter((offer) => {
      const matchesModality = offer.modality === modality;
      const matchesKind = filter === "全部供给" || offer.kind === filter;
      const matchesQuery = !normalized || [offer.name, offer.modelId, offer.family, offer.summary, offer.tags.join(" ")].join(" ").toLowerCase().includes(normalized);
      return matchesModality && matchesKind && matchesQuery;
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
        <div><h1>模型广场</h1><p>先按任务类型选模型，再比较价格、线路与算力来源。</p></div>
        <label className="catalog-search">
          <Search size={14} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型、厂商或用途" />
        </label>
      </header>

      <section className="market-controls" aria-label="模型筛选与视图">
        <div className="modality-switcher" aria-label="按生成类型选择模型">
          {MODALITIES.map(({ id, title, Icon }) => {
            const count = MODEL_OFFERS.filter((offer) => offer.modality === id).length;
            return (
              <button key={id} type="button" data-active={modality === id} onClick={() => chooseModality(id)}>
                <Icon size={14} /><span>{title}</span><small>{count}</small>
              </button>
            );
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
            <button key={id} type="button" aria-label={label} title={label} data-active={view === id} onClick={() => setView(id)}>
              <Icon size={14} /><span>{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog-section">
        <div className="catalog-meta">
          <span>{offers.length} 个模型 · {sourceCount} 个供给来源</span>
          <span>报价与状态为演示数据</span>
        </div>

        <div className="catalog-layout">
          {view === "compact" && <CompactResults offers={offers} onPrepare={setPrepared} />}
          {view === "cards" && <CardResults offers={offers} onPrepare={setPrepared} />}
        </div>
      </section>

      {prepared && (
        <div className="selection-bar" role="status">
          <div><span className="selection-check"><Check size={14} /></span><div><strong>{prepared.name}</strong><span>{prepared.offerType} · 已准备加入工作台</span></div></div>
          <div><button type="button" onClick={() => setPrepared(null)}>取消</button><button className="button button-primary" type="button" onClick={() => onOpenWorkspace(prepared)}>继续配置</button></div>
        </div>
      )}
    </main>
  );
}

function CompactResults({ offers, onPrepare }: { offers: ModelOffer[]; onPrepare: (offer: ModelOffer) => void }) {
  return (
    <div className="catalog-results">
      <div className="result-header" aria-hidden="true"><span>模型</span><span>供给</span><span>能力</span><span>协议</span><span>起始价格</span><span>状态</span><span>操作</span></div>
      <div className="offer-list">
        {offers.map((offer) => (
          <article className="offer-row" key={offer.id}>
            <span className="model-identity">
              <span className="model-glyph" aria-hidden="true">{offer.kind === "开放权重" ? <Cpu size={15} /> : <Code2 size={15} />}</span>
              <span><span className="model-title-line"><strong>{offer.name}</strong><small>{offer.family}</small></span><span className="model-summary">{offer.summary}</span></span>
            </span>
            <span className="offer-fact"><small>{offer.kind}</small><strong>{offer.offerType}</strong><em>{offer.sources.length} 个来源</em></span>
            <span className="offer-fact"><small>{offer.specLabel}</small><strong>{offer.specValue}</strong></span>
            <span className="offer-protocol"><strong>{offer.protocol}</strong><small>{offer.sources.length} 个来源可用</small></span>
            <span className="offer-price"><strong>{offer.price}</strong><small>{offer.unit}</small></span>
            <span className="offer-health"><strong><i />{offer.health}</strong><small>24h 窗口</small></span>
            <button className="row-action" type="button" onClick={() => onPrepare(offer)}>配置<ChevronRight size={12} /></button>
          </article>
        ))}
        {offers.length === 0 && <EmptyResults />}
      </div>
    </div>
  );
}

function CardResults({ offers, onPrepare }: { offers: ModelOffer[]; onPrepare: (offer: ModelOffer) => void }) {
  if (offers.length === 0) return <div className="catalog-results"><EmptyResults /></div>;
  return (
    <div className="model-card-grid">
      {offers.map((offer) => (
        <article className="model-card" key={offer.id}>
          <span className="model-card-head">
            <span><strong>{offer.name}</strong><small>{offer.family}</small></span>
            <em>{offer.kind}</em>
          </span>
          <span className="model-card-summary">{offer.summary}</span>
          <span className="model-card-facts">
            <span><small>起始价格</small><strong>{offer.price}</strong></span>
            <span><small>{offer.specLabel}</small><strong>{offer.specValue}</strong></span>
            <span><small>状态</small><strong className="card-health"><i />{offer.health}</strong></span>
            <span><small>供给来源</small><strong>{offer.sources.length} 个</strong></span>
          </span>
          <span className="model-card-footer"><small>{offer.protocol}</small><button type="button" onClick={() => onPrepare(offer)}>配置<ChevronRight size={12} /></button></span>
        </article>
      ))}
    </div>
  );
}

function EmptyResults() {
  return <div className="catalog-empty">没有匹配项。清除搜索或切换供给类型。</div>;
}
