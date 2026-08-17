// Free, MIT-licensed file-type icons served from the vscode-icons CDN.
// https://github.com/vscode-icons/vscode-icons (icons hosted on jsDelivr).
const ICON_BASE =
  "https://cdn.jsdelivr.net/gh/vscode-icons/vscode-icons@latest/icons";

// Curated extension -> icon filename map. Anything missing falls back to
// default_file, folders to default_folder / default_folder_opened.
const EXT_ICONS: Record<string, string> = {
  ts: "file_type_typescript",
  tsx: "file_type_reactts",
  js: "file_type_js",
  jsx: "file_type_reactjs",
  mjs: "file_type_js",
  cjs: "file_type_js",
  json: "file_type_json",
  jsonc: "file_type_json",
  html: "file_type_html",
  htm: "file_type_html",
  css: "file_type_css",
  scss: "file_type_scss",
  sass: "file_type_sass",
  less: "file_type_less",
  md: "file_type_markdown",
  markdown: "file_type_markdown",
  mdx: "file_type_markdown",
  py: "file_type_python",
  rs: "file_type_rust",
  go: "file_type_go",
  java: "file_type_java",
  kt: "file_type_kotlin",
  kts: "file_type_kotlin",
  c: "file_type_c",
  h: "file_type_c",
  cpp: "file_type_cpp",
  cc: "file_type_cpp",
  cxx: "file_type_cpp",
  hpp: "file_type_cpp",
  cs: "file_type_csharp",
  rb: "file_type_ruby",
  php: "file_type_php",
  swift: "file_type_swift",
  dart: "file_type_dart",
  lua: "file_type_lua",
  sh: "file_type_shell",
  bash: "file_type_shell",
  zsh: "file_type_shell",
  ps1: "file_type_powershell",
  sql: "file_type_sql",
  yml: "file_type_yaml",
  yaml: "file_type_yaml",
  toml: "file_type_toml",
  ini: "file_type_ini",
  cfg: "file_type_ini",
  conf: "file_type_config",
  xml: "file_type_xml",
  svg: "file_type_svg",
  dockerfile: "file_type_docker",
  lock: "file_type_lock",
  env: "file_type_dotenv",
  txt: "file_type_text",
  log: "file_type_log",
  editorconfig: "file_type_dotenv",
  png: "file_type_image",
  jpg: "file_type_image",
  jpeg: "file_type_image",
  gif: "file_type_image",
  webp: "file_type_image",
  ico: "file_type_image",
  bmp: "file_type_image",
  pdf: "file_type_pdf",
  zip: "file_type_zip",
  tar: "file_type_zip",
  gz: "file_type_zip",
  "7z": "file_type_zip",
  rar: "file_type_zip",
  woff: "file_type_font",
  woff2: "file_type_font",
  ttf: "file_type_font",
  otf: "file_type_font",
};

const FILENAME_ICONS: Record<string, string> = {
  dockerfile: "file_type_docker",
  makefile: "file_type_makefile",
  license: "file_type_license",
  ".gitignore": "file_type_git",
  ".npmignore": "file_type_npm",
  ".npmrc": "file_type_npm",
  "package.json": "file_type_npm",
  "package-lock.json": "file_type_npm",
  "tsconfig.json": "file_type_tsconfig",
  "tsconfig.app.json": "file_type_tsconfig",
  "tsconfig.node.json": "file_type_tsconfig",
  "vite.config.ts": "file_type_vite",
  "vite.config.js": "file_type_vite",
  "cargo.toml": "file_type_cargo",
  "cargo.lock": "file_type_cargo",
  "pnpm-lock.yaml": "file_type_pnpm",
  "yarn.lock": "file_type_yarn",
  "gemfile": "file_type_ruby",
  "readme.md": "file_type_markdown",
  "readme": "file_type_markdown",
  ".env": "file_type_dotenv",
  ".env.local": "file_type_dotenv",
  ".env.example": "file_type_dotenv",
};

export interface FileIconProps {
  name: string;
  isDir?: boolean;
  expanded?: boolean;
  size?: number;
}

export function FileIcon({ name, isDir, expanded, size = 16 }: FileIconProps) {
  let src: string;
  if (isDir) {
    src = `${ICON_BASE}/${expanded ? "default_folder_opened" : "default_folder"}.svg`;
  } else {
    const lower = name.toLowerCase();
    const byName = FILENAME_ICONS[lower];
    const ext = lower.includes(".") ? lower.split(".").pop()! : "";
    const byExt = ext ? EXT_ICONS[ext] : undefined;
    const iconName = byName ?? byExt ?? "default_file";
    src = `${ICON_BASE}/${iconName}.svg`;
  }

  return (
    <img
      className="ficon"
      src={src}
      width={size}
      height={size}
      alt=""
      loading="lazy"
      draggable={false}
    />
  );
}
