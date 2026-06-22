---
title: Portfolio Module — Security
status: STUB
feature: portfolio
module: portfolio
source: venom+bw-derived
created: 2026-06-05
---

# portfolio / modules / portfolio — SECURITY

## THOR Status

**THOR RELEASE BLOCKER** — engine-layer findings (VEN-PORTFOLIO-003, BW-PORT-005). Feature-layer clean except debug adapter.

Note: All THOR blockers are in engines/portfolio, not in this feature's 2 source files. They are documented here as cross-references until engines/portfolio governance is built.

## Feature-Layer Findings

### PORT-SEC-001 — Debug Adapter Always Bundled
| Field | Value |
|---|---|
| ID | PORT-SEC-001 |
| Source Findings | VEN-PORTFOLIO-004 (LOW) |
| Severity | LOW |
| Surface | adapters/portfolioTrace.adapter.js |
| Description | portfolioTrace.adapter.js is always bundled in production. Trace store and adapter exports are present in all builds. DEV gate exists only at the engine debugReporter level — adapter import itself has no DEV guard. |
| Status | OPEN |
| THOR | Not blocked |

## Engine-Layer Findings (cross-reference — engines/portfolio)

| Finding | Severity | Description |
|---|---|---|
| VEN-PORTFOLIO-001 / BW-PORT-002 | HIGH | manageTags omits callerProfileId — tag management always throws |
| VEN-PORTFOLIO-002 / BW-PORT-003 | MEDIUM | invalidatePortfolioCache wrong key format — stale data up to 60s post-mutation |
| VEN-PORTFOLIO-003 / BW-PORT-005 | HIGH THOR | getPortfolioItem no is_deleted/visibility filter — private/deleted items exposed |
| VEN-PORTFOLIO-005 | MEDIUM | PortfolioItemModel leaks profileId + createdByActorId to client layer |
| VEN-PORTFOLIO-006 / BW-PORT-004 | MEDIUM | dalDeletePortfolioMedia no app-layer profile_id guard — RLS sole barrier |
| BW-PORT-006 | MEDIUM | dalUpdatePortfolioItem no is_deleted guard — real owner can mutate soft-deleted items |

## ELEKTRA Status

ELEKTRA has NOT been run on this feature.
