/**
 * Shared types describing what an application needs. The platform converts
 * these requirements into a composed set of provider resources.
 *
 * The source of truth for "what does your application need?" — a developer
 * (or the coding engine) describes requirements, the infra engine plans
 * providers for them.
 */

export type FrontendFramework = "next" | "vite" | "static" | "unknown";
export type BackendRuntime = "node" | "deno" | "python" | "none" | "unknown";

/** What an application needs, independent of any provider. */
export interface AppRequirements {
  frontend: {
    framework: FrontendFramework;
    /** Root of the web app inside the repository, e.g. "apps/web" or "." */
    rootDir: string;
    buildCommand?: string;
    outputDir?: string;
  };
  backend?: {
    runtime: BackendRuntime;
    rootDir: string;
    port?: number;
  };
  database?: {
    kind: "postgres" | "mysql" | "sqlite" | "mongo";
    enabled: boolean;
  };
  auth?: {
    enabled: boolean;
    providers: Array<"google" | "github">;
  };
  storage?: {
    enabled: boolean;
  };
  notifications?: {
    enabled: boolean;
  };
}

/** Per-provider credential material held in the secret vault (never plaintext on disk). */
export interface ProviderCredentials {
  provider: string;
  /** Reference into the secret vault rather than the secret itself. */
  vaultRef: string;
  scopes?: string[];
}

/** A connection to a provider that the user has authorized. */
export interface ProviderConnection {
  provider: string;
  connectedAt: string;
  accountLabel: string;
  credentials: ProviderCredentials;
}
