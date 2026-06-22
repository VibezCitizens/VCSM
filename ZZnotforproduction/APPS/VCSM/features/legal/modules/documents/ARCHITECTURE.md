---
title: Documents Module — Architecture
status: STUB
feature: legal
module: documents
source: architect-derived
created: 2026-06-05
---

# legal / modules / documents — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04. Verification required.

## Layer Stack (unverified)

### Document Fetch Flow
```
LegalDocumentScreen.jsx
  └── useLegalDocument.js (React Query)
        └── legalDocument.controller.js
              └── legalDocuments.read.dal.js
                    └── platform.legal_documents (or equivalent table) SELECT
```

### Consent Gate Integration (cross-module)
```
ConsentGateScreen.jsx (consent module)
  └── [links to LegalDocumentScreen or fetches document URLs]
  [content_url sourced from DB — open redirect risk: BW-LEGAL-002]
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| screens/LegalDocumentScreen.jsx | Screen | ARCHITECT-derived |
| controllers/legalDocument.controller.js | Controller | ARCHITECT-derived |
| hooks/useLegalDocument.js | Hook | ARCHITECT-derived |
| dal/legalDocuments.read.dal.js | DAL (read) | ARCHITECT-derived |

## Write Surfaces

None.

## TODO

- [ ] Confirm target table for legalDocuments.read.dal.js
- [ ] Confirm React Query key and staleTime for document cache
- [ ] Confirm document lookup parameter (slug, type, or document ID)
- [ ] Confirm route for LegalDocumentScreen — is it accessible pre-auth?
