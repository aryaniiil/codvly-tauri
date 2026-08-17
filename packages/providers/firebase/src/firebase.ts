import { AuthProvider, NotificationProvider, Provider, ProviderHealth } from "@codvly/providers-core";

/**
 * Stub — implements auth + notifications (Google OAuth config, FCM setup)
 * in a later milestone.
 */
export class FirebaseProvider implements AuthProvider, NotificationProvider, Provider {
  readonly name = "firebase";
  readonly capabilities = ["auth", "notifications"] as const;

  async connect(_credentials: unknown): Promise<void> {
    throw new Error("FirebaseProvider not implemented yet");
  }
  async health(): Promise<ProviderHealth> {
    return { state: "idle", checkedAt: new Date().toISOString() };
  }
  async disconnect(): Promise<void> {}
  configureOAuth(): Promise<never> {
    return Promise.reject(new Error("FirebaseProvider not implemented yet"));
  }
  getConfig(): Promise<never> {
    return Promise.reject(new Error("FirebaseProvider not implemented yet"));
  }
  setupPush(): Promise<never> {
    return Promise.reject(new Error("FirebaseProvider not implemented yet"));
  }
}
