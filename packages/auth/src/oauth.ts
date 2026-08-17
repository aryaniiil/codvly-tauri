/** OAuth primitives shared by desktop, web and CLI. */

export interface OAuthConfig {
  provider: string;
  clientId: string;
  /** Redirect URI registered with the provider for this client. */
  redirectUri: string;
  scopes: string[];
  /** Provider authorization endpoint. */
  authUrl: string;
  tokenUrl: string;
}

export interface TokenBundle {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  /** User identifier returned by the provider. */
  accountId?: string;
}

/** A Tauri, web-server or CLI implementation of secure token storage. */
export interface TokenVault {
  save(provider: string, tokens: TokenBundle): Promise<void>;
  load(provider: string): Promise<TokenBundle | undefined>;
  delete(provider: string): Promise<void>;
}

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

/** RFC 7636 PKCE code verifier. */
export function generateCodeVerifier(length = 64): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

/** RFC 7636 S256 code challenge from a verifier. */
export async function generateCodeChallenge(
  verifier: string,
): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** One-time random state for CSRF protection of the auth flow. */
export function generateState(): string {
  return generateCodeVerifier(32);
}
