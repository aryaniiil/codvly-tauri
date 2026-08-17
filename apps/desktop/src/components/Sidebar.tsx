import {
  Boxes,
  ChevronDown,
  FileCode2,
  LayoutGrid,
  Rocket,
  ScrollText,
  Settings,
} from "lucide-react";
import type { PageKey } from "../App";
import codvlyMark from "../assets/codvly-mark.svg";
import type { SessionAccount } from "../lib/session";

const WORKSPACE_NAV: Array<{ page: PageKey; icon: typeof LayoutGrid; label: string }> = [
  { page: "overview", icon: LayoutGrid, label: "Overview" },
  { page: "code", icon: FileCode2, label: "Code" },
  { page: "deploy", icon: Rocket, label: "Deploy" },
  { page: "services", icon: Boxes, label: "Services" },
  { page: "logs", icon: ScrollText, label: "Logs" },
];

const PROJECT_NAV: Array<{ page: PageKey; icon: typeof Settings; label: string }> = [
  { page: "settings", icon: Settings, label: "Settings" },
];

interface SidebarProps {
  page: PageKey;
  projectName: string;
  account: SessionAccount | null;
  onNavigate: (page: PageKey) => void;
}

export function Sidebar({ page, projectName, account, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brandbar">
        <img className="brandmark" src={codvlyMark} alt="" />
        <div className="brandname">codvly</div>
      </div>

      <div className="project-switch">
        <div className="project-left">
          <span className="project-dot" />
          <span>{projectName}</span>
        </div>
        <ChevronDown size={13} className="switch-caret" />
      </div>

      <div className="nav-title">Workspace</div>
      <nav className="nav">
        {WORKSPACE_NAV.map((item) => (
          <NavButton
            key={item.page}
            active={page === item.page}
            onClick={() => onNavigate(item.page)}
            icon={<item.icon size={15} strokeWidth={1.75} />}
            label={item.label}
          />
        ))}
      </nav>

      <div className="nav-title">Project</div>
      <nav className="nav">
        {PROJECT_NAV.map((item) => (
          <NavButton
            key={item.page}
            active={page === item.page}
            onClick={() => onNavigate(item.page)}
            icon={<item.icon size={15} strokeWidth={1.75} />}
            label={item.label}
          />
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="account">
          <div className="avatar">
            {(account?.name ?? "A").slice(0, 2).toUpperCase()}
          </div>
          <div className="account-text">
            <b>{account?.name ?? "Signed out"}</b>
            <div>{account ? "Developer" : "Sign in to continue"}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <span className="navicon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}