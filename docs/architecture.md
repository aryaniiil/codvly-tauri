# Architecture

## Layering

The core principle: **the infrastructure engine is the product. Everything
else is a shell.**

```
React UI (shared by desktop & web)
      ↓ invoke / imports
Thin native shell — Tauri (desktop only)
      │   window, keychain, file dialogs, process spawning
      ↓
Shared TypeScript packages (run identically in desktop, web, CLI)
      │   config, project, auth, infra-engine
      ↓
Provider adapters — typed interfaces (packages/providers/*)
      ↓
Vercel · Supabase · Firebase · AWS · ...
```

## Why not put the backend inside Tauri?

- **Desktop, web and CLI must share one engine.** If business logic lived in
  Rust or inside the Tauri webview, the web app and CLI would need a rewrite.
- Tauri is a **shell**: it owns native concerns (keychain, dialogs, spawn) and
  exposes them as commands. All orchestration lives in `@codvly/*` packages.
- Rust code is kept to commands that need native access; the rest is TS.

## AI safety

The coding engine (OpenCode today, swappable) does not execute cloud CLI
commands. It emits **typed intents** which the infra engine validates against
policy and executes through provider interfaces:

```
AI → intent (deploy, configure_oauth, create_database, ...)
   → validation / policy
   → InfraEngine
   → typed provider adapter
```

## Provider abstraction

Each provider implements the capabilities it supports:

| Capability      | Interface          | Providers          |
| --------------- | ------------------ | ------------------ |
| hosting         | HostingProvider    | Vercel (MVP), AWS  |
| database        | DatabaseProvider   | Supabase           |
| auth            | AuthProvider       | Supabase, Firebase |
| storage         | StorageProvider    | Supabase, AWS      |
| notifications   | NotificationProvider | Firebase         |

The infra engine only sees interfaces; providers are registry entries
(`providers["vercel"]`) and can be swapped without touching the engine.

## State & lifecycle

`InfraEngine` plans diffs between **current** (`ResourceState`) and
**desired** state; it modifies existing resources instead of recreating them.
Deployments follow plan → apply → health check → (rollback on failure).

## Secrets

Secret values never leave the vault. `SecretRef` carries only a vault
reference + mask. Desktop uses the OS keychain via Tauri commands; the web
app uses server-side storage; the CLI uses the same vault interface.
