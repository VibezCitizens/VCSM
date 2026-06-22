# ELEKTRA — Precision Security Report — 2026-06-08

## VENOM TARGET

| Field | Value |
|---|---|
| Scope | apps/VCSM/src — source-to-sink chain tracing |
| Mode | Precision — input validation, ownership chains, secrets, upload, external API |
| Files Scanned | 2130 |
| Controller Files | 241 |
| DAL Files | 299 |
| Worker/Edge Files | 2 |
| Report Date | 2026-06-08 |

## SECURITY SURFACE

| Surface | Findings | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| Authorization Boundaries | 2 | 0 | 2 | 0 | 0 |
| DAL and Data Access | 1 | 1 | 0 | 0 | 0 |
| API and Route Exposure | 12 | 1 | 11 | 0 | 0 |
| Upload/Media Risks | 386 | 0 | 386 | 0 | 0 |

## SOURCE → SINK TRACE

`User Input (params / body / form) → Controller (no validation) → DAL (raw value in query) → Supabase (unfiltered execution)`

**Chain types detected:** raw param-to-DAL without validation, client-trusted booking values, internal UUID forwarded to external API, upload handler without MIME gate, redirect target from query param.

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 2 |
| HIGH | 399 |
| MEDIUM | 0 |
| LOW | 0 |
| **Total** | **401** |

## CISSP Domain Coverage

| Domain | Findings |
|---|---|
| Security and Risk Management | 3 |
| Security Architecture and Engineering | 386 |
| Communication and Network Security | 11 |
| Identity and Access Management | 4 |
| Software Development Security | 398 |

## Findings

### Area: Authorization Boundaries

#### EL-MISSING-WRITE-OWNERSHIP-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/controller/administration/linkParentToStudent.controller.js` |
| Risk | Controller executes DB write (insert/upsert/update/delete) without actor_owners ownership check in scope |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — write operation proceeds without verifying caller owns the target resource via actor_owners |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Verify actor_owners before every write; pass only server-resolved actorId to DAL; never rely solely on RLS |

#### EL-MISSING-WRITE-OWNERSHIP-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/controller/teachers/gradeSubmission.controller.js` |
| Risk | Controller executes DB write (insert/upsert/update/delete) without actor_owners ownership check in scope |
| CISSP Primary | Identity and Access Management |
| CISSP Secondary | Security and Risk Management |
| Exploitability | HIGH — write operation proceeds without verifying caller owns the target resource via actor_owners |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Edge Function |
| Identity Leak Type | Ownership inference |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Verify actor_owners before every write; pass only server-resolved actorId to DAL; never rely solely on RLS |

### Area: DAL and Data Access

#### EL-RAW-INPUT-TO-DAL-1 — CRITICAL

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/services/reorderVportServiceAddon.controller.js` |
| Risk | Route param or searchParam flows directly into supabase query without validation or sanitization |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Identity and Access Management |
| Exploitability | CRITICAL — unvalidated route/query param flows directly into DB call; no sanitization gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | ASSUMED |
| Platform Surface | PWA / Edge Function / Supabase RPC |
| Identity Leak Type | Resource enumeration |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Actor Ownership |
| Layer to Fix | Controller |
| Follow-Up | /DB |
| Recommended | Validate and sanitize all route/search params at the controller boundary before passing to DAL |

### Area: API and Route Exposure

#### EL-URL-REDIRECT-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/callback/controllers/authCallback.controller.js` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/registration/hooks/useRegister.js` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-3 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-4 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/screens/WanderExDirectory.screen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-5 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/screens/WandersIntegrateActor.screen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-6 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/screens/WandersSent.screen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-7 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/routes/learning.routes.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-8 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/screens/shared/LearningAssignmentScreen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-9 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/screens/shared/LearningCourseScreen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-10 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/screens/shared/LearningLessonScreen.jsx` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-URL-REDIRECT-11 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/lib/iosProdDebugger.js` |
| Risk | Redirect destination sourced from query param or user input without allowlist validation — open redirect risk |
| CISSP Primary | Communication and Network Security |
| CISSP Secondary | Software Development Security |
| Exploitability | HIGH — open redirect allows phishing via trusted VCSM domain; attacker controls destination |
| Blast Radius | Multi-actor |
| Trust Boundary | Public Visitor |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Cosmetic |
| Contract Violated | Boundary Isolation |
| Layer to Fix | Controller / Router |
| Follow-Up | /HAWKEYE |
| Recommended | Validate redirect targets against an allowlist of trusted internal paths; reject absolute URLs from user input |

#### EL-BOOKING-CLIENT-TRUST-1 — CRITICAL

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` |
| Risk | Booking price, duration, or slot data accepted from client payload without server-side re-validation against VPORT source of truth |
| CISSP Primary | Security and Risk Management |
| CISSP Secondary | Identity and Access Management |
| Exploitability | CRITICAL — attacker submits manipulated price, duration, or availability from client; server does not re-verify |
| Blast Radius | Booking-wide |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | NONE |
| Platform Surface | PWA / Native / Edge Function |
| Identity Leak Type | Actor correlation |
| Cache Trust Type | Booking-sensitive |
| Contract Violated | Booking Trust |
| Layer to Fix | Controller |
| Follow-Up | /ELEKTRA |
| Recommended | Re-fetch price/duration/availability from VPORT DB at booking time; never trust client-submitted booking terms |

### Area: Upload/Media Risks

#### EL-UPLOAD-MISSING-VALIDATION-1 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/platform/ios/components/IosInstallPrompt.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-2 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/providers/AuthProvider.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-3 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/routes/index.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-4 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/routes/lazyApp.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-5 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/routes/protected/app.routes.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-6 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/routes/public/howto.routes.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-7 — HIGH

| Field | Value |
|---|---|
| Location | `src/app/routes/public/vportMenu.routes.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-8 — HIGH

| Field | Value |
|---|---|
| Location | `src/debuggers-stub/media/bugBunnyUploadDebugger.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-9 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/dal/block.diagnostics.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-10 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/diagnosticsGroups.part2.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-11 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/actorSystem.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-12 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/bookings.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-13 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/bookings.group.tests2.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-14 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/chatFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-15 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/chatStartFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-16 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/feedFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-17 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/feedFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-18 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/notificationsFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-19 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/profilesFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-20 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/profilesFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-21 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/profilesKindsFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-22 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/publicFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-23 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsAccountFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-24 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-25 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-26 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsPrivacyFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-27 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsProfileFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-28 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/settingsProfileFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-29 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/uploadFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-30 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/uploadFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-31 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/vportFeature.group.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-32 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/groups/vportFeature.group.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-33 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/helpers/ensureActorContext.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-34 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/helpers/featureAudit.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-35 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/helpers/featureAudit.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-36 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/helpers/featureFileMetrics.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-37 — HIGH

| Field | Value |
|---|---|
| Location | `src/dev/diagnostics/ui/DiagnosticsPanel.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-38 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/components/WelcomeFeedCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-39 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/controllers/getFeedViewerContext.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-40 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/controllers/listActorPosts.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-41 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/dal/feed.posts.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-42 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/dal/feed.read.actorsBundle.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-43 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/hooks/useCentralFeedActions.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-44 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/model/feedRowVisibility.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-45 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/CentralFeed/screens/CentralFeedScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-46 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/ads/hooks/useDesktopBreakpoint.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-47 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/login/controllers/profile.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-48 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/login/hooks/useLogin.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-49 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/controllers/createUserActor.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-50 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/controllers/onboarding.bootstrap.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-51 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/controllers/onboarding.complete.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-52 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/controllers/onboarding.join.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-53 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/dal/actorCreate.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-54 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/dal/actorGetByProfile.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-55 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/onboarding/screens/OnboardingScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-56 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/registration/controllers/register.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-57 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/registration/dal/register.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-58 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/registration/hooks/useRegister.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-59 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/registration/screens/WelcomeScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-60 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/auth/shared/model/authInputValidation.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-61 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/guards/BlockGate.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-62 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/hooks/useBlockActions.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-63 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/hooks/useBlockStatus.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-64 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/index.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-65 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/ui/BlockButton.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-66 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/block/ui/BlockedState.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-67 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/assertActorOwnsVportActor.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-68 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/cancelBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-69 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/confirmBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-70 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/createBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-71 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/getBookingServiceProfiles.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-72 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/resolveVportProfileId.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-73 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/controllers/setResourceSlotDuration.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-74 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/dal/readOwnerLinkByActorAndSession.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-75 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/hooks/useQrLinks.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-76 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/model/bookingAvailability.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-77 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/booking/model/buildBookingPayload.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-78 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/components/ChatHeader.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-79 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/components/MessageMedia.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-80 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/controller/recordChatAttachment.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-81 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/chat/conversation/hooks/conversation/useChatAttachmentUpload.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-82 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/chat/inbox/components/CardInbox.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-83 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/explore/ui/ActorSearchResultRow.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-84 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/explore/ui/FeaturedResultCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-85 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/components/FlyerEditorPanel.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-86 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/components/ImageDropzone.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-87 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/controllers/flyerEditor.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-88 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/designStudio/controllers/designStudio.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-89 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/designStudio/hooks/useDesignStudio.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-90 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/hooks/useFlyerEditor.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-91 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/models/vportActorMenuFlyerView.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-92 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/flyerBuilder/screens/VportActorMenuFlyerView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-93 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/hydration/vcsmActorHydrator.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-94 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/identity/dal/refreshActorDirectory.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-95 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/initiation/components/OnboardingCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-96 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/initiation/controllers/onboarding.controller.helpers.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-97 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/initiation/controllers/onboarding.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-98 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/initiation/models/onboarding.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-99 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/initiation/screens/OnboardingCardsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-100 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/join/dal/barberVport.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-101 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/join/screens/JoinBarbershopScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-102 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/config/vportLandingContent.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-103 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/dal/getPublicIp.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-104 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/docs/PrivacyPolicyContent.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-105 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/docs/TermsOfServiceContent.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-106 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/screens/AboutView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-107 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/screens/HowToCreateProfileScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-108 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/legal/screens/components/howToProfileContent.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-109 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/media/controllers/createMediaAsset.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-110 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/media/controllers/softDeleteMediaAsset.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-111 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/media/setup.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-112 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/moderation/hooks/useReportFlow.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-113 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/moderation/types/moderation.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-114 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/notifications/inbox/lib/resolveSenders.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-115 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/notifications/publish.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-116 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/notifications/types/follow/FollowRequestItem.view.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-117 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/post/postcard/components/PostActionsMenu.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-118 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/post/postcard/components/PostBody.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-119 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/post/postcard/components/PostCard.view.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-120 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/post/postcard/controllers/getPostMentionMap.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-121 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/professional/enterprise/data/enterpriseSeed.data.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-122 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/adapters/kinds/vport/vportProfile.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-123 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/adapters/kinds/vport/vportProfiles.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-124 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/components/PrivateProfileGate.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-125 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/components/UnavailableProfileGate.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-126 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/controller/buildActorCanonicalSlug.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-127 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/controller/getProfileView.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-128 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/controller/post/getActorPosts.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-129 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/controller/profileCache.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-130 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/post/fetchPostsForActor.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-131 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorProfile.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-132 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/dal/readActorSeoData.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-133 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/debug/ProfileRouteDebug.dev.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-134 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/hooks/useActorCanonicalSlug.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-135 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/hooks/useActorSlugRedirect.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-136 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/hooks/useProfileView.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-137 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/hooks/useResolveActorBySlug.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-138 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/model/profile.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-139 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/tabs/CitizenTabRouter.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-140 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/citizen/tabs/videos/CitizenVideosTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-141 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-142 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-143 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-144 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-145 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-146 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-147 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-148 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-149 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-150 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/content/createVportContentPage.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-151 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/menu/createVportMenuItemMedia.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-152 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/dal/services/deleteVportServiceAddon.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-153 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithOwner.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-154 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-155 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/hooks/useVportProfileBySlug.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-156 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/hooks/useVportPublicDetails.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-157 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/model/vportOwnership.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-158 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-159 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-160 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-161 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-162 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-163 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-164 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-165 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/booking/view/VportPublicBookingFlow.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-166 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/content/VportContentView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-167 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/content/components/VportContentPageCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-168 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/content/hooks/useVportPublicContent.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-169 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/content/model/contentPageTemplates.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-170 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/VportMenuManageView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-171 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/VportMenuView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-172 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormActions.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-173 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormFields.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-174 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-175 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormPhotoField.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-176 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuManageHeader.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-177 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemForm.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-178 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-179 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-180 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/portfolio/PortfolioEmptyState.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-181 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-182 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-183 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/review/VportReviewsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-184 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/review/components/ReviewsList.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-185 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-186 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-187 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/views/tabs/VportContentView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-188 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-189 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-190 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-191 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/VportTabRouter.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-192 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/about/VportAboutTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-193 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/book/VportBookTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-194 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/content/VportContentTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-195 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/menu/VportMenuTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-196 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/owner/VportOwnerTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-197 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/photos/VportPhotosTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-198 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/portfolio/VportPortfolioTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-199 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/reviews/VportReviewsTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-200 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/services/VportServicesTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-201 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/subscribers/VportSubscribersTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-202 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/team/VportTeamTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-203 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/kinds/vport/tabs/vibes/VportVibesTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-204 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/model/actorSeo.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-205 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/model/photos/enrichPhotoPosts.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-206 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/ActorProfileScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-207 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/UsernameProfileRedirect.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-208 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/components/ActorProfileDevProbe.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-209 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/components/ActorProfileProdDebugPanel.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-210 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileFriendsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-211 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileHeader.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-212 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfilePhotosView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-213 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileTabs.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-214 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileTagsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-215 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/ActorProfileViewScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-216 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/tabs/friends/components/FriendsList.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-217 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/tabs/friends/components/ProfileFriendItem.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-218 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/profiles/screens/views/tabs/friends/hooks/useFriendLists.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-219 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/screens/VportMenuRedirect.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-220 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportBusinessCard/view/BusinessCardMainCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-221 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportBusinessCard/view/businessCardPrimarySection.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-222 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/adapters/vportMenu.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-223 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/readVportPublicDetails.rpc.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-224 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/dal/resolveVportSlug.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-225 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/hooks/useDesktopBreakpoint.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-226 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/model/vportPublicDetails.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-227 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/screen/VportPublicMenuQrScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-228 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/screen/VportPublicMenuRedirectScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-229 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/screen/VportPublicMenuScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-230 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/view/VportPublicMenuQrView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-231 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/view/VportPublicMenuView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-232 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/view/VportPublicReviewsQrView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-233 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/public/vportMenu/view/VportPublicReviewsView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-234 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/qrcode/adapters/qrcode.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-235 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/qrcode/components/flyer/ClassicFlyer.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-236 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/qrcode/components/flyer/ClassicFlyer.styles.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-237 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/qrcode/components/flyer/PosterFlyer.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-238 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/reviews/setup.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-239 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/account/controller/account.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-240 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/account/hooks/useAccountController.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-241 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/adapters/settings.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-242 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/constants.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-243 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/privacy/controller/Blocks.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-244 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/adapter/ProfileTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-245 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/adapter/UserProfileTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-246 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/adapter/VportProfileTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-247 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/authSession.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-248 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/profile.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-249 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/recordProfileMediaAsset.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-250 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/resolveVportIdByActorId.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-251 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/controller/saveProfile.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-252 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/actorIdBySubject.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-253 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profile.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-254 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profile.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-255 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/profileMediaAsset.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-256 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/dal/vportPublicDetails.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-257 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/hooks/useProfileController.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-258 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/model/profile.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-259 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/model/vportPublicDetails.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-260 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/ui/HoursEditor.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-261 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/ui/ProfileTab.view.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-262 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/ui/VportAboutDetails.view.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-263 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/profile/ui/vportAboutDetailsFields.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-264 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/screen/SettingsScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-265 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useProfileActor.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-266 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useResolvedVportId.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-267 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useVportBusinessCardSettings.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-268 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useVportDirectoryVisibility.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-269 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useVportSwitcher.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-270 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/hooks/useVportsController.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-271 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/ui/VportsBusinessCardSection.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-272 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/ui/VportsRecoverModal.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-273 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/settings/vports/ui/VportsTab.view.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-274 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/shell/modules/bottom-bar/components/BottomNavBar.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-275 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/social/friend/request/hooks/useSubscribeAction.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-276 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/adapters/posts.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-277 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/adapters/ui/LinkifiedMentions.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-278 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/controllers/createPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-279 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/controllers/recordPostMedia.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-280 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/controllers/searchMentionSuggestions.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-281 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/dal/findPostMentionsByPostIds.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-282 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/dal/searchMentionSuggestions.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-283 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/hooks/useMentionAutocomplete.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-284 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/hooks/useResolvedActor.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-285 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/hooks/useUploadSubmit.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-286 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/lib/extractMentions.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-287 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/model/uploadTypes.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-288 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/screens/UploadScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-289 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/screens/UploadScreenModern.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-290 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/ActorPill.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-291 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/CaptionCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-292 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/MediaPreview.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-293 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/MentionAutocompleteList.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-294 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/MentionChips.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-295 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/MentionTypeahead.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-296 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/PrimaryActionButton.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-297 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/SegmentedButton.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-298 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/SelectedThumbStrip.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-299 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/TagChips.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-300 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/UploadCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-301 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/upload/ui/UploadHeader.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-302 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/adapters/vport.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-303 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/components/CreateVportProfileTab.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-304 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/controllers/submitCreateVport.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-305 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/dal/vport.write.profileMedia.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-306 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/hooks/useCreateVport.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-307 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/public/vportPreviewData.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-308 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/public/vportPreviewModel.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-309 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/screens/RestoreVportScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-310 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vport/vport.public.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-311 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/controller/vportOwnerStats.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-312 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/bookings/controller/createOwnerBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-313 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/bookings/controller/updateVportBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-314 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/bookings/controller/vportPublicBooking.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-315 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/exchange/VportDashboardExchangeScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-316 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/controller/publishFuelPriceUpdateAsPost.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-317 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/controller/submitFuelPriceSuggestion.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-318 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-319 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-320 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-321 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/leads/VportDashboardLeadsScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-322 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/leads/controller/vportLeads.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-323 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/leads/model/vportDashboardLeadsScreen.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-324 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/locksmith/hooks/useLocksmithDashboard.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-325 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/components/PortfolioBugsBunnyPanel.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-326 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/components/PortfolioDevDiagnosticPanel.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-327 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/components/portfolio/PortfolioItemForm.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-328 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/controller/addPortfolioMediaWithRecord.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-329 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/controller/probeVportPortfolio.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-330 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-331 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/hooks/usePortfolioItemSubmit.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-332 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/portfolio/hooks/usePortfolioMediaUpload.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-333 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/schedule/controller/loadDaySchedule.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-334 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/settings/components/VportSettingsBusinessCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-335 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/settings/controller/saveVportPublicDetailsByActorId.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-336 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/controller/vportTeam.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-337 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/controller/vportTeamAccess.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-338 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/controller/vportTeamInvite.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-339 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/dashboard/cards/team/dal/vportTeam.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-340 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/model/buildDashboardCards.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-341 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/model/dashboardVportDetails.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-342 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/VportDashboardScreen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-343 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/components/VportDashboardParts.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-344 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/lib/vportSettingsValidation.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-345 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/model/buildDashboardCards.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-346 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/model/dashboardViewByVportType.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-347 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/vportDashboard/screens/model/vportBookingHistoryView.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-348 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/adapters/wanderex.adapter.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-349 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/components/WanderExHeroCard.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-350 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/dal/wanderexPublic.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-351 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/dal/wanderexPublicHelpers.read.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-352 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/hooks/useWanderExBookingFlow.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-353 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/hooks/useWanderExBookingSubmit.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-354 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/hooks/useWanderExProfile.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-355 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/model/wanderexAvailability.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-356 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/model/wanderexPublic.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-357 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/screens/WanderExBook.screen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-358 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/screens/WanderExDirectory.screen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-359 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanderex/screens/WanderExHome.screen.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-360 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/WandersSendCardSentView.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-361 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/cardstemplates/CardBuilder.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-362 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/cardstemplates/mothersday/mothers_day.premium.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-363 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/cardstemplates/photo/photo.basic.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-364 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/components/cardstemplates/teacherappreciation/teacher_appreciation.premium.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-365 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/core/controllers/cards.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-366 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-367 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/core/dal/rpc/mailbox.rpc.dal.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-368 — HIGH

| Field | Value |
|---|---|
| Location | `src/features/wanders/services/wandersSupabaseClient.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-369 — HIGH

| Field | Value |
|---|---|
| Location | `src/i18n/setup.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-370 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/components/common/assignments/assignments/SubmissionFilesList.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-371 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/components/common/lessons/lessons/LessonContent.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-372 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/controller/shared/getAssignmentSubmission.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-373 — HIGH

| Field | Value |
|---|---|
| Location | `src/learning/controller/teachers/listCourseSubmissions.controller.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-374 — HIGH

| Field | Value |
|---|---|
| Location | `src/queries/queryKeys.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-375 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/components/ActorLink.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-376 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/components/PublicNavbar.jsx` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-377 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/hooks/useDesktopBreakpoint.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-378 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/hooks/useOneSignalPush.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-379 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/lib/actorSlug.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-380 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/lib/qrUrlBuilders.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-381 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/lib/vport/dashboardVportDetails.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-382 — HIGH

| Field | Value |
|---|---|
| Location | `src/shared/lib/vport/resolveVportProfileId.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-383 — HIGH

| Field | Value |
|---|---|
| Location | `src/state/actors/profileGateStore.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-384 — HIGH

| Field | Value |
|---|---|
| Location | `src/state/identity/identity.model.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-385 — HIGH

| Field | Value |
|---|---|
| Location | `src/state/identity/identitySelectors.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

#### EL-UPLOAD-MISSING-VALIDATION-386 — HIGH

| Field | Value |
|---|---|
| Location | `src/sw.js` |
| Risk | Upload handler does not validate file type, MIME type, or extension before processing or storing |
| CISSP Primary | Software Development Security |
| CISSP Secondary | Security Architecture and Engineering |
| Exploitability | HIGH — attacker uploads malicious file type disguised as media; no MIME/extension gate |
| Blast Radius | Multi-actor |
| Trust Boundary | Authenticated Citizen |
| RLS Dependency | REQUIRED |
| Platform Surface | PWA / Media/Storage |
| Identity Leak Type | UUID exposure |
| Cache Trust Type | Identity-sensitive |
| Contract Violated | Media Access |
| Layer to Fix | Controller / Upload Handler |
| Follow-Up | /VENOM |
| Recommended | Validate MIME type server-side (not just client-reported Content-Type); restrict to allowlisted extensions |

## Mitigation Plan

| ID | Severity | Layer to Fix | Follow-Up | Contract Violated |
|---|---|---|---|---|
| EL-RAW-INPUT-TO-DAL-1 | CRITICAL | Controller | /DB | Actor Ownership |
| EL-URL-REDIRECT-1 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-2 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-3 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-4 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-5 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-6 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-7 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-8 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-9 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-10 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-URL-REDIRECT-11 | HIGH | Controller / Router | /HAWKEYE | Boundary Isolation |
| EL-UPLOAD-MISSING-VALIDATION-1 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-2 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-3 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-4 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-5 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-6 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-7 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-8 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-9 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-10 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-11 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-12 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-13 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-14 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-15 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-16 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-17 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-18 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-19 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-20 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-21 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-22 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-23 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-24 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-25 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-26 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-27 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-28 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-29 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-30 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-31 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-32 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-33 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-34 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-35 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-36 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-37 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-38 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-39 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-40 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-41 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-42 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-43 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-44 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-45 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-46 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-47 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-48 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-49 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-50 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-51 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-52 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-53 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-54 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-55 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-56 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-57 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-58 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-59 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-60 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-61 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-62 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-63 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-64 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-65 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-66 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-67 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-68 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-69 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-70 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-71 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-72 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-73 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-74 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-75 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-76 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-77 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-78 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-79 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-80 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-81 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-82 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-83 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-84 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-85 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-86 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-87 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-88 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-89 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-90 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-91 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-92 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-93 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-94 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-95 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-96 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-97 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-98 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-99 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-100 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-101 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-102 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-103 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-104 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-105 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-106 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-107 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-108 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-109 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-110 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-111 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-112 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-113 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-114 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-115 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-116 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-117 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-118 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-119 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-120 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-121 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-122 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-123 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-124 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-125 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-126 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-127 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-128 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-129 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-130 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-131 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-132 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-133 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-134 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-135 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-136 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-137 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-138 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-139 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-140 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-141 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-142 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-143 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-144 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-145 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-146 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-147 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-148 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-149 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-150 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-151 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-152 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-153 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-154 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-155 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-156 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-157 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-158 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-159 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-160 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-161 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-162 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-163 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-164 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-165 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-166 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-167 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-168 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-169 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-170 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-171 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-172 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-173 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-174 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-175 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-176 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-177 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-178 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-179 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-180 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-181 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-182 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-183 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-184 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-185 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-186 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-187 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-188 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-189 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-190 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-191 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-192 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-193 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-194 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-195 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-196 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-197 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-198 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-199 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-200 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-201 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-202 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-203 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-204 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-205 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-206 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-207 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-208 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-209 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-210 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-211 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-212 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-213 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-214 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-215 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-216 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-217 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-218 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-219 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-220 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-221 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-222 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-223 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-224 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-225 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-226 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-227 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-228 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-229 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-230 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-231 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-232 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-233 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-234 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-235 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-236 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-237 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-238 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-239 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-240 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-241 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-242 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-243 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-244 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-245 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-246 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-247 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-248 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-249 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-250 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-251 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-252 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-253 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-254 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-255 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-256 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-257 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-258 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-259 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-260 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-261 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-262 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-263 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-264 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-265 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-266 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-267 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-268 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-269 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-270 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-271 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-272 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-273 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-274 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-275 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-276 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-277 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-278 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-279 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-280 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-281 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-282 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-283 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-284 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-285 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-286 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-287 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-288 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-289 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-290 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-291 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-292 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-293 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-294 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-295 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-296 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-297 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-298 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-299 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-300 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-301 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-302 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-303 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-304 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-305 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-306 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-307 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-308 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-309 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-310 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-311 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-312 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-313 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-314 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-315 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-316 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-317 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-318 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-319 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-320 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-321 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-322 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-323 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-324 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-325 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-326 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-327 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-328 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-329 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-330 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-331 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-332 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-333 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-334 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-335 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-336 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-337 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-338 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-339 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-340 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-341 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-342 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-343 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-344 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-345 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-346 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-347 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-348 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-349 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-350 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-351 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-352 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-353 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-354 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-355 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-356 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-357 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-358 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-359 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-360 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-361 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-362 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-363 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-364 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-365 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-366 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-367 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-368 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-369 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-370 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-371 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-372 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-373 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-374 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-375 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-376 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-377 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-378 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-379 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-380 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-381 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-382 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-383 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-384 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-385 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-UPLOAD-MISSING-VALIDATION-386 | HIGH | Controller / Upload Handler | /VENOM | Media Access |
| EL-MISSING-WRITE-OWNERSHIP-1 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| EL-MISSING-WRITE-OWNERSHIP-2 | HIGH | Controller | /ELEKTRA | Actor Ownership |
| EL-BOOKING-CLIENT-TRUST-1 | CRITICAL | Controller | /ELEKTRA | Booking Trust |

