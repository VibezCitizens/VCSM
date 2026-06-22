---
title: Business Card Module — Behavior
status: STUB
feature: public
module: business-card
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / business-card — BEHAVIOR

## Status

STUB. Parent BEHAVIOR.md is a placeholder (VEN-PUBLIC-006 THOR BLOCKER).

## Expected Behaviors (UNVERIFIED)

- Anonymous visitor views VPORT business card (name, sections, contact info)
- Visitor submits lead form (name, phone, message) — triggers vportBusinessCardLead.write.dal
- Edge function send-lead-confirmation dispatches email to VPORT owner
- navigator.userAgent collected client-side and stored with PII (no disclosure)
- No idempotency token, no rate limit — unlimited lead submissions possible (BW-PUBLIC-007)

## Invariants (UNVERIFIED)

- Lead write must not be replayable without rate limiting (NOT enforced — BW-PUBLIC-007 BYPASSED)
- Visitor PII must be disclosed before collection (NOT enforced — VEN-PUBLIC-002)

## TODO

- [ ] Define §9 Must Never Happen invariants
- [ ] Confirm edge function auth mechanism (anon key vs service key)
