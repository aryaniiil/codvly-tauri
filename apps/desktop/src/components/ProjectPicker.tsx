import { useEffect, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { StackIcon } from "./StackIcon";
import { WindowChrome } from "./WindowChrome";
import codvlyMark from "../assets/codvly-mark.svg";
import { listRecentProjects, upsertProject, type ProjectRow } from "../lib/db";
import type { SessionAccount } from "../lib/session";

const CORNER_PATHS = [
  "M0 185C78 112 120 70 205 53C275 39 315 10 360 0",
  "M0 210C82 132 130 91 214 73C282 59 322 28 360 16",
  "M0 236C89 151 137 112 225 93C291 78 329 46 360 31",
  "M0 262C94 173 147 133 237 113C302 98 338 65 360 47",
];

function Corner({ className }: { className: string }) {
  return (
    <div className={`corner ${className}`}>
      <svg viewBox="0 0 360 360" aria-hidden>
        {CORNER_PATHS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
}

interface ProjectPickerProps {
  account: SessionAccount | null;
  onOpen: (project: string, path?: string) => void;
}

function relativeTime(iso: string): string {
  const then = new Date(iso.replace(" ", "T") + "Z").getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return "opened now";
  if (mins < 60) return `opened ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `opened ${hours}h ago`;
  return `opened ${Math.floor(hours / 24)}d ago`;
}

export function ProjectPicker({ account, onOpen }: ProjectPickerProps) {
  const [name, setName] = useState("");
  const [recent, setRecent] = useState<ProjectRow[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const shellRef = useRef<HTMLElement>(null);

  useEffect(() => {
    listRecentProjects(6).then(setRecent);
  }, []);

  const launch = (project: string, path?: string) => {
    void upsertProject(project, path);
    shellRef.current?.animate(
      [
        { opacity: 1, transform: "scale(1)" },
        { opacity: 0.75, transform: "scale(.985)" },
        { opacity: 0, transform: "scale(.96) translateY(-8px)" },
      ],
      { duration: 350, easing: "cubic-bezier(.2,.8,.2,1)" },
    );
    window.setTimeout(() => onOpen(project, path), 300);
  };

  const create = () => {
    const value = name.trim();
    if (!value) {
      inputRef.current?.animate(
        [
          { transform: "translateX(0)" },
          { transform: "translateX(-5px)" },
          { transform: "translateX(5px)" },
          { transform: "translateX(0)" },
        ],
        { duration: 220 },
      );
      return;
    }
    launch(value);
  };

  const browse = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "Choose a project folder",
      });
      if (typeof selected === "string" && selected.length > 0) {
        const base = selected.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || selected;
        launch(base, selected);
      }
    } catch (err) {
      console.warn("native folder dialog failed:", err);
    }
  };

  return (
    <div className="picker-page">
      <WindowChrome />
      <div className="grid" />
      <div className="center-glow" />

      <Corner className="c1" />
      <Corner className="c2" />
      <Corner className="c3" />
      <Corner className="c4" />

      <div className="tech t1">Codvly / Projects</div>
      <div className="tech t2">
        Local workspace
        <br />
        Ready to build
      </div>
      <div className="tech t3">Browse or create</div>
      <div className="tech t4">Session active</div>

      <main className="shell" ref={shellRef}>
        <header className="header">
          <img className="logo" src={codvlyMark} alt="codvly" />
          <div className="kicker">Welcome back</div>
          <h1>
            Hey, <span>{account?.name ?? "Aryanil"}</span>.
          </h1>
          <div className="sub">Which project would you like to open?</div>
        </header>

        <section className="chooser">
          <div className="chooser-top">
            <div className="chooser-left">
              <i className="p-dot" /> Project workspace
            </div>
            <div className="chooser-right">Local · ready</div>
          </div>

          <div className="body">
            <div className="section-label">Start something new</div>

            <div className="project-row">
              <input
                ref={inputRef}
                className="project-input"
                placeholder="Name your project..."
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") create();
                }}
              />
              <button className="primary" onClick={create}>
                Create project
              </button>
            </div>

            <div className="divider">or find an existing project</div>

            <div className="browse-card" onClick={browse}>
              <div className="p-folder" />
              <div className="browse-title">Browse folders</div>
              <div className="browse-sub">Choose a folder from your computer</div>
            </div>

            <div className="recent">
              <div className="recent-head">
                <div className="section-label">Recent projects</div>
                <div className="clear">All</div>
              </div>

              <div className="projects">
                {recent.length === 0 && (
                  <div className="project empty">No projects yet — create one above.</div>
                )}
                {recent.map((p) => (
                  <div
                    className="project"
                    key={p.name}
                    onClick={() => launch(p.name, p.path ?? undefined)}
                  >
                    <div className="project-top">
                      <div className="project-stack">
                        <StackIcon slug="vite" size={13} title="vite" />
                      </div>
                      <i className="p-status" />
                    </div>
                    <div className="project-name">{p.name}</div>
                    <div className="project-meta">{relativeTime(p.last_opened_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="footer">
          The project you open becomes your active workspace — you can switch it
          anytime.
        </div>
      </main>
    </div>
  );
}