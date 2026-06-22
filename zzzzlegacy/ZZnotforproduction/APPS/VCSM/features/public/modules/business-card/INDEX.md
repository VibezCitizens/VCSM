---
title: Business Card Module — Index
status: STUB
feature: public
module: business-card
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / business-card

Anonymous-facing VPORT business card page — displays VPORT info, handles lead form submission with email notification via Edge Function.

## Source Files

| File | Layer |
|---|---|
| vportBusinessCard/controller/vportBusinessCard.controller.js | controller |
| vportBusinessCard/dal/businessCardSections.read.dal.js | read DAL |
| vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | edge DAL |
| vportBusinessCard/dal/vportBusinessCard.read.dal.js | read DAL |
| vportBusinessCard/dal/vportBusinessCardLead.write.dal.js | write DAL |
| vportBusinessCard/hooks/useVportBusinessCardExperience.js | hook |
| vportBusinessCard/hooks/useVportBusinessCardLeadForm.js | hook |
| vportBusinessCard/hooks/useVportBusinessCardSections.js | hook |
| vportBusinessCard/index.js | entry |
| vportBusinessCard/model/businessCardSettings.model.js | model |
| vportBusinessCard/model/vportBusinessCard.model.js | model |
| vportBusinessCard/screen/VportBusinessCardPublic.screen.jsx | screen |
| vportBusinessCard/view/* | views (8 files) |

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## THOR Status

**THOR RELEASE BLOCKER** — BC-SEC-001 (HIGH): Edge Function anon-key auth + SES spam
