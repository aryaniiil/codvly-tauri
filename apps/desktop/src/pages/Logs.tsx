interface LogsProps {
  onToast: (message: string) => void;
}

const LINES: Array<{ type: "ok" | "info" | "warn"; text: string }> = [
  { type: "ok", text: "deployment started · 14:22:08" },
  { type: "info", text: "pulling github.com/codvly/acme-store" },
  { type: "info", text: "detected Next.js 16 / pnpm" },
  { type: "info", text: "building frontend with Vercel" },
  { type: "ok", text: "frontend build completed · 14:22:31" },
  { type: "info", text: "syncing environment variables" },
  { type: "ok", text: "18 variables synced" },
  { type: "info", text: "running health checks" },
  { type: "ok", text: "/api/health returned 200" },
  { type: "ok", text: "deployment complete · 14:23:04" },
];

const GLYPH = { ok: "✓", info: "→", warn: "!" } as const;

export function Logs({ onToast }: LogsProps) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Logs</h1>
          <div className="sub">production · latest deployment</div>
        </div>
        <button className="toolbtn" onClick={() => onToast("Logs refreshed")}>
          Refresh
        </button>
      </div>
      <div className="card logbox">
        {LINES.map((l, i) => (
          <div className="logline" key={i}>
            <span className={l.type}>{GLYPH[l.type]}</span> {l.text}
          </div>
        ))}
      </div>
    </>
  );
}