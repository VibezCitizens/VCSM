# Tab: reviews

**Key:** `reviews`
**Label:** Reviews
**VPORT Types:** ALL VPORT types
**Landing Tab:** NO
**Last Updated:** 2026-05-27

## Purpose
Displays customer reviews with dimension ratings. Review submission is a visitor write path. Type-specific review dimensions exist (e.g. Rate Fairness for exchange, Trust for barbershop).

## View Component
- Path: `features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`

## Presets
ALL presets

## Risk Level: MEDIUM
Review submission write path — reviewer actorId must be authenticated. Possible duplicate review view component detected (see DTAB-003). Review engine integration via adapter.
