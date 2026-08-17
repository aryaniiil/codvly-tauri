import { invoke } from "@tauri-apps/api/core";

export interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
}

export async function listDir(path: string): Promise<FileNode[]> {
  try {
    return await invoke<FileNode[]>("list_dir", { path });
  } catch {
    return [];
  }
}

export async function readFile(path: string): Promise<{ content: string; tooLarge?: boolean }> {
  try {
    const content = await invoke<string>("read_file", { path });
    return { content };
  } catch (e) {
    const msg = String(e);
    if (msg.includes("too large")) return { content: "", tooLarge: true };
    return { content: "" };
  }
}

export async function writeFile(path: string, content: string): Promise<void> {
  await invoke("write_file", { path, content });
}

/** Reads a file as a base64 string (for binary previews). */
export async function readFileBase64(
  path: string,
  limit?: number,
): Promise<string> {
  return await invoke<string>("read_file_base64", {
    path,
    limit: limit ?? null,
  });
}
