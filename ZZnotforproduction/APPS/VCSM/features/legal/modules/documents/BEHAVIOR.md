---
title: Documents Module — Behavior
status: STUB
feature: legal
module: documents
source: architect-derived
created: 2026-06-05
---

# legal / modules / documents — BEHAVIOR

## Status

STUB. No behavior contract. Seeded from ARCHITECT evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-LEGAL-DOCS-001 | Fetch Legal Document | useLegalDocument fetches document content and version by slug/type from DB via legalDocument.controller | UNVERIFIED |
| BEH-LEGAL-DOCS-002 | Render Document | LegalDocumentScreen renders document content; accessible from consent gate links and platform navigation | UNVERIFIED |
| BEH-LEGAL-DOCS-003 | Document Cache | useLegalDocument caches document content; staleTime unconfirmed; same logout-invalidation gap as consent cache | UNVERIFIED |
| BEH-LEGAL-DOCS-004 | Empty Docs Guard | cache bypass guard exists for empty document fetch (BW-LEGAL-008 — implemented but undocumented) | UNVERIFIED |

## TODO

- [ ] Confirm document lookup parameter (slug vs type enum vs UUID)
- [ ] Confirm React Query staleTime for document cache
- [ ] Confirm whether LegalDocumentScreen is accessible pre-authentication (public route)
- [ ] Document empty-docs cache bypass guard behavior
