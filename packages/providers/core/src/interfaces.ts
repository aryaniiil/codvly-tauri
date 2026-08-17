import type { AppRequirements } from "@codvly/config";
import type {
  ConnectionState,
  Deployment,
  DeploymentInput,
  EnvVar,
  ProviderHealth,
  ResourceState,
  SecretRef,
} from "./types";

/**
 * Codvly provider interfaces.
 *
 * Every provider (Vercel, Railway, Supabase, Firebase, AWS, ...) implements
 * one or more of these capabilities. The infra engine only ever talks to
 * these interfaces — never to provider-specific APIs directly. Providers can
 * be swapped without rewriting the platform.
 */

export interface Provider {
  readonly name: string;
  readonly capabilities: readonly ProviderCapability[];

  /** Establish a session with user-authorized credentials. */
  connect(credentials: unknown): Promise<void>;
  health(): Promise<ProviderHealth>;
  disconnect(): Promise<void>;
}

export type ProviderCapability =
  | "hosting"
  | "database"
  | "auth"
  | "storage"
  | "notifications";

export interface HostingProvider extends Provider {
  deploy(input: DeploymentInput): Promise<Deployment>;
  /** Resolve the live URL of the production deployment. */
  getDeploymentUrl(projectId: string): Promise<string | undefined>;
  setEnvVars(projectId: string, env: EnvVar[]): Promise<SecretRef[]>;
  listEnvVars(projectId: string): Promise<EnvVar[]>;
}

export interface DatabaseProvider extends Provider {
  createDatabase(name: string, config: unknown): Promise<ResourceState>;
  getConnectionString(state: ResourceState): Promise<SecretRef>;
}

export interface AuthProvider extends Provider {
  /** Configure an OAuth app for the given provider (e.g. Google) on the user's behalf. */
  configureOAuth(requirements: AppRequirements["auth"]): Promise<ResourceState>;
  getConfig(): Promise<Record<string, string>>;
}

export interface StorageProvider extends Provider {
  createBucket(name: string): Promise<ResourceState>;
  getConfig(): Promise<Record<string, string>>;
}

export interface NotificationProvider extends Provider {
  setupPush(config: unknown): Promise<ResourceState>;
  /** e.g. FCM server key / Firebase project id for the app to embed. */
  getConfig(): Promise<Record<string, string>>;
}

/** Resolve a provider implementation by name. */
export type ProviderRegistry = Record<string, Provider>;

export type {
  ConnectionState,
  Deployment,
  DeploymentInput,
  EnvVar,
  ProviderHealth,
  ResourceState,
  SecretRef,
};
