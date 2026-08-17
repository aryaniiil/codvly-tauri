import { invoke } from "@tauri-apps/api/core";
import type { TokenBundle, TokenVault } from "@codvly/auth";

/** Keyring-backed secret store, exposed by the Rust shell (src-tauri). */
export const vault = {
  set(key: string, value: string): Promise<void> {
    return invoke("vault_set", { key, value });
  },
  get(key: string): Promise<string | null> {
    return invoke("vault_get", { key });
  },
  remove(key: string): Promise<void> {
    return invoke("vault_delete", { key });
  },
};

/**
 * TokenVault implementation backed by the OS keychain (Windows Credential
 * Manager / macOS Keychain / Secret Service). Provider tokens and API keys
 * never touch disk in plaintext.
 */
export const keychainVault: TokenVault = {
  save: async (provider, tokens) => {
    await vault.set(provider, JSON.stringify(tokens));
  },
  load: async (provider) => {
    const raw = await vault.get(provider);
    if (!raw) return undefined;
    try {
      return JSON.parse(raw) as TokenBundle;
    } catch {
      return undefined;
    }
  },
  delete: async (provider) => {
    await vault.remove(provider);
  },
};

/** Keyring entry holding the signed-in account's session JWT. */
export const SESSION_VAULT_KEY = "session";

function base64UrlEncode(input: string): string {
  return btoa(input)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(input: string): string {
  const pad = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
}

export interface MockJwtPayload {
  sub: string;
  name: string;
  email: string;
  provider: string;
  iss: string;
  iat: number;
  exp: number;
}

/**
 * Locally signed mock JWT. Real OAuth/session issuance replaces this later —
 * the storage contract (keychain entry + expiry handling) stays identical.
 */
export function mockJwt(payload: Omit<MockJwtPayload, "iss" | "iat" | "exp">): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iss: "com.codvly.app",
      iat: now,
      exp: now + 60 * 60 * 24 * 30, // 30 days
    }),
  );
  return `${header}.${body}.mock-signature`;
}

export function decodeJwt<T = MockJwtPayload>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1] ?? "")) as T;
  } catch {
    return null;
  }
}
