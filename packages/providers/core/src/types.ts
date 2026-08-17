/** Generic domain types shared by every provider adapter. */

export type ConnectionState = "connected" | "pending" | "failed" | "idle";

export type DeploymentStatus =
  | "queued"
  | "building"
  | "ready"
  | "error"
  | "cancelled";

export interface ProviderHealth {
  state: ConnectionState;
  message?: string;
  checkedAt: string;
}

/** A secret reference — the value itself never leaves the vault. */
export interface SecretRef {
  key: string;
  /** Where the actual value lives (vault entry id). */
  vaultRef: string;
  masked: string;
  updatedAt: string;
}

export interface EnvVar {
  key: string;
  value?: string;
  sensitive: boolean;
}

export interface Deployment {
  id: string;
  projectId: string;
  status: DeploymentStatus;
  url?: string;
  createdAt: string;
  commitRef?: string;
}

export interface DeploymentInput {
  /** Git repo reference, e.g. "owner/repo" or local path (provider-specific). */
  source: string;
  branch?: string;
  /** Env vars to apply to the deployment. */
  env?: EnvVar[];
  production?: boolean;
}

/** Resource-level state: the platform must know what already exists. */
export interface ResourceState {
  provider: string;
  kind: string;
  externalId: string;
  /** Declarative shape of the current resource (provider-specific). */
  current?: unknown;
  /** Declarative shape of what we want it to become. */
  desired?: unknown;
  updatedAt: string;
}

/** A user-visible connection summary, e.g. "Google Login ✓ Connected". */
export interface ConnectionSummary {
  service: string;
  state: ConnectionState;
  detail?: string;
}
