import { DatabaseProvider, Provider, ProviderHealth } from "@codvly/providers-core";

/** Stub — implement as part of the post-MVP phase (database + auth composition). */
export class SupabaseProvider implements DatabaseProvider, Provider {
  readonly name = "supabase";
  readonly capabilities = ["database", "auth", "storage"] as const;

  async connect(_credentials: unknown): Promise<void> {
    throw new Error("SupabaseProvider not implemented yet");
  }
  async health(): Promise<ProviderHealth> {
    return { state: "idle", checkedAt: new Date().toISOString() };
  }
  async disconnect(): Promise<void> {}
  createDatabase(): Promise<never> {
    return Promise.reject(new Error("SupabaseProvider not implemented yet"));
  }
  getConnectionString(): Promise<never> {
    return Promise.reject(new Error("SupabaseProvider not implemented yet"));
  }
}
