# MODULE ARCHITECTURE REPORT

**Module:** legal
**Application Scope:** apps/VCSM
**Module Type:** Feature Module — Legal Compliance & Public Info Pages
**Primary Root:** `apps/VCSM/src/features/legal/`
**Independence Status:** MOSTLY INDEPENDENT
**Completeness Status:** MOSTLY COMPLETE

---

## PURPOSE

Owns: legal consent gate (GDPR/ToS consent before app access), legal document rendering (Terms, Privacy Policy, Age Verification), signup consent checkbox, and public how-to / landing pages (VportCategoryLanding, HowToCreateProfile, HowToCreateVport, About, Contact). Also contains a local compliance engine (`legalCompliance.engine.js`).

---

## ENTRY POINTS

- `/legal/consent` → `ConsentGateScreen.jsx`
- `/legal/:docType` → `LegalDocumentScreen.jsx`
- `/about` → `AboutScreen.jsx`
- `/contact` → `ContactScreen.jsx`
- `/how-to/profile` → `HowToCreateProfileScreen.jsx`
- `/how-to/vport` → `HowToCreateVportScreen.jsx`
- `/category/:slug` → `VportCategoryLandingScreen.jsx`

---

## LAYER MAP

**DAL:** `getPublicIp.dal.js`, `legalDocuments.read.dal.js`, `userConsents.read.dal.js`, `userConsents.write.dal.js`

**Controllers:** `legalConsent.controller.js`, `legalDocument.controller.js`

**Hooks:** `useLegalConsent.js`, `useLegalDocument.js`, `useSignupConsent.js`

**Local Engine:** `engine/legalCompliance.engine.js` — embedded compliance orchestration (not a shared engine)

**Docs:** `docs/AgeVerificationContent.jsx`, `docs/PrivacyPolicyContent.jsx`, `docs/TermsOfServiceContent.jsx`

**Config:** `config/vportLandingContent.js` — landing page content config

**Screens:** `AboutScreen.jsx`, `AboutView.jsx`, `ConsentGateScreen.jsx`, `ContactScreen.jsx`, `ContactView.jsx`, `HowToCreateProfileScreen.jsx`, `HowToCreateVportScreen.jsx`, `LegalDocumentScreen.jsx`, `VportCategoryLandingScreen.jsx`, `screens/components/ProfilePhonePreview.jsx`, `screens/components/howToProfileContent.js`

**Adapter:** `legal.adapter.js`

---

## MODULE COMPLETENESS MATRIX

| Area | Status | Evidence | Missing / Risk |
|---|---|---|---|
| Purpose defined | PASS | Legal/compliance clear | — |
| Controllers present | PASS | 2 controllers | — |
| DAL present | PASS | 4 DAL files | — |
| Hooks present | PASS | 3 hooks | — |
| Screens present | PASS | 9 screens | — |
| Adapter present | PASS | legal.adapter.js | — |
| Documentation | FAIL | No Logan doc | — |

---

## DEAD CODE / SPAGHETTI SIGNALS

| Signal | Evidence | Risk | Recommended Handoff |
|---|---|---|---|
| `engine/legalCompliance.engine.js` | Local engine file — not a shared engine | MEDIUM — naming confusion | IRONMAN |
| `getPublicIp.dal.js` | Fetches user IP for consent logging | MEDIUM — privacy sensitive | VENOM |
| `howToProfileContent.js` in screens/components | Content file in screen folder | LOW | IRONMAN |

---

## MODULE MISSING PIECES

| Missing Piece | Severity | Why It Matters | Suggested Owner |
|---|---|---|---|
| Security audit of IP collection | HIGH | User IP stored for consent = privacy regulation risk | VENOM |
| Logan documentation | HIGH | No canonical legal flow docs | LOGAN |
| Rename legalCompliance.engine.js | LOW | Naming confusion with shared engines | IRONMAN |

---

## FINAL MODULE STATUS: MOSTLY COMPLETE

## RECOMMENDED HANDOFFS:
- VENOM (security: IP collection, consent recording)
- LOGAN (documentation)
