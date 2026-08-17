# Codvly

Code-first developer infrastructure platform.

Build, configure and deploy an application from one developer workspace. Codvly
does not build infrastructure — it **orchestrates** existing providers
(Vercel, Supabase, Firebase, AWS, ...) through a unified, typed control layer.

```
React UI
   ↓
Tauri (thin native shell: window, keychain, IPC)
   ↓
Local runtime — shared TypeScript packages
   ↓
infra-engine (plan → apply → verify → rollback)
   ↓
providers (typed adapters: Vercel, Supabase, Firebase, ...)
```

The same core packages power the desktop app, the web app and the future CLI.

## Repository layout

```
apps/
  desktop/          Tauri 2 desktop app (thin shell + React UI)
  web/              Web build of the same UI (placeholder)
packages/
  ui/               Shared React components
  config/           Shared types for project/app requirements
  project/          Framework & project detection
  providers/
    core/           Provider interfaces (Hosting, Database, Auth, Storage, Notification)
    vercel/         Vercel adapter (MVP #1)
    supabase/       Supabase adapter (stub)
    firebase/       Firebase adapter (stub)
    aws/            AWS adapter (stub)
  infra-engine/     Deployment orchestration: plan/apply/state/rollback
  auth/             OAuth flows + token vault abstraction
services/
  opencode/         Coding engine adapter (replaceable, not core)
docs/               Architecture & design notes
```

## Getting started

Prerequisites: Node.js 20+, pnpm, Rust (stable), and on Windows the MSVC
toolchain (Visual Studio Build Tools with the C++ workload).

```
pnpm install
pnpm dev          # desktop app (Tauri)
```

## MVP roadmap

1. Detect project (Next.js) → connect GitHub → deploy to Vercel → live URL
2. Next.js + backend on a second provider
3. Google authentication, configured automatically
4. Supabase, Firebase, AWS, Docker, CI/CD, rollback, secrets
