# CURRENT_STATUS — legal

**As of:** 2026-06-02
**Source sprints:** 2026-05-10 (VENOM + KRAVEN); 2026-05-18 (VENOM resolution audit)

---

## Command Coverage

| Command | Status | Date | Notes |
|---|---|---|---|
| VENOM | COMPLETED | 2026-05-10 | 9 findings (2 CRITICAL, 3 HIGH, 2 MEDIUM, 1 LOW) |
| VENOM (resolution audit) | COMPLETED | 2026-05-18 | 7 of 9 findings resolved; 1 partially mitigated; 1 dormant |
| KRAVEN | COMPLETED | 2026-05-10 | Performance findings — blocking IP fetch, bundle split gap |
| SENTRY | COMPLETED | 2026-05-10 | Scoped to VPORT system post realm hardening (adjacent — ALIGNED) |
| ELEKTRA | NOT_STARTED | — | Not evidenced in source files |
| SPIDER-MAN | NOT_STARTED | — | Not evidenced in source files |
| FALCON | NOT_STARTED | — | Not evidenced in source files |

---

## Finding Resolution Status (from VENOM 2026-05-18 audit)

| # | Finding | Original Severity | Status |
|---|---|---|---|
| F1 | Gate fails open on error | CRITICAL | RESOLVED — gate now fails closed; recovery UI implemented |
| F2 | syntheticAdultBirthdate writes fake is_adult | CRITICAL | RESOLVED — function removed from codebase |
| F3 | No INSERT GRANT; no immutability on user_consents | HIGH | RESOLVED — migration `20260510030000_user_consents_immutability_and_grant.sql` tracked (live DB application unconfirmed statically) |
| F4 | IP/locale/user_agent client-supplied | HIGH | PARTIAL — ip_address omitted from all writes; locale/user_agent still client-supplied; server-side IP capture (Edge Function) OPEN CARNAGE task |
| F5 | accepted_at set from client clock | MEDIUM | RESOLVED — accepted_at excluded from insert; DB DEFAULT now() used |
| F6 | Barbershop route unregistered (latent) | HIGH (latent) | DORMANT — route still unregistered; all consent/age/link sub-fixes complete; risk reduced to LOW |
| F7 | Age attestation no independent DB record | HIGH | RESOLVED — migration `20260510040000_age_verification_consent_type.sql` tracked; ConsentGateScreen and LegalDocumentScreen wired |
| F8 | Empty active documents returns ALLOW_ACCESS | MEDIUM | RESOLVED — empty docs now throws and fails gate closed |
| F9 | Consent cache keyed only by userId | LOW | RESOLVED — cache key is `${userId}:${appId}` |

**Summary:** 7 resolved, 1 open (F4 partial), 1 dormant (F6 low risk)

---

## Open Items Post-Resolution

| Item | Severity | Notes |
|---|---|---|
| Server-side IP capture via Edge Function | MEDIUM | ip_address safely omitted for now; CARNAGE task must ship before any regulatory audit or Edge Function activation |
| Barbershop route registration | LOW (dormant) | Route dead; all pre-fixes complete; wiring is safe; needs only route registration |
| locale / user_agent still client-supplied | LOW | Informational only; no evidentiary use claimed; no blocking concern |

---

## VPORT System Post Realm Hardening (SENTRY 2026-05-10)

SENTRY reviewed VPORT system post realm hardening (gas + menu controllers + resolvePublicRealm.dal.js). All three files: ALIGNED. Both controllers now resolve realm via `resolvePublicRealmIdDAL()` — independent of viewer session realmId. Void realm launch requires no code changes in these controllers.

Minor cross-feature import note: vport/controller imports from feed/dal/ for `resolvePublicRealmIdDAL`. Acceptable for current stage; future recommendation to move to `shared/lib/realm/`.
