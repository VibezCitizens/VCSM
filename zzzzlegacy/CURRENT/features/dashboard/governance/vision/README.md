# Governance: VISION — Analytics Intelligence

**Command:** `/Vision`  
**Authority:** Analytics, telemetry, funnels, and attribution review  
**Mode:** Read-only analysis + findings output  
**Scope in VPORT governance:** All modules with user-facing interactions or conversion events

---

## Responsibility

VISION audits the analytics and telemetry layer of VPORT dashboard modules. It confirms that the right events are tracked at the right moments — and that no tracking exists where it should not.

It covers:
- Event coverage — confirming key user actions in a module emit analytics events
- Funnel integrity — are the steps in a booking, publish, or subscription flow all tracked?
- Attribution accuracy — do events carry the correct actor context (actorId, kind, module)?
- Over-tracking — are any PII fields or sensitive data being emitted in event payloads?
- Dead event detection — are any analytics calls firing on code paths that are no longer reachable?
- A/B test and feature flag instrumentation — is the experiment correctly attributed?
- Conversion tracking — publish, booking confirm, subscription, lead capture events

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | PII in analytics payload (name, email, UUID) | Blocks release |
| HIGH | Core conversion event missing (booking confirm, publish) | Blocks release for analytics-dependent features |
| MEDIUM | Missing funnel step, incorrect actor attribution | Address before THOR |
| LOW | Cosmetic event naming gap, future coverage improvement | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/analytics/YYYY-MM-DD_vision_[module].md`

## When to Run

When a module introduces or changes user-facing interactions. Before THOR on modules that are part of a tracked funnel (booking, publish, subscribe).

## Module Coverage

See `../vport-dashboard-governance-matrix.md` for modules where analytics coverage has been reviewed.
