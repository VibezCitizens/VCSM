---
title: Widgets Module — Security
status: STUB
feature: ads
module: widgets
source: blackwidow-derived
created: 2026-06-05
---

# ads / modules / widgets — SECURITY

## THOR Status

NO THOR BLOCKERS — display-only, no write surfaces.

## Findings

### WIDGETS-SEC-001 — Unconfirmed Ad Copy Sanitization
| Field | Value |
|---|---|
| ID | WIDGETS-SEC-001 |
| Source Finding | BW-ADS-004 |
| Severity | LOW |
| Surface | widgets/OnemoredaysAd.jsx |
| Description | OnemoredaysAd.jsx renders user-supplied content (ad copy fields). No confirmed sanitization of ad title, description, or other text fields. If ad copy is rendered via dangerouslySetInnerHTML or without escaping, XSS risk exists. |
| Status | OPEN — UNVERIFIED (depends on props interface and render method) |
| THOR | Not blocked |

## TODO

- [ ] Confirm render method — React JSX (safe by default) or dangerouslySetInnerHTML?
- [ ] Confirm whether ad copy fields are user-generated or system-config only
- [ ] If image URL is rendered via <img src={url}> — confirm URL is not user-supplied without validation
- [ ] Re-evaluate severity after confirming render method (may be INFO if pure JSX)
