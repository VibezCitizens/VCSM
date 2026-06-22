# Feature Health Metrics Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** Feature Health Metrics Rule

---

## Rule

Each feature must be measurable. Track all metrics listed below.

---

## Required Metrics

| Metric | Description |
|---|---|
| File count per feature | Total files inside the feature folder |
| Files over 250 lines | Count of files approaching size limit |
| Files over 300 lines | Count of files violating the 300-line hard limit |
| Max folder depth | Deepest nesting level below feature root |
| Cross-feature import count | How many imports cross feature boundaries |
| Direct internal feature imports | Imports that bypass the adapter |
| Adapter export violations | Features exporting non-adapter symbols |
| DAL Supabase/auth violations | DAL files importing auth or other anti-patterns |
| Hook-to-DAL violations | Hooks that call DAL directly instead of controllers |
| UI-to-controller/DAL violations | Screens or components calling controllers or DAL directly |
| React Query adoption percentage | Percentage of server reads using React Query |
| Manual server-state hooks count | Hooks using useState + useEffect for server fetches |
| TTL cache count | DAL-level TTL caches (deprecated) |
| Zustand store count | Zustand stores (must be UI-only; server data is a violation) |

---

## Usage

Metrics must be reviewed regularly and used to prioritize architecture cleanup.

ARCHITECT and review-contract commands must track these metrics per feature when a full audit is run.
