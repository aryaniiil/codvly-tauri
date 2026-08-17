import {
  decodeJwt,
  mockJwt,
  SESSION_VAULT_KEY,
  vault,
} from "./vault";
import {
  createAccount,
  getAccountById,
  touchAccount,
} from "./db";

export interface SessionAccount {
  id: string;
  name: string;
  email: string;
  provider: string;
}

/** Fallback-safe id generation (randomUUID needs a secure context). */
export function makeId(): string {
  return typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Local session lifecycle. Auth is mocked for now (any login succeeds), but
 * the session JWT is written to the OS keychain and the account row to
 * SQLite — the same contract a real OAuth flow will use.
 */
export async function createSession(
  provider: string,
  email: string,
  name: string,
): Promise<SessionAccount> {
  const id = makeId();
  const jwt = mockJwt({ sub: id, name, email, provider });
  await vault.set(SESSION_VAULT_KEY, jwt);
  await createAccount({ id, provider, email, name, jwt_ref: SESSION_VAULT_KEY });
  return { id, name, email, provider };
}

/** Restores the signed-in account from the keychain JWT + SQLite row. */
export async function getSession(): Promise<SessionAccount | null> {
  try {
    const jwt = await vault.get(SESSION_VAULT_KEY);
    if (!jwt) return null;
    const payload = decodeJwt(jwt);
    if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
      await clearSession();
      return null;
    }
    const account = await getAccountById(payload.sub);
    if (!account) {
      await clearSession();
      return null;
    }
    void touchAccount(account.id);
    return {
      id: account.id,
      name: account.name,
      email: account.email,
      provider: account.provider,
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await vault.remove(SESSION_VAULT_KEY);
  } catch {
    // non-fatal
  }
}
