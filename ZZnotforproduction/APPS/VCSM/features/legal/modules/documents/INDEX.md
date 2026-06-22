---
title: Documents Module — Index
status: STUB
feature: legal
module: documents
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/legal/
scanner-version: 1.1.0
---

# legal / modules / documents

Legal document display layer. Fetches and renders versioned legal documents (Terms of Service, Privacy Policy, etc.) from the database. Read-only — no writes. Provides document content to both the consent module (gate links) and directly via LegalDocumentScreen.

## Module Summary

| Field | Value |
|---|---|
| Module | documents |
| Feature | legal |
| Source Path | apps/VCSM/src/features/legal/ |
| Screens | 1 (LegalDocumentScreen.jsx) |
| Routes | 0 confirmed in route-map (likely in public router subtree) |
| Write Surfaces | 0 |
| Controllers | 1 |
| Hooks | 1 |
| DAL Files | 1 |

## Known Source Files (ARCHITECT-verified)

### Screens
| File | Role |
|---|---|
| screens/LegalDocumentScreen.jsx | Renders full legal document by slug/type; linked from consent gate and public nav |

### Controllers
| File | Role |
|---|---|
| controllers/legalDocument.controller.js | Fetches document content and version from DB |

### Hooks
| File | Role |
|---|---|
| hooks/useLegalDocument.js | React Query wrapper for document fetch; caches document content |

### DAL
| File | Role |
|---|---|
| dal/legalDocuments.read.dal.js | Reads document content and version from platform.legal_documents (or equivalent) |

## Write Surfaces

None. This module is read-only.

## Security Flags

- MEDIUM: BW-LEGAL-002 (upstream) — content_url values from DB are used in ConsentGateScreen Link to= without validation. If the same URL field is used by this module's document links, the open redirect risk extends here.
- MEDIUM: BW-LEGAL-005 — document cache not invalidated on logout (same module-level cache hygiene gap as consent module)

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm legalDocuments.read.dal.js target table name (platform.legal_documents? platform.legal_policy_documents?)
- [ ] Confirm React Query cache key and staleTime for document fetch
- [ ] Confirm document lookup parameter — by slug, type enum, or ID?
- [ ] Determine whether LegalDocumentScreen is accessible pre-consent (public) or post-consent only
- [ ] Assess whether content_url sanitization finding (BW-LEGAL-002) applies to this module's document links
