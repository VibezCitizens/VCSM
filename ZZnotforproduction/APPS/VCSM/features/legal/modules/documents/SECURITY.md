---
title: Documents Module — Security
status: STUB
feature: legal
module: documents
source: venom-bw-derived
created: 2026-06-05
---

# legal / modules / documents — SECURITY

## Status

STUB. No direct THOR blockers in this module. Upstream finding BW-LEGAL-002 originates in ConsentGateScreen (consent module) but depends on content_url values sourced from documents. ELEKTRA never run.

## Active Security Reviews

| Review | Status | Report |
|---|---|---|
| VENOM | COMPLETE (2026-06-04) | `features/legal/outputs/2026/06/04/Venom/` |
| BlackWidow | COMPLETE (2026-06-04) | `features/legal/outputs/2026/06/04/BlackWidow/` |
| ELEKTRA | NEVER RUN | — |

## Risk Surfaces (unverified)

| Surface | Risk | Confidence |
|---|---|---|
| legalDocuments.read.dal.js | Document content sourced from DB — if content_url field is returned, it feeds the BW-LEGAL-002 open redirect in ConsentGateScreen | UNVERIFIED |
| useLegalDocument.js cache | Cache not invalidated on logout (BW-LEGAL-005 pattern) — stale document content may persist across auth sessions | UNVERIFIED |
| LegalDocumentScreen.jsx | Must not render document content as raw HTML (XSS risk if content contains HTML) | UNVERIFIED |

## TODO

- [ ] Run ELEKTRA on legal feature
- [ ] Confirm whether legalDocuments.read.dal.js returns content_url field — if so, it is the source of the BW-LEGAL-002 open redirect
- [ ] Confirm document content rendering approach — escaped text, markdown, or raw HTML?
- [ ] Confirm cache invalidation behavior for useLegalDocument on logout
