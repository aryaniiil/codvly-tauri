import {
  Bell,
  Command,
  MoreHorizontal,
  Sparkles,
  TerminalSquare,
} from "lucide-react";
import type { PageKey } from "../App";
import { WindowControls } from "./WindowControls";

interface TopbarProps {
  page: PageKey;
  projectName: string;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  onPalette: () => void;
  onAi: () => void;
  onToast: (message: string) => void;
}

export function Topbar({
  page,
  projectName,
  terminalOpen,
  onToggleTerminal,
  onPalette,
  onAi,
  onToast,
}: TopbarProps) {
  return (
    <header className="topbar" data-tauri-drag-region>
      <div className="crumb" data-tauri-drag-region>
        {projectName}{" "}
        <span className="crumb-sep" data-tauri-drag-region>
          /
        </span>{" "}
        <b data-tauri-drag-region>{page}</b>
      </div>
      <div className="top-actions" data-tauri-drag-region>
        <button className="toolbtn" onClick={onPalette}>
          <Command size={13} strokeWidth={1.75} /> K
        </button>
        {page !== "settings" && (
          <button
            className={terminalOpen ? "toolbtn active" : "toolbtn"}
            onClick={onToggleTerminal}
            title="Toggle terminal (Ctrl+`)"
          >
            <TerminalSquare size={13} strokeWidth={1.75} />
          </button>
        )}
        <button className="toolbtn" onClick={onAi}>
          <Sparkles size={13} strokeWidth={1.75} /> AI
        </button>
        <button className="toolbtn" onClick={() => onToast("No new notifications")}>
          <Bell size={13} strokeWidth={1.75} />
        </button>
        <button className="toolbtn">
          <MoreHorizontal size={13} strokeWidth={1.75} />
        </button>
      </div>
      <WindowControls />
    </header>
  );
}