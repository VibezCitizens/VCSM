# Debuggers

Centralized dev-only debug instrumentation for the VCSM monorepo.

## Rules

- Every debugger here is **DEV-ONLY** — gated by `import.meta.env.DEV`
- Nothing in this directory runs in production
- Debuggers render **on-screen** — no console-only output
- Each debugger is a self-contained module (store + panel + helpers)

## Structure

```
debuggers/
  identity/          — Login + identity pipeline debugger
  (future: chat/)    — Chat pipeline debugger
  (future: feed/)    — Feed pipeline debugger
```

## Usage from App

```js
// In App.jsx or root layout — eagerly loaded, not lazy
import { IdentityDebugPanel } from '@debuggers/identity'
```
