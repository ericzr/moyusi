import { useEffect, useState } from "react";
import { LayoutDashboard, Moon, Sun } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { getAccessFlow, isWorkspaceSection } from "../domain/accessPolicy";
import { ModelDetailPage, ModelSquare } from "../features/catalog/ModelSquare";
import { Workspace } from "../features/workspace/Workspace";
import { useDemoPlatform, type DemoPlatformController } from "../features/workspace/useDemoPlatform";
import { catalogRepository } from "../services/catalogRepository";
import { workspaceSelectionPath } from "./selectionUrl";

export type Theme = "light" | "dark";

const assetBase = import.meta.env.BASE_URL;

function readInitialTheme(): Theme {
  const saved = window.localStorage.getItem("moyusi-theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);
  const demoPlatform = useDemoPlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const productPage = location.pathname.startsWith("/workspace") ? "workspace" : "market";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("moyusi-theme", theme);
  }, [theme]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => navigate("/market")} aria-label="返回 Moyusi 模型广场">
          <img className="brand-logo brand-logo-light" src={`${assetBase}brand/moyusi-light.png`} alt="Moyusi" />
          <img className="brand-logo brand-logo-dark" src={`${assetBase}brand/moyusi-dark.png`} alt="Moyusi" />
        </button>

        <div className="topbar-actions">
          <button className="workspace-entry" type="button" data-active={productPage === "workspace"} onClick={() => navigate("/workspace/overview")}>
            <LayoutDashboard size={15} aria-hidden="true" />
            <span>工作台</span>
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={theme === "dark" ? "切换到日间模式" : "切换到夜间模式"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/market" replace />} />
        <Route path="/market" element={<ModelSquare onOpenDetail={(modelId) => navigate(`/market/${modelId}`)} />} />
        <Route path="/market/:modelId" element={<ModelDetailRoute />} />
        <Route path="/workspace" element={<Navigate to="/workspace/overview" replace />} />
        <Route path="/workspace/:section" element={<WorkspaceRoute platform={demoPlatform} />} />
        <Route path="*" element={<Navigate to="/market" replace />} />
      </Routes>
    </div>
  );
}

function ModelDetailRoute() {
  const { modelId = "" } = useParams();
  const navigate = useNavigate();
  return (
    <ModelDetailPage
      modelId={modelId}
      onBack={() => navigate("/market")}
      onOpenWorkspace={(selection) => navigate(workspaceSelectionPath(selection))}
    />
  );
}

function WorkspaceRoute({ platform }: { platform: DemoPlatformController }) {
  const { section } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isWorkspaceSection(section)) return <Navigate to="/workspace/overview" replace />;

  const query = new URLSearchParams(location.search);
  const pendingSelection = catalogRepository.resolveSelection(query.get("model"), query.get("source"));
  const selectionSection = pendingSelection ? getAccessFlow(pendingSelection.source.mode).targetSection : null;
  const activeSelection = selectionSection === section ? pendingSelection : null;

  return (
    <Workspace
      section={section}
      pendingSelection={activeSelection}
      platform={platform}
      onActivateSelection={async (selection) => {
        await platform.activate(selection);
        navigate("/workspace/routing", { replace: true });
      }}
      onNavigate={(nextSection) => navigate(`/workspace/${nextSection}${selectionSection === nextSection ? location.search : ""}`)}
      onBrowseModels={() => navigate("/market")}
    />
  );
}
