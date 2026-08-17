import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "@xterm/addon-fit";
import "xterm/css/xterm.css";
import { X } from "lucide-react";

interface TerminalProps {
  cwd?: string | null;
  onClose: () => void;
}

export function Terminal({ cwd, onClose }: TerminalProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const pidRef = useRef<number | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);
  const cwdRef = useRef(cwd);
  cwdRef.current = cwd;
  const [height, setHeight] = useState(240);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      fontFamily: '"SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace',
      fontSize: 12.5,
      cursorBlink: true,
      convertEol: true,
      theme: {
        background: "#0d0f11",
        foreground: "#d4d8dd",
        cursor: "#9aa0a6",
        selectionBackground: "#2b323b",
        black: "#0d0f11",
        brightBlack: "#5e6369",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    term.focus();
    fitRef.current = fit;
    termRef.current = term;

    const fitNow = () => {
      try {
        fit.fit();
      } catch {
        /* host not measurable yet */
      }
    };
    fitNow();
    requestAnimationFrame(fitNow);

    let disposed = false;
    let unlisten: UnlistenFn | null = null;

    (async () => {
      try {
        const pid: number = await invoke("pty_open", {
          program: "powershell",
          cwd: cwdRef.current ?? null,
          cols: term.cols,
          rows: term.rows,
        });
        if (disposed) {
          await invoke("pty_kill", { pid }).catch(() => {});
          return;
        }
        pidRef.current = pid;
        unlisten = await listen<string>(`pty://${pid}`, (event) => {
          term.write(event.payload);
        });
        unlistenRef.current = unlisten;
        term.onData((data) => {
          void invoke("pty_write", { pid, data }).catch(() => {});
        });
      } catch (e) {
        term.write(`\r\nFailed to start terminal: ${String(e)}\r\n`);
      }
    })();

    const ro = new ResizeObserver(fitNow);
    ro.observe(host);

    return () => {
      disposed = true;
      ro.disconnect();
      unlisten?.();
      const pid = pidRef.current;
      if (pid != null) void invoke("pty_kill", { pid }).catch(() => {});
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
      pidRef.current = null;
      unlistenRef.current = null;
    };
  }, []);

  const startResize = (e: ReactMouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height;
    const onMove = (ev: MouseEvent) => {
      const next = Math.min(
        Math.max(startHeight + (startY - ev.clientY), 120),
        window.innerHeight - 160,
      );
      setHeight(next);
      fitRef.current?.fit();
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div className="terminal" style={{ height }}>
      <div
        className="terminal-resize"
        onMouseDown={startResize}
        title="Drag to resize"
      />
      <div className="terminal-bar">
        <span className="terminal-title">Terminal</span>
        <span className="terminal-cwd" title={cwd ?? ""}>
          {cwd ? cwd.split(/[\\/]/).filter(Boolean).pop() : "no folder"}
        </span>
        <button
          className="terminal-close"
          onClick={onClose}
          title="Close terminal (Ctrl+`)"
        >
          <X size={13} />
        </button>
      </div>
      <div className="terminal-host" ref={hostRef} />
    </div>
  );
}
