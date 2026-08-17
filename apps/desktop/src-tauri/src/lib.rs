// The Tauri shell is intentionally thin.
//
// It owns only what the webview cannot: the native window, the OS keychain
// (secrets vault), file dialogs, process spawning and local SQLite.
//
// All product logic lives in the shared TypeScript packages under
// ../../packages — the desktop app, web app and CLI all consume the same core.

use std::collections::HashMap;
use std::sync::{Arc, LazyLock, Mutex};
use base64::Engine;
use tauri::Emitter;
use tauri_plugin_sql::{Migration, MigrationKind};

/// Keyring service name — entries are scoped per app, not per machine user.
const VAULT_SERVICE: &str = "com.codvly.app";

#[tauri::command]
async fn vault_set(key: String, value: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        keyring::Entry::new(VAULT_SERVICE, &key)
            .map_err(|e| e.to_string())?
            .set_password(&value)
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn vault_get(key: String) -> Result<Option<String>, String> {
    tauri::async_runtime::spawn_blocking(move || {
        match keyring::Entry::new(VAULT_SERVICE, &key)
            .map_err(|e| e.to_string())?
            .get_password()
        {
            Ok(value) => Ok(Some(value)),
            Err(keyring::Error::NoEntry) => Ok(None),
            Err(e) => Err(e.to_string()),
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn vault_delete(key: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        match keyring::Entry::new(VAULT_SERVICE, &key)
            .map_err(|e| e.to_string())?
            .delete_credential()
        {
            Ok(()) => Ok(()),
            Err(keyring::Error::NoEntry) => Ok(()),
            Err(e) => Err(e.to_string()),
        }
    })
    .await
    .map_err(|e| e.to_string())?
}

#[derive(serde::Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
}

/// Directories never shown in the explorer.
const SKIP_DIRS: [&str; 8] = [
    "node_modules", ".git", "dist", "build", "target", ".next", ".cache", "coverage",
];

#[tauri::command]
fn list_dir(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for entry in entries.flatten() {
        let file_type = entry.file_type().map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().into_owned();
        if file_type.is_dir() && SKIP_DIRS.contains(&name.as_str()) {
            continue;
        }
        out.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().into_owned(),
            is_dir: file_type.is_dir(),
        });
    }
    out.sort_by(|a, b| b.is_dir.cmp(&a.is_dir).then(a.name.to_lowercase().cmp(&b.name.to_lowercase())));
    Ok(out)
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if meta.len() > 1024 * 1024 {
        return Err("file too large to open in the editor".into());
    }
    std::fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}

/// Reads a file as base64 (for binary previews: images, video, fonts).
/// Returns an error if the file is larger than `limit` bytes.
#[tauri::command]
fn read_file_base64(path: String, limit: Option<u64>) -> Result<String, String> {
    let limit = limit.unwrap_or(50 * 1024 * 1024);
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    if meta.len() > limit {
        return Err("file too large to preview".into());
    }
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    Ok(base64::engine::general_purpose::STANDARD.encode(bytes))
}

/* ---------- terminal (PTY) ---------- */

struct PtySession {
    master: Arc<Mutex<Box<dyn portable_pty::MasterPty + Send>>>,
    writer: Arc<Mutex<Box<dyn std::io::Write + Send>>>,
    child: Arc<Mutex<Option<Box<dyn portable_pty::Child + Send + Sync>>>>,
}

static SESSIONS: LazyLock<Mutex<HashMap<u32, PtySession>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

#[tauri::command]
async fn pty_open(
    window: tauri::WebviewWindow,
    program: String,
    cwd: Option<String>,
    cols: u32,
    rows: u32,
) -> Result<u32, String> {
    let pty_system = portable_pty::native_pty_system();
    let size = portable_pty::PtySize {
        rows: rows as u16,
        cols: cols as u16,
        pixel_width: 0,
        pixel_height: 0,
    };
    let pair = pty_system.openpty(size).map_err(|e| e.to_string())?;

    let mut cmd = if program.is_empty() {
        portable_pty::CommandBuilder::new_default_prog()
    } else {
        portable_pty::CommandBuilder::new(&program)
    };
    if let Some(dir) = &cwd {
        cmd.cwd(dir);
    }
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
    let pid = child.process_id().unwrap_or(0);

    let master = Arc::new(Mutex::new(pair.master));
    let writer = Arc::new(Mutex::new(
        master
            .lock()
            .unwrap()
            .take_writer()
            .map_err(|e| e.to_string())?,
    ));
    let child = Arc::new(Mutex::new(Some(child)));

    let mut reader = master
        .lock()
        .unwrap()
        .try_clone_reader()
        .map_err(|e| e.to_string())?;
    let evt = format!("pty://{pid}");
    tauri::async_runtime::spawn_blocking(move || {
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let _ = window.emit(&evt, String::from_utf8_lossy(&buf[..n]).into_owned());
                }
                Err(_) => break,
            }
        }
    });

    SESSIONS.lock().unwrap().insert(
        pid,
        PtySession {
            master,
            writer,
            child,
        },
    );
    Ok(pid)
}

#[tauri::command]
async fn pty_write(pid: u32, data: String) -> Result<(), String> {
    let sessions = SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get(&pid) {
        let mut w = session.writer.lock().unwrap();
        w.write_all(data.as_bytes()).map_err(|e| e.to_string())?;
        w.flush().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn pty_resize(pid: u32, cols: u32, rows: u32) -> Result<(), String> {
    let sessions = SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get(&pid) {
        session
            .master
            .lock()
            .unwrap()
            .resize(portable_pty::PtySize {
                rows: rows as u16,
                cols: cols as u16,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn pty_kill(pid: u32) -> Result<(), String> {
    let mut sessions = SESSIONS.lock().unwrap();
    if let Some(session) = sessions.get_mut(&pid) {
        if let Some(child) = session.child.lock().unwrap().as_mut() {
            let _ = child.kill();
        }
    }
    sessions.remove(&pid);
    Ok(())
}

fn migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create core tables",
        kind: MigrationKind::Up,
        sql: r#"
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  jwt_ref TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  path TEXT,
  last_opened_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  name TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  option TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
"#,
    }]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:codvly.db", migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            vault_set,
            vault_get,
            vault_delete,
            list_dir,
            read_file,
            write_file,
            read_file_base64,
            pty_open,
            pty_write,
            pty_resize,
            pty_kill
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
