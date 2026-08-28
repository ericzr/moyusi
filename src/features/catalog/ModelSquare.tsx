import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleGauge,
  Code2,
  Cpu,
  Image as ImageIcon,
  MessageSquareText,
  Search,
  ShieldCheck,
  Video,
} from "lucide-react";
import { MODEL_OFFERS, type ModelKind, type ModelModality, type ModelOffer } from "./catalogData";

type Filter = "全部供给" | ModelKind;

const MODALITIES: Array<{
  id: ModelModality;
  title: string;
  description: string;
  Icon: typeof MessageSquareText;
}> = [
  { id: "语言", title: "语言模型", description: "对话、代码、推理与文档", Icon: MessageSquareText },
  { id: "图片", title: "图片模型", description: "生成、编辑与视觉工作流", Icon: ImageIcon },
  { id: "视频", title: "视频模型", description: "文生视频、图生视频与运镜", Icon: Video },
];

export function ModelSquare({ onOpenWorkspace }: { onOpenWorkspace: (offer?: ModelOffer) => void }) {
  const [modality, setModality] = useState<ModelModality>("语言");
  const [filter, setFilter] = useState<Filter>("全部供给");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(MODEL_OFFERS[0].id);
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

  const selected = offers.find((offer) => offer.id === selectedId) ?? offers[0] ?? null;
  const modalityMeta = MODALITIES.find((item) => item.id === modality)!;

  const chooseModality = (next: ModelModality) => {
    setModality(next);
    setFilter("全部供给");
    setQuery("");
    const first = MODEL_OFFERS.find((offer) => offer.modality === next);
    if (first) setSelectedId(first.id);
  };

  return (
    <main className="market-page">
      <section className="market-intro">
        <div>
          <h1>先选任务，再选模型。</h1>
          <p>从语言、图片或视频开始，再比较闭源 API、开放权重、不同中转站与算力来源。一次接入，统一进入 Moyusi 路由和余额体系。</p>
        </div>
        <div className="market-intro-actions">
          <span><ShieldCheck size={14} />来源与证据可追溯</span>
          <button className="button button-quiet" type="button" onClick={() => onOpenWorkspace()}>查看工作台 <ArrowUpRight size={14} /></button>
        </div>
      </section>

      <section className="modality-switcher" aria-label="按生成类型选择模型">
        {MODALITIES.map(({ id, title, description, Icon }) => {
          const count = MODEL_OFFERS.filter((offer) => offer.modality === id).length;
          return (
            <button key={id} type="button" data-active={modality === id} onClick={() => chooseModality(id)}>
              <span className="modality-icon"><Icon size={18} /></span>
              <span className="modality-copy"><strong>{title}</strong><small>{description}</small></span>
              <span className="modality-count">{String(count).padStart(2, "0")}</span>
            </button>
          );
        })}
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <h2>{modalityMeta.title}</h2>
            <p>{modalityMeta.description}。先看模型能力，再展开比较真实供给线路。</p>
          </div>
          <label className="catalog-search">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`搜索${modalityMeta.title}或用途`} />
          </label>
        </div>

        <div className="catalog-toolbar">
          <div className="filter-tabs" aria-label="按开放性筛选模型">
            {(["全部供给", "闭源 API", "开放权重"] as Filter[]).map((item) => (
              <button key={item} type="button" data-active={filter === item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <span>{offers.length} 个模型 · 演示价格</span>
        </div>

        <div className="catalog-layout">
          <div className="catalog-results">
            <div className="result-header" aria-hidden="true">
              <span>模型</span><span>供给</span><span>能力</span><span>起始价格</span><span>状态</span><span />
            </div>
            <div className="offer-list">
              {offers.map((offer) => (
                <button className="offer-row" data-selected={selected?.id === offer.id} key={offer.id} type="button" onClick={() => setSelectedId(offer.id)}>
                  <span className="model-identity">
                    <span className="model-glyph" aria-hidden="true">{offer.kind === "开放权重" ? <Cpu size={17} /> : <Code2 size={17} />}</span>
                    <span>
                      <span className="model-title-line"><strong>{offer.name}</strong><small>{offer.family}</small></span>
                      <span className="model-summary">{offer.summary}</span>
                      <span className="tag-row">{offer.tags.slice(0, 3).map((tag) => <i key={tag}>{tag}</i>)}</span>
                    </span>
                  </span>
                  <span className="offer-fact"><small>{offer.kind}</small><strong>{offer.offerType}</strong><em>{offer.meta}</em></span>
                  <span className="offer-fact"><small>{offer.specLabel}</small><strong>{offer.specValue}</strong><em>{offer.protocol}</em></span>
                  <span className="offer-price"><strong>{offer.price}</strong><small>{offer.unit}</small></span>
                  <span className="offer-health"><strong><i />{offer.health}</strong><small>24h 演示窗口</small></span>
                  <ChevronRight className="row-arrow" size={15} />
                </button>
              ))}
              {offers.length === 0 && <div className="catalog-empty">没有匹配项。尝试清除搜索或切换供给类型。</div>}
            </div>
          </div>

          <aside className="model-inspector" aria-live="polite">
            {selected ? (
              <>
                <div className="inspector-heading">
                  <span className="model-glyph">{selected.kind === "开放权重" ? <Cpu size={18} /> : <Code2 size={18} />}</span>
                  <div><strong>{selected.name}</strong><span>{selected.family} · {selected.kind}</span></div>
                </div>
                <code className="model-id">{selected.modelId}</code>
                <p className="inspector-summary">{selected.summary}</p>

                <dl className="model-specs">
                  <div><dt>{selected.specLabel}</dt><dd>{selected.specValue}</dd></div>
                  <div><dt>兼容协议</dt><dd>{selected.protocol}</dd></div>
                  <div><dt>可用来源</dt><dd>{selected.sources.length} 个</dd></div>
                  <div><dt>路由状态</dt><dd>{selected.health}</dd></div>
                </dl>

                <div className="source-heading">
                  <strong>可用供给</strong>
                  <span><CircleGauge size={13} />价格与状态分开比较</span>
                </div>
                <div className="source-options">
                  {selected.sources.map((source) => (
                    <div className="source-option" key={`${selected.id}-${source.name}`}>
                      <div><strong>{source.name}</strong>{source.recommended && <span>推荐</span>}</div>
                      <small>{source.mode} · {source.note}</small>
                      <div><b>{source.price}</b><em><i />{source.health}</em></div>
                    </div>
                  ))}
                </div>

                <div className="inspector-note">生产目录会显示真实中转站名称、条款、探测时间与样本量；当前均为界面演示数据。</div>
                <button className="button button-primary inspector-action" type="button" onClick={() => setPrepared(selected)}>
                  {selected.offerType === "自有端点" ? "连接到工作台" : "选择并配置"}<ChevronRight size={14} />
                </button>
              </>
            ) : <div className="inspector-empty">选择一个模型查看供给方式。</div>}
          </aside>
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
