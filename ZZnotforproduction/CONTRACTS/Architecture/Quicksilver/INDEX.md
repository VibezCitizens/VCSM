# Quicksilver Architecture Contracts — Index

> **Document Type:** Contract Index
> **Status:** Locked — this index mirrors the contracts in this directory
> **Scope:** `apps/quicksilver/`, `apps/VCSM/src/services/monitoring/`, `apps/VCSM/src/app/monitoring/`
> **Intended Readers:** All engineers and agents working on monitoring, VCSM, or Quicksilver
> **Change Rule:** Add a row when a new contract is created; never summarize contract content here

---

## Contract Files

| Order | File | What It Covers |
|---|---|---|
| 1 | [01-monitoring-ownership.md](01-monitoring-ownership.md) | Monitoring ownership model; VCSM boundary; prohibited logic list; source of truth; deployment exception; enforcement rule; final contract statement |
| 2 | [monitoring-ingest-error.md](monitoring-ingest-error.md) | Edge Function API reference: payload schema, response codes, fingerprint algorithm, persistence order, env vars, DB foundation, local testing, deploy |

---

## Enforcement Summary

| Rule | Contract Section |
|---|---|
| Monitoring is owned by Quicksilver, not VCSM | Monitoring Ownership Model |
| VCSM is an event producer only | Monitoring Ownership Model |
| Only adapters and forwarders allowed in VCSM monitoring paths | Monitoring Boundary |
| Fingerprinting, grouping, alerting, storage, reporting forbidden in VCSM | Monitoring Logic Prohibited In VCSM |
| Canonical source lives at `apps/quicksilver/` | Monitoring Source Of Truth |
| VCSM supabase/functions copy is deployment stub only | Temporary Deployment Exception |
| No direct VCSM import from Quicksilver internals | Monitoring Enforcement Rule |
| No direct Quicksilver import from VCSM internals | Monitoring Enforcement Rule |
| Communication via HTTP, Edge Function, RPC, or public API only | Monitoring Enforcement Rule |
