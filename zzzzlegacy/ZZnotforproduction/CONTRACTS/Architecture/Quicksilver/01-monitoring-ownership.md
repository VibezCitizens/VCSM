# Monitoring Ownership
## Quicksilver Architecture Contract — Monitoring Platform Boundary (Locked)

> **Status:** Locked — no changes without explicit contract revision
> **Scope:** All code in `apps/VCSM/`, `apps/quicksilver/`
> **Intended Readers:** All engineers and agents working on monitoring, VCSM, or Quicksilver
> **Migration Reference:** `ZZnotforproduction/APPS/VCSM/QUICKSILVER_MONITORING_MIGRATION_REPORT.md`
> **Change Rule:** Wording changes require contract revision; formatting changes must preserve all meaning

---

## Monitoring Ownership Model

Monitoring is a platform concern owned by Quicksilver.

Monitoring is not a VCSM feature.

Monitoring is not owned by VCSM.

Monitoring business logic belongs to Quicksilver.

VCSM acts only as a monitoring client.

VCSM may:

- capture frontend errors
- capture route failures
- capture unhandled exceptions
- capture telemetry events
- forward monitoring payloads

VCSM must not:

- own error grouping logic
- own fingerprint generation
- own alerting rules
- own incident classification
- own aggregation logic
- own monitoring storage
- own monitoring reporting
- own monitoring dashboards
- own monitoring retention rules

These responsibilities belong to Quicksilver.

---

## Monitoring Boundary

Allowed inside VCSM:

```
apps/VCSM/src/services/monitoring/
apps/VCSM/src/app/monitoring/
```

Purpose:

- SDK wrappers (e.g. Sentry initialization)
- event forwarding to the monitoring endpoint
- error boundary components
- global error and rejection listeners
- client-side PII sanitization before forwarding

These files are adapters only.

They are not monitoring engines.

They contain no grouping logic, fingerprint generation, alerting rules, storage
adapters, or aggregation logic.

Any file in `apps/VCSM/src/services/monitoring/` or `apps/VCSM/src/app/monitoring/`
that performs any of the above operations violates this contract.

---

## Monitoring Logic Prohibited In VCSM

The following logic must never be implemented inside VCSM:

- fingerprint generation
- error grouping
- event aggregation
- incident correlation
- alert routing
- notification escalation
- monitoring analytics
- retention management
- monitoring storage
- monitoring reporting

If any of these capabilities are required, they must be implemented in Quicksilver.

---

## Monitoring Source Of Truth

Canonical monitoring ownership:

```
apps/quicksilver/
```

Canonical monitoring ingest:

```
apps/quicksilver/src/ingest/
```

Canonical monitoring schemas:

```
apps/quicksilver/src/schemas/
```

Canonical monitoring documentation:

```
apps/quicksilver/docs/
```

No other location is the source of truth for monitoring logic.

---

## Temporary Deployment Exception

Monitoring ingest may temporarily exist inside:

```
apps/VCSM/supabase/functions/
```

for deployment continuity only.

This does not establish ownership.

The canonical source remains `apps/quicksilver/src/ingest/`.

Deployment location and ownership location are separate concepts.

The copy at `apps/VCSM/supabase/functions/monitoring-ingest-error/` is a deployment
stub. It must be retired when Quicksilver has its own Supabase project and deployment
pipeline.

Until that migration occurs, any change to the ingest Edge Function must be made in
the canonical source first (`apps/quicksilver/src/ingest/monitoring-ingest-error/`)
and then reflected in the deployment stub.

---

## Monitoring Enforcement Rule

VCSM must never import internal Quicksilver modules.

No `import` or `require` statement inside `apps/VCSM/` may reference any path
inside `apps/quicksilver/`.

Communication between VCSM and Quicksilver must occur through:

- HTTP
- Edge Functions
- RPC
- public APIs

No direct source-code dependency may exist between the applications.

Quicksilver must not import VCSM source files.

The dependency direction is:

```
VCSM → Monitoring API
```

Never:

```
VCSM → Quicksilver internals
Quicksilver → VCSM internals
```

Any violation of this rule is an architecture defect requiring immediate correction.

---

## Final Contract Statement

Monitoring follows the same architectural pattern as Sentry.

Applications emit events.

Monitoring platforms process events.

VCSM is an event producer.

Quicksilver is the monitoring platform.

The boundary between producer and platform is enforced by this contract.
The boundary is not enforced by convention.
The boundary is not enforced by team agreement.
The boundary is enforced by rule.
