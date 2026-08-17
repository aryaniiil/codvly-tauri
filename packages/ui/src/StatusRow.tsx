export type ConnectionState = "connected" | "pending" | "failed" | "idle";

export interface StatusRowProps {
  label: string;
  status: ConnectionState;
  detail?: string;
}

const STATE_COLORS: Record<ConnectionState, string> = {
  connected: "#3fb950",
  pending: "#d29922",
  failed: "#f85149",
  idle: "#8b949e",
};

/**
 * Shows a single "X ✓ Connected" style row — the primary feedback pattern
 * of the Codvly workspace: the developer sees composed services as a
 * checklist of connected providers.
 */
export function StatusRow({ label, status, detail }: StatusRowProps) {
  return (
    <div className="codvly-status-row">
      <span
        className="codvly-status-dot"
        style={{ background: STATE_COLORS[status] }}
        aria-hidden
      />
      <span className="codvly-status-label">{label}</span>
      <span className="codvly-status-state">{status}</span>
      {detail && <span className="codvly-status-detail">{detail}</span>}
    </div>
  );
}
