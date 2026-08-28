import { useEffect, useState } from "react";
import { CircleUserRound, Moon, Sun, Wallet } from "lucide-react";
import { ModelSquare } from "../features/catalog/ModelSquare";
import type { ModelOffer } from "../features/catalog/catalogData";
import { Workspace } from "../features/workspace/Workspace";

export type ProductPage = "market" | "workspace";
export type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  const saved = window.localStorage.getItem("moyusi-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const [page, setPage] = useState<ProductPage>("market");
  const [pendingOffer, setPendingOffer] = useState<ModelOffer | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("moyusi-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setPage("market")} aria-label="返回 Moyusi 模型广场">
          <img className="brand-logo brand-logo-light" src="/brand/moyusi-light.png" alt="Moyusi" />
          <img className="brand-logo brand-logo-dark" src="/brand/moyusi-dark.png" alt="Moyusi" />
        </button>

        <nav className="primary-nav" aria-label="主导航">
          <button type="button" data-active={page === "market"} onClick={() => setPage("market")}>模型广场</button>
          <button type="button" data-active={page === "workspace"} onClick={() => { setPendingOffer(null); setPage("workspace"); }}>工作台</button>
        </nav>

        <div className="topbar-actions">
          <button className="balance-button" type="button" onClick={() => { setPendingOffer(null); setPage("workspace"); }}>
            <Wallet size={14} aria-hidden="true" />
            <span>¥ 80.00</span>
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "切换到日间模式" : "切换到夜间模式"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="icon-button account-button" type="button" aria-label="账户">
            <CircleUserRound size={17} />
          </button>
        </div>
      </header>

      {page === "market" ? (
        <ModelSquare onOpenWorkspace={(offer) => { setPendingOffer(offer ?? null); setPage("workspace"); }} />
      ) : (
        <Workspace pendingOffer={pendingOffer} onBrowseModels={() => setPage("market")} />
      )}
    </div>
  );
}
