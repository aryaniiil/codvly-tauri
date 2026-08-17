import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { BackendRuntime, FrontendFramework } from "@codvly/config";

export interface DetectedProject {
  /** Absolute path of the detected project root. */
  rootDir: string;
  framework: FrontendFramework;
  backendRuntime: BackendRuntime;
  packageManager?: string;
  /** Presence of key capabilities, e.g. auth/db client libs. */
  features: {
    database?: string;
    auth?: string;
  };
}

const FRAMEWORK_MARKERS: Record<FrontendFramework, string[]> = {
  next: ["next"],
  vite: ["vite", "@vitejs/plugin-react", "react-router-dom"],
  static: ["@11ty/eleventy", "astro", "svelte", "vue"],
  unknown: [],
};

const DB_MARKERS = [
  ["prisma", "prisma"],
  ["@supabase/supabase-js", "supabase"],
  ["@firebase/firestore", "firestore"],
  ["drizzle-orm", "drizzle"],
] as const;

const AUTH_MARKERS = [
  ["next-auth", "next-auth"],
  ["@supabase/supabase-js", "supabase"],
  ["@firebase/auth", "firebase"],
  ["@react-oauth/google", "google"],
] as const;

/** Read package.json from a directory, tolerant of absence. */
export async function readPackageJson(
  dir: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const raw = await readFile(join(dir, "package.json"), "utf8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/**
 * Detect the framework of a project by inspecting its package.json.
 * Part of the MVP slice: detect → connect → deploy → live URL.
 */
export async function detectProject(rootDir: string): Promise<DetectedProject> {
  const pkg = await readPackageJson(rootDir);

  const deps: Record<string, string> = {
    ...(pkg?.dependencies as Record<string, string> | undefined),
    ...(pkg?.devDependencies as Record<string, string> | undefined),
  };

  let framework: FrontendFramework = "unknown";
  for (const [name, markers] of Object.entries(FRAMEWORK_MARKERS)) {
    if (markers.some((m) => m in deps)) {
      framework = name as FrontendFramework;
      break;
    }
  }

  const backendRuntime: BackendRuntime = deps.next
    ? "node"
    : deps.express || deps.fastify || deps.nestjs
      ? "node"
      : "unknown";

  const features: DetectedProject["features"] = {};
  const db = DB_MARKERS.find(([m]) => m in deps);
  const auth = AUTH_MARKERS.find(([m]) => m in deps);
  if (db) features.database = db[1];
  if (auth) features.auth = auth[1];

  return {
    rootDir,
    framework,
    backendRuntime,
    packageManager: "pnpm-lock.yaml" in (pkg ?? {}) ? "pnpm" : undefined,
    features,
  };
}
