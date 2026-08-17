import { useEffect, useRef, useState } from "react";
import { Boot } from "./components/Boot";
import { Auth } from "./components/Auth";
import { ProjectPicker } from "./components/ProjectPicker";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Palette } from "./components/Palette";
import { AiFloat } from "./components/AiFloat";
import { Toast } from "./components/Toast";
import { Terminal } from "./components/Terminal";
import { Overview } from "./pages/Overview";
import { Code } from "./pages/Code";
import { Deploy } from "./pages/Deploy";
import { Services } from "./pages/Services";
import { Logs } from "./pages/Logs";
import { Settings } from "./pages/Settings";
import { getSession, type SessionAccount } from "./lib/session";

export type PageKey =
  | "overview"
  | "code"
  | "deploy"
  | "services"
  | "logs"
  | "settings";

export default function App() {
  const [screen, setScreen] = useState<"boot" | "auth" | "picker" | "workspace">(
    "boot",
  );
  const [account, setAccount] = useState<SessionAccount | null>(null);
  const [project, setProject] = useState<string | null>(null);
  const [projectPath, setProjectPath] = useState<string | null>(null);

  useEffect(() => {
    const bootTimer = setTimeout(async () => {
      const session = await getSession();
      setAccount(session);
      setScreen(session ? "picker" : "auth");
    }, 1400);
    return () => clearTimeout(bootTimer);
  }, []);

  if (screen === "boot") return <Boot />;
  if (screen === "auth")
    return (
      <Auth
        onEnter={(acc) => {
          setAccount(acc);
          setScreen("picker");
        }}
      />
    );
  if (screen === "picker")
    return (
      <ProjectPicker
        account={account}
        onOpen={(name, path) => {
          setProject(name);
          setProjectPath(path ?? null);
          setScreen("workspace");
        }}
      />
    );
  return (
    <Workspace
      projectName={project ?? "untitled"}
      projectPath={projectPath}
      account={account}
      onAttachFolder={(path) => setProjectPath(path)}
    />
  );
}

function Workspace({
  projectName,
  projectPath,
  account,
  onAttachFolder,
}: {
  projectName: string;
  projectPath: string | null;
  account: SessionAccount | null;
  onAttachFolder: (path: string) => void;
}) {
  const [page, setPage] = useState<PageKey>("overview");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = (message: string) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  };

  const navigate = (next: PageKey) => {
    setPage(next);
    setPaletteOpen(false);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "`" || e.code === "Backquote")) {
        e.preventDefault();
        setTerminalOpen((open) => !open);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
        setAiOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="shell">
      <Sidebar
        page={page}
        projectName={projectName}
        account={account}
        onNavigate={navigate}
      />
      <main className="main">
        <Topbar
          page={page}
          projectName={projectName}
          terminalOpen={terminalOpen}
          onToggleTerminal={() => setTerminalOpen((open) => !open)}
          onPalette={() => setPaletteOpen(true)}
          onAi={() => setAiOpen((open) => !open)}
          onToast={showToast}
        />
        <div className={page === "code" ? "content content-code" : "content"}>
          {page === "overview" && (
            <Overview projectName={projectName} onDeploy={() => setPage("deploy")} />
          )}
          {page === "code" && (
            <Code
              projectPath={projectPath}
              onAttachFolder={onAttachFolder}
              onToast={showToast}
            />
          )}
          {page === "deploy" && (
            <Deploy
              onDeployed={() => {
                showToast("Deployment plan created · mock only");
                window.setTimeout(() => setPage("logs"), 700);
              }}
            />
          )}
          {page === "services" && <Services />}
          {page === "logs" && <Logs onToast={showToast} />}
          {page === "settings" && (
            <Settings projectName={projectName} onToast={showToast} />
          )}
        </div>
        {terminalOpen && page !== "settings" && (
          <Terminal
            cwd={projectPath}
            onClose={() => setTerminalOpen(false)}
          />
        )}
      </main>
      <Palette open={paletteOpen} onClose={() => setPaletteOpen(false)} onNavigate={navigate} />
      <AiFloat
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onRun={() => {
          showToast("Agent task queued");
          setAiOpen(false);
        }}
      />
      <Toast message={toast} />
    </div>
  );
}