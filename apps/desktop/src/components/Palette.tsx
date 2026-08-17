import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  FileCode2,
  Rocket,
  ScrollText,
  Settings,
} from "lucide-react";
import type { PageKey } from "../App";

interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: PageKey) => void;
}

const COMMANDS: Array<{
  page: PageKey;
  icon: typeof Rocket;
  label: string;
  hint?: string;
}> = [
  { page: "deploy", icon: Rocket, label: "Deploy project", hint: "D" },
  { page: "services", icon: Boxes, label: "Manage services", hint: "S" },
  { page: "code", icon: FileCode2, label: "Open code", hint: "C" },
  { page: "logs", icon: ScrollText, label: "View deployment logs" },
  { page: "settings", icon: Settings, label: "Project settings" },
];

export function Palette({ open, onClose, onNavigate }: PaletteProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search commands..."
        />
        <div>
          {filtered.map((c) => (
            <div
              key={c.page}
              className="palette-item"
              onClick={() => onNavigate(c.page)}
            >
              <c.icon size={14} strokeWidth={1.75} />
              <span>{c.label}</span>
              {c.hint && <span className="palette-hint">{c.hint}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}