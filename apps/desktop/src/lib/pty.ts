import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface PtyHandle {
  pid: number;
  write(data: string): Promise<void>;
  resize(cols: number, rows: number): Promise<void>;
  kill(): Promise<void>;
  onData(cb: (data: string) => void): Promise<UnlistenFn>;
}

export async function openPty(opts: {
  program?: string;
  cwd?: string | null;
  cols: number;
  rows: number;
}): Promise<PtyHandle> {
  const pid = await invoke<number>("pty_open", {
    program: opts.program ?? "",
    cwd: opts.cwd ?? null,
    cols: opts.cols,
    rows: opts.rows,
  });
  return {
    pid,
    write: (data: string) => invoke("pty_write", { pid, data }),
    resize: (cols: number, rows: number) => invoke("pty_resize", { pid, cols, rows }),
    kill: () => invoke("pty_kill", { pid }),
    onData: (cb: (data: string) => void) =>
      listen<string>(`pty://${pid}`, (event) => cb(event.payload)),
  };
}
