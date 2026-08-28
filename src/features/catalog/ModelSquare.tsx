import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, Code2, Cpu, Search, ShieldCheck, Sparkles } from "lucide-react";
import { MODEL_OFFERS, type ModelKind, type ModelOffer } from "./catalogData";

type Filter = "全部模型" | ModelKind;

export function ModelSquare({ onOpenWorkspace }: { onOpenWorkspace: (offer?: ModelOffer) => void }) {
  const [filter, setFilter] = useState<Filter>("全部模型");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ModelOffer | null>(null);

  const offers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return MODEL_OFFERS.filter((offer) => {
      const matchesKind = filter === "全部模型" || offer.kind === filter;
      const matchesQuery = !normalized || [offer.name, offer.family, offer.summary, offer.tags.join(" ")].join(" ").toLowerCase().includes(normalized);
      return matchesKind && matchesQuery;
    });
  }, [filter, query]);

  return (
    <main className="market-page">
      <section className="market-hero">
        <div className="hero-copy">
          <span className="section-kicker">MODEL ACCESS, WITHOUT THE SWITCHING COST</span>
          <h1>一处选模型，<br />一键带走工作环境。</h1>
          <p>闭源 API、开放模型算力与自有端点在同一个目录里比较。接入后，路由、MCP、Skills 和 Prompts 跟随你的工作环境进入工具。</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#catalog">浏览模型</a>
            <button className="button button-quiet" type="button" onClick={onOpenWorkspace}>查看工作台 <ArrowUpRight size={14} /></button>
          </div>
        </div>

        <aside className="hero-status" aria-label="当前工作环境摘要">
          <div className="status-heading">
            <span>当前工作环境</span>
            <span className="live-state"><i /> READY</span>
          </div>
          <strong>日常编程</strong>
          <p>已经为 Codex 配置稳定路由；Claude Code 有 2 项可迁移更新。</p>
          <dl>
            <div><dt>当前模型</dt><dd>GPT · Coding</dd></div>
            <div><dt>回退线路</dt><dd>2 条可用</dd></div>
            <div><dt>工作资产</dt><dd>13 项</dd></div>
          </dl>
          <button type="button" onClick={() => onOpenWorkspace()}>打开工作台 <ChevronRight size={14} /></button>
        </aside>
      </section>

      <section className="trust-strip" aria-label="产品能力">
        <div><ShieldCheck size={15} /><span>可验证线路</span><small>来源、价格、性能可追溯</small></div>
        <div><Cpu size={15} /><span>开放模型算力</span><small>共享、专属或自有端点</small></div>
        <div><Sparkles size={15} /><span>工作环境迁移</span><small>MCP、Skills、Prompts</small></div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-heading">
          <div>
            <span className="section-kicker">CURATED CATALOG</span>
            <h2>模型广场</h2>
            <p>按能力选择，再比较真实供给方式。以下名称与报价均为界面演示数据。</p>
          </div>
          <label className="catalog-search">
            <Search size={15} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索模型或用途" />
          </label>
        </div>

        <div className="catalog-toolbar">
          <div className="filter-tabs" aria-label="模型类型">
            {(["全部模型", "闭源 API", "开放权重"] as Filter[]).map((item) => (
              <button key={item} type="button" data-active={filter === item} onClick={() => setFilter(item)}>{item}</button>
            ))}
          </div>
          <span>{offers.length} 个经过策展的选择</span>
        </div>

        <div className="offer-list">
          {offers.map((offer) => (
            <article className="offer-row" key={offer.id}>
              <div className="model-identity">
                <span className="model-glyph" aria-hidden="true">{offer.kind === "开放权重" ? <Cpu size={18} /> : <Code2 size={18} />}</span>
                <div>
                  <div className="model-title-line"><h3>{offer.name}</h3><span>{offer.kind}</span></div>
                  <p>{offer.summary}</p>
                  <div className="tag-row">{offer.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                </div>
              </div>
              <div className="offer-fact"><span>供给方式</span><strong>{offer.offerType}</strong><small>{offer.route}</small></div>
              <div className="offer-fact"><span>上下文</span><strong>{offer.context}</strong><small>{offer.meta}</small></div>
              <div className="offer-fact health-fact"><span>24h 状态</span><strong><i />{offer.health}</strong><small>演示监测窗口</small></div>
              <div className="offer-price"><strong>{offer.price}</strong><span>{offer.unit}</span></div>
              <button className="offer-action" type="button" onClick={() => setSelected(offer)}>{offer.offerType === "自有端点" ? "连接" : "接入"}<ChevronRight size={14} /></button>
            </article>
          ))}
          {offers.length === 0 && <div className="catalog-empty">没有匹配项。尝试清除搜索或切换模型类型。</div>}
        </div>
      </section>

      {selected && (
        <div className="selection-bar" role="status">
          <div><span className="selection-check"><Check size={14} /></span><div><strong>{selected.name}</strong><span>{selected.offerType} · 已准备加入工作台</span></div></div>
          <div><button type="button" onClick={() => setSelected(null)}>取消</button><button className="button button-primary" type="button" onClick={() => onOpenWorkspace(selected)}>继续配置</button></div>
        </div>
      )}
    </main>
  );
}
