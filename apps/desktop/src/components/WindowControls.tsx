import { useEffect, useState } from "react";
import { Copy, Minus, Square, X } from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";

export function WindowControls() {
  const [win] = useState(() => {
    try {
      return getCurrentWindow();
    } catch {
      return null;
    }
  });
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!win) return;
    let unlisten: (() => void) | undefined;
    win.isMaximized().then(setMaximized).catch(() => {});
    win
      .onResized(() => win.isMaximized().then(setMaximized).catch(() => {}))
      .then((fn) => (unlisten = fn))
      .catch(() => {});
    return () => unlisten?.();
  }, [win]);

  return (
    <div className="window-controls">
      <button
        className="wc-btn"
        title="Minimize"
        onClick={() => win?.minimize()}
      >
        <Minus size={14} strokeWidth={1.75} />
      </button>
      <button
        className="wc-btn"
        title={maximized ? "Restore" : "Maximize"}
        onClick={() => win?.toggleMaximize()}
      >
        {maximized ? (
          <Copy size={12} strokeWidth={1.75} />
        ) : (
          <Square size={11} strokeWidth={1.75} />
        )}
      </button>
      <button className="wc-btn wc-close" title="Close" onClick={() => win?.close()}>
        <X size={15} strokeWidth={1.75} />
      </button>
    </div>
  );
}
