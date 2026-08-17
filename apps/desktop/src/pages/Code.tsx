import { useCallback, useEffect, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { ChevronRight, FileCode2, FolderOpen, X } from "lucide-react";
import type { FileNode } from "../lib/fs";
import { listDir, readFile, readFileBase64, writeFile } from "../lib/fs";
import { CodeEditor } from "../components/CodeEditor";
import { FileIcon } from "../components/FileIcon";

interface CodeProps {
  projectPath: string | null;
  onAttachFolder: (path: string) => void;
  onToast: (message: string) => void;
}

interface Tab {
  path: string;
  name: string;
}

type ViewKind = "editor" | "image" | "video" | "binary";

interface FileView {
  kind: ViewKind;
  src?: string;
}

const IMAGE_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico", "avif", "tif", "tiff",
]);
const VIDEO_EXT = new Set([
  "mp4", "webm", "ogg", "mov", "avi", "mkv", "m4v", "mpg", "mpeg",
]);
const BINARY_EXT = new Set([
  "exe", "dll", "sys", "bin", "dat", "iso", "img", "dmg", "pdb", "obj", "lib",
  "a", "so", "dylib", "class", "pyc", "pyo", "o", "wasm", "zip", "tar", "gz",
  "tgz", "rar", "7z", "jar", "war", "pdf", "db", "sqlite", "sqlite3", "woff",
  "woff2", "ttf", "otf", "eot", "cab", "msi", "deb", "rpm",
]);

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function categoryOf(name: string): ViewKind {
  const ext = extOf(name);
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (BINARY_EXT.has(ext)) return "binary";
  return "editor";
}

function mimeFor(ext: string): string {
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "ico":
      return "image/x-icon";
    case "avif":
      return "image/avif";
    case "tif":
    case "tiff":
      return "image/tiff";
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    case "mkv":
      return "video/x-matroska";
    case "mpg":
    case "mpeg":
      return "video/mpeg";
    default:
      return "application/octet-stream";
  }
}

export function Code({ projectPath, onAttachFolder, onToast }: CodeProps) {
  const root = projectPath ?? "";

  const [childrenOf, setChildrenOf] = useState<Record<string, FileNode[]>>({});
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [tabs, setTabs] = useState<Tab[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [buffers, setBuffers] = useState<Record<string, string>>({});
  const [origins, setOrigins] = useState<Record<string, string>>({});
  const [tooLarge, setTooLarge] = useState<string | null>(null);
  const [views, setViews] = useState<Record<string, FileView>>({});

  const [loadingDir, setLoadingDir] = useState(false);

  const loadDir = useCallback(
    async (path: string) => {
      setLoadingDir(true);
      const kids = await listDir(path);
      setChildrenOf((c) => ({ ...c, [path]: kids }));
      setLoaded((l) => new Set(l).add(path));
      setLoadingDir(false);
      return kids;
    },
    [],
  );

  // Load the project root as soon as a folder is known.
  useEffect(() => {
    if (!root) return;
    setExpanded(new Set([root]));
    void loadDir(root);
  }, [root, loadDir]);

  const toggleDir = useCallback(
    async (node: FileNode) => {
      const isOpen = expanded.has(node.path);
      setExpanded((prev) => {
        const next = new Set(prev);
        if (isOpen) next.delete(node.path);
        else next.add(node.path);
        return next;
      });
      if (!isOpen && !loaded.has(node.path)) {
        await loadDir(node.path);
      }
    },
    [expanded, loaded, loadDir],
  );

  const openFile = useCallback(
    async (node: FileNode) => {
      setTabs((t) =>
        t.some((x) => x.path === node.path)
          ? t
          : [...t, { path: node.path, name: node.name }],
      );
      setActive(node.path);
      setTooLarge(null);

      const cat = categoryOf(node.name);

      if (cat === "image" || cat === "video") {
        try {
          const b64 = await readFileBase64(node.path);
          setViews((v) => ({
            ...v,
            [node.path]: {
              kind: cat,
              src: `data:${mimeFor(extOf(node.name))};base64,${b64}`,
            },
          }));
        } catch {
          setViews((v) => ({ ...v, [node.path]: { kind: "binary" } }));
          onToast("Could not preview this file");
        }
        return;
      }

      if (cat === "binary") {
        setViews((v) => ({ ...v, [node.path]: { kind: "binary" } }));
        return;
      }

      // Plain-text file: open in the editor.
      setViews((v) => ({ ...v, [node.path]: { kind: "editor" } }));
      if (buffers[node.path] !== undefined) return;
      const { content, tooLarge: big } = await readFile(node.path);
      if (big) {
        setTooLarge(node.path);
        onToast("File is too large to open in the editor");
        return;
      }
      setBuffers((b) => ({ ...b, [node.path]: content }));
      setOrigins((o) => ({ ...o, [node.path]: content }));
    },
    [buffers, onToast],
  );

  const closeTab = useCallback(
    (path: string) => {
      setTabs((t) => {
        const next = t.filter((x) => x.path !== path);
        if (active === path) {
          const fallback = next[next.length - 1]?.path ?? null;
          setActive(fallback);
          if (fallback) setTooLarge(null);
        }
        return next;
      });
      setBuffers((b) => {
        const { [path]: _removed, ...rest } = b;
        return rest;
      });
      setOrigins((o) => {
        const { [path]: _removed, ...rest } = o;
        return rest;
      });
      setViews((v) => {
        const { [path]: _removed, ...rest } = v;
        return rest;
      });
    },
    [active],
  );

  const saveActive = useCallback(() => {
    if (!active) return;
    const content = buffers[active] ?? "";
    void writeFile(active, content)
      .then(() => {
        setOrigins((o) => ({ ...o, [active]: content }));
        const name = active.split(/[\\/]/).pop();
        onToast(`Saved ${name}`);
      })
      .catch(() => onToast("Could not save file"));
  }, [active, buffers, onToast]);

  const onChange = useCallback(
    (value: string) => {
      if (!active) return;
      setBuffers((b) => ({ ...b, [active]: value }));
    },
    [active],
  );

  const isDirty = (path: string): boolean =>
    buffers[path] !== undefined && buffers[path] !== origins[path];

  const activeContent = active ? buffers[active] ?? "" : "";

  const renderTree = (nodes: FileNode[], depth: number) =>
    nodes.map((node) => {
      const isOpen = expanded.has(node.path);
      const pad = 8 + depth * 12;
      if (node.is_dir) {
        const kids = childrenOf[node.path] ?? [];
        return (
          <div key={node.path}>
            <button
              className="tree-row"
              style={{ paddingLeft: pad }}
              onClick={() => void toggleDir(node)}
            >
              <ChevronRight
                size={13}
                className={isOpen ? "twist open" : "twist"}
              />
              <FileIcon name={node.name} isDir expanded={isOpen} />
              <span className="tree-name">{node.name}</span>
            </button>
            {isOpen && (
              <div>
                {loaded.has(node.path)
                  ? renderTree(kids, depth + 1)
                  : loadingDir && (
                      <div
                        className="tree-row muted"
                        style={{ paddingLeft: pad + 18 }}
                      >
                        loading…
                      </div>
                    )}
              </div>
            )}
          </div>
        );
      }
      const isActive = active === node.path;
      return (
        <button
          key={node.path}
          className={isActive ? "tree-row file active" : "tree-row file"}
          style={{ paddingLeft: pad + 18 }}
          onClick={() => void openFile(node)}
        >
          <FileIcon name={node.name} />
          <span className="tree-name">{node.name}</span>
          {isDirty(node.path) && <span className="dirty-dot" />}
        </button>
      );
    });

  if (!root) {
    return (
      <div className="empty-folder">
        <FolderOpen size={34} strokeWidth={1.4} />
        <h2>No workspace folder</h2>
        <p>
          This project has no folder attached. Choose a local folder to browse
          and edit its files here.
        </p>
        <button
          className="primary"
          onClick={async () => {
            const picked = await open({ directory: true, multiple: false });
            if (typeof picked === "string" && picked.length > 0) {
              onAttachFolder(picked);
              onToast("Folder attached to this workspace");
            }
          }}
        >
          Choose a folder
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="code-layout">
        <div className="files">
          <div className="file-title">
            <span>Explorer</span>
            <span className="root-name" title={root}>
              {root.split(/[\\/]/).filter(Boolean).pop()}
            </span>
          </div>
          <div className="tree">
            {loaded.has(root)
              ? renderTree(childrenOf[root] ?? [], 0)
              : loadingDir && <div className="tree-row muted">loading…</div>}
          </div>
        </div>

        <div className="editor">
          <div className="tabs">
            {tabs.map((t) => (
              <div
                key={t.path}
                className={active === t.path ? "tab active" : "tab"}
                onClick={() => {
                  setActive(t.path);
                  setTooLarge(null);
                }}
              >
                <FileIcon name={t.name} size={14} />
                <span className="tab-name">{t.name}</span>
                {isDirty(t.path) && <span className="dirty-dot" />}
                <button
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(t.path);
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {tabs.length === 0 && (
              <div className="tabs-empty">Select a file to start editing</div>
            )}
          </div>

          {active && tooLarge === active ? (
            <div className="editor-blocked">
              <FileCode2 size={26} strokeWidth={1.4} />
              <p>This file is too large to open in the editor.</p>
            </div>
          ) : active && views[active]?.kind === "image" && views[active]?.src ? (
            <div className="preview">
              <img src={views[active]!.src} alt={active} />
            </div>
          ) : active && views[active]?.kind === "video" && views[active]?.src ? (
            <div className="preview">
              <video controls src={views[active]!.src} />
            </div>
          ) : active && views[active]?.kind === "binary" ? (
            <div className="editor-blocked">
              <FileCode2 size={26} strokeWidth={1.4} />
              <p>
                Cannot preview “{active.split(/[\\/]/).pop()}” — this file type
                can’t be rendered.
              </p>
            </div>
          ) : active ? (
            <div className="editor-host-wrap">
              <CodeEditor
                value={activeContent}
                filename={active.split(/[\\/]/).pop() ?? active}
                onChange={onChange}
                onSave={saveActive}
              />
            </div>
          ) : (
            <div className="editor-empty">
              <FileCode2 size={30} strokeWidth={1.4} />
              <p>Open a file from the explorer to edit it.</p>
            </div>
          )}

          <div className="statusbar">
            <span className="sb-item">
              {active ? active.split(/[\\/]/).pop() : "No file open"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
