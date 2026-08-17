import Database from "@tauri-apps/plugin-sql";

/**
 * Local SQLite (via tauri-plugin-sql, stored in the app data dir). Holds
 * structured app state: accounts, projects, service toggles, settings.
 * Secrets (tokens/JWTs) live in the OS keychain — see ./vault.ts.
 */

let dbPromise: Promise<Database> | null = null;

function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:codvly.db").catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/* ---------- accounts ---------- */

export interface AccountRow {
  id: string;
  provider: string;
  email: string;
  name: string;
  jwt_ref: string;
  created_at: string;
  last_seen_at: string | null;
}

export async function createAccount(
  account: Omit<AccountRow, "created_at" | "last_seen_at">,
): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO accounts (id, provider, email, name, jwt_ref) VALUES ($1, $2, $3, $4, $5)",
    [account.id, account.provider, account.email, account.name, account.jwt_ref],
  );
}

export async function getAccountById(id: string): Promise<AccountRow | undefined> {
  const db = await getDb();
  const rows = await db.select<AccountRow[]>(
    "SELECT * FROM accounts WHERE id = $1 LIMIT 1",
    [id],
  );
  return rows[0];
}

export async function touchAccount(id: string): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      "UPDATE accounts SET last_seen_at = datetime('now') WHERE id = $1",
      [id],
    );
  } catch {
    // non-fatal
  }
}

/* ---------- projects ---------- */

export interface ProjectRow {
  id: string;
  name: string;
  path: string | null;
  last_opened_at: string;
}

export async function listRecentProjects(limit = 5): Promise<ProjectRow[]> {
  try {
    const db = await getDb();
    return await db.select<ProjectRow[]>(
      "SELECT * FROM projects ORDER BY last_opened_at DESC LIMIT $1",
      [limit],
    );
  } catch {
    return [];
  }
}

export async function upsertProject(name: string, path?: string): Promise<void> {
  try {
    const db = await getDb();
    const id =
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    await db.execute(
      `INSERT INTO projects (id, name, path, last_opened_at)
       VALUES ($1, $2, $3, datetime('now'))
       ON CONFLICT(name) DO UPDATE SET
         path = COALESCE($3, projects.path),
         last_opened_at = datetime('now')`,
      [id, name, path ?? null],
    );
  } catch {
    // non-fatal
  }
}

/* ---------- services ---------- */

export interface ServiceRow {
  name: string;
  enabled: number;
  option: string | null;
}

export const DEFAULT_SERVICES: Array<{ name: string; enabled: boolean; option: string | null }> = [
  { name: "Google Authentication", enabled: true, option: null },
  { name: "GitHub Authentication", enabled: true, option: null },
  { name: "Database", enabled: true, option: "Supabase" },
  { name: "Push Notifications", enabled: true, option: null },
  { name: "Object Storage", enabled: true, option: "Supabase Storage" },
  { name: "Custom Domain", enabled: false, option: null },
];

export async function listServices(): Promise<ServiceRow[]> {
  try {
    const db = await getDb();
    const rows = await db.select<ServiceRow[]>(
      "SELECT name, enabled, option FROM services ORDER BY rowid",
    );
    if (rows.length > 0) return rows;
    await db.execute(
      "BEGIN",
    );
    try {
      for (const s of DEFAULT_SERVICES) {
        await db.execute(
          "INSERT OR IGNORE INTO services (name, enabled, option) VALUES ($1, $2, $3)",
          [s.name, s.enabled ? 1 : 0, s.option],
        );
      }
      await db.execute("COMMIT");
    } catch {
      await db.execute("ROLLBACK");
      throw new Error("seed failed");
    }
    return db.select<ServiceRow[]>("SELECT name, enabled, option FROM services ORDER BY rowid");
  } catch {
    return DEFAULT_SERVICES.map((s) => ({
      name: s.name,
      enabled: s.enabled ? 1 : 0,
      option: s.option,
    }));
  }
}

export async function setServiceEnabled(name: string, enabled: boolean): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO services (name, enabled, option) VALUES ($1, $2, NULL)
       ON CONFLICT(name) DO UPDATE SET enabled = $2`,
      [name, enabled ? 1 : 0],
    );
  } catch {
    // non-fatal
  }
}

export async function setServiceOption(name: string, option: string): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO services (name, enabled, option) VALUES ($1, 1, $2)
       ON CONFLICT(name) DO UPDATE SET option = $2`,
      [name, option],
    );
  } catch {
    // non-fatal
  }
}

/* ---------- settings ---------- */

export async function getSettings(): Promise<Record<string, string>> {
  try {
    const db = await getDb();
    const rows = await db.select<Array<{ key: string; value: string }>>(
      "SELECT key, value FROM settings",
    );
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const db = await getDb();
    await db.execute(
      `INSERT INTO settings (key, value) VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = $2`,
      [key, value],
    );
  } catch {
    // non-fatal
  }
}
