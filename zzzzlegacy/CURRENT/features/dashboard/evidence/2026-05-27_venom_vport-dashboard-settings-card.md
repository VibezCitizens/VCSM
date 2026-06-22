# VENOM Security Audit — VPORT Dashboard Settings Card

**Date:** 2026-05-27
**Reviewer:** VENOM
**Ticket:** TICKET-0003 — VPORT Dashboard Card Logan Inventory (Phase 3, Step 2)
**Trigger:** Second VENOM security documentation pass for newly documented settings card module
**Findings:** 0 CRITICAL | 2 HIGH | 2 MEDIUM | 2 LOW

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Dashboard — Settings Card
Application Scope: VCSM
Reason for review: Module documented 2026-05-27; marked SECURITY_REVIEW_PENDING; HIGH risk (public-facing identity write surface, TRAZE visibility control, business card display settings)
Primary trust boundary: assertActorOwnsVportActorController — controller-layer gate on write paths
```

---

## SECURITY SURFACE

```
Entry point:        VportSettingsFinalScreen.jsx → VportSettingsScreen.jsx
Auth source:        useIdentity() → @/state/identity/identityContext (both screens consistent)
Authorization layer: Screen-level useVportOwnership + controller-level assertActorOwnsVportActorController
Identity surface:   actorId + kind (correct main path); identity.vportType also used (see VENOM-SETTINGS-006)
Sensitive objects:  vport.profile_public_details (public identity: email, phone, address, lat/lng),
                    vport.profiles.directory_visible (TRAZE SEO discovery),
                    vport.profiles.business_card_settings (public display toggles)
```

---

## TRUST BOUNDARY TRACE

```
Client input:       actorId from route params, identity from context, payload from draft state
Validated at:       Hook layer (address + phone format validation)
Identity resolved at: useIdentity() → identity.actorId → requestActorId
Authorization enforced at:
  - Screen: useVportOwnership (gate before any hook fires in View Screen)
  - Controller: assertActorOwnsVportActorController (before any DB read or write)
  - DAL (write): owner_user_id = auth.uid() — defense-in-depth WHERE clause on profile writes
  - DAL (public details write): NO auth/ownership check — application-layer only
Data returned to:   Settings screen (owner-gated)
```

---

## CONFIRMED SECURE — PRELIMINARY FINDINGS RESOLVED

| Preliminary ID | Status | What VENOM found |
|---|---|---|
| SETTINGS-FIND-002 | RESOLVED | `ctrlSetVportDirectoryVisible` enforces `assertActorOwnsVportActorController` + DAL `owner_user_id = auth.uid()`. Dual-gate confirmed. |
| SETTINGS-FIND-003 | RESOLVED | `ctrlSetVportBusinessCardSettings` enforces `assertActorOwnsVportActorController` + DAL `owner_user_id = auth.uid()`. Dual-gate confirmed. |
| `saveVportPublicDetailsByActorIdController` | VERIFIED | Calls `assertActorOwnsVportActorController` before any profile read or DAL write. Ownership gate correct and early. |
| Screen gate | VERIFIED | `VportSettingsFinalScreen` uses `useVportOwnership(viewerActorId, actorId)` — non-owners see access-denied before any hook in `VportSettingsScreen` fires. |

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-001

```
Location: cards/settings/dal/vportPublicDetails.write.dal.js — upsertVportPublicDetailsDAL
          cards/settings/index.js — line 2 (exports DAL directly)
Application Scope: VCSM
```

**Current behavior:** `upsertVportPublicDetailsDAL` upserts to `vport.profile_public_details` based on `profile_id` only. There is no `auth.uid()` check, no `owner_user_id` filter, and no ownership assertion in the DAL. The controller calling it (`saveVportPublicDetailsByActorIdController`) enforces ownership correctly — but the DAL is also exported directly from `cards/settings/index.js` (line 2: `export * from "./dal/vportPublicDetails.write.dal"`), making it callable from any importer of the module without going through the controller.

The data written includes: `website_url`, `booking_url`, `email_public`, `phone_public`, `location_text`, `address` (JSON), `lat`, `lng`, `hours`, `highlights`, `languages`, `payment_methods`, `social_links`, `price_tier`. This is the entirety of a VPORT's public identity data — consumed externally by TRAZE, public business cards, and QR landing pages.

**Risk:** Any caller that imports `upsertVportPublicDetailsDAL` from this module's public surface can overwrite any VPORT's public contact data, address, and geolocation — bypassing the controller ownership gate — unless RLS prevents it (unverified, see VENOM-SETTINGS-002).

**Severity:** HIGH

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Must import `upsertVportPublicDetailsDAL` directly (possible given the index.js export)
- Needs to know the target VPORT's `profile_id` (internal, not in URLs — but derivable from actorId via `ctrlResolveVportIdByActorId`)
- Requires RLS to also be absent or misconfigured (VENOM-SETTINGS-002 is the paired risk)

**Blast Radius:** Multi-actor — if DAL is called directly, any VPORT's public details can be overwritten. Public-facing identity corruption affects TRAZE SEO indexing, business card consumers, and QR landing pages.

**Why it matters:** The VCSM architecture contract explicitly bans DAL exports from adapter/module boundaries ("Adapters never export DAL functions"). This finding is simultaneously an architecture violation and a security risk: exporting the DAL creates a bypass channel around the controller-layer ownership gate.

**Recommended mitigation:**
1. Remove `export * from "./dal/vportPublicDetails.write.dal"` from `cards/settings/index.js`.
2. Add `auth.uid()` enforcement to `upsertVportPublicDetailsDAL` (matching the pattern in `setVportBusinessCardSettingsDAL`): resolve `userId` from `supabase.auth.getUser()` and add `.eq("profile_id", row.profile_id)` + a pre-check that the profile belongs to the caller.
3. Or: rely on RLS once VENOM-SETTINGS-002 is resolved via CARNAGE — but both fixes should be applied for defense-in-depth.

**Rationale:** Architecture rule + security rule alignment. The export creates the attack channel; the DAL's missing auth check makes the channel dangerous.

**Follow-up command:** ELEKTRA (remove DAL export from index.js; add auth guard to DAL)

**CISSP Domain:**
- Primary: Software Development Security
- Secondary: Identity and Access Management, Asset Security

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-002

```
Location: vport.profile_public_details (table) — all settings write paths
Application Scope: VCSM
```

**Current behavior:** All writes to `vport.profile_public_details` (public identity, TRAZE sync) are protected at the application layer. RLS on this table has not been audited. Unlike `vport.profiles` (which enforces `owner_user_id = auth.uid()` in write DALs), `vport.profile_public_details` has no visible DB-layer ownership enforcement in the DAL — the `upsertVportPublicDetailsDAL` writes with only `profile_id` as the filter.

**Risk:** If RLS is absent on `vport.profile_public_details`, any authenticated user with a known `profile_id` (derivable from actorId) can overwrite another VPORT's public identity data using the Supabase anon/user client directly, or through the exported DAL (VENOM-SETTINGS-001).

**Severity:** HIGH (defense-in-depth gap on public-identity write surface)

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Authenticated Citizen account required
- Target VPORT's `profile_id` needed (not in URLs, but resolvable via public actorId)
- Depends on RLS being absent — this is the UNVERIFIED condition

**Blast Radius:** Multi-actor — if RLS is absent, all VPORTs' public details tables are writable by any authenticated user.

**Why it matters:** `vport.profile_public_details` is the data surface consumed by TRAZE, public business cards, and QR landing pages. Overwriting a business's public phone/email/address/geolocation causes real-world harm and external SEO corruption.

**Recommended mitigation:**
Run CARNAGE to inspect RLS on `vport.profile_public_details`. Expected policies:
- SELECT: any authenticated user (data is public-facing)
- INSERT/UPDATE: only the profile owner (`vport.profiles.owner_user_id = auth.uid()` via a join check, or a SECURITY DEFINER function)
- DELETE: never directly (no hard-delete pattern should exist here)

**Rationale:** This is the most consequential table in the settings card. It must have DB-level write protection.

**Follow-up command:** CARNAGE (RLS audit for `vport.profile_public_details`)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Security and Risk Management, Asset Security

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-003

```
Location: features/settings/vports/dal/vports.write.dal.js — syncDirectoryVisibleToPublicDetailsDAL
Application Scope: VCSM
```

**Current behavior:** `syncDirectoryVisibleToPublicDetailsDAL(vportId, visible)` updates `vport.profile_public_details.directory_visible` using only a `profile_id` filter. No `supabase.auth.getUser()` call, no `owner_user_id` check, no auth enforcement. It is a raw UPDATE scoped only by the ID passed in.

This function is called from `ctrlSetVportDirectoryVisible` as a non-blocking secondary sync AFTER the controller-layer ownership check passes. In the normal call path, this is safe. However, the function is exported from the DAL module and can be called directly with any `vportId`.

**Risk:** A caller with knowledge of a target VPORT's `profile_id` can call this function directly to toggle `directory_visible` for any VPORT without any ownership check — making the VPORT appear or disappear from the TRAZE SEO directory.

**Severity:** MEDIUM

**Exploitability:** MEDIUM
**Attack Preconditions:**
- Must import the function directly (DAL is not currently exported at module boundary — less exposure than VENOM-SETTINGS-001)
- Needs `profile_id` of target VPORT (not in URLs)
- If called from within the codebase (future accidental use), no auth barrier

**Blast Radius:** TRAZE SEO discovery — toggling `directory_visible` removes a business from or adds it to the programmatic SEO directory. Affects external search visibility.

**Why it matters:** TRAZE visibility is a business-critical setting. Unauthorized modification removes a VPORT from SEO discovery or re-enables it despite suspension. The function should always enforce auth, not rely solely on callers being well-behaved.

**Recommended mitigation:**
Add `supabase.auth.getUser()` + `owner_user_id = userId` enforcement to `syncDirectoryVisibleToPublicDetailsDAL` — matching the pattern in `setVportDirectoryVisibleDAL`. Alternatively, make it a package-private function (unexported) so only the controller can call it.

**Rationale:** Auth enforcement should be a DAL-level invariant for write functions, not optional depending on the call path.

**Follow-up command:** ELEKTRA (add auth guard to syncDirectoryVisibleToPublicDetailsDAL)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-004

```
Location: features/settings/vports/dal/vports.read.dal.js — listMyVportsDAL, readMyVports
Application Scope: VCSM
```

**Current behavior:** Both `listMyVportsDAL` and `readMyVports` query `vport.profiles` with `.eq("owner_user_id", userId)` where `userId` comes from `supabase.auth.getUser()`. This is the legacy profile ownership model — the architecture contract prohibits using `owner_user_id` as an identity authority and requires all ownership to go through `actor_owners`.

`listMyVportsDAL` also selects: `id, name, slug, avatar_url, banner_url, bio, is_active, is_deleted, business_card_published, directory_visible, directory_status, created_at, actor_id` — a broad column list that includes `is_deleted` and `directory_status` (which includes suspension state).

**Risk:**
1. Architecture contract violation — `owner_user_id` as identity authority is banned.
2. `owner_user_id` may diverge from `actor_owners` during migration or edge cases, causing this function to return VPORTs that are no longer linked to the calling actor's identity in the canonical system.
3. `is_deleted` and `directory_status` (including "suspended") are returned in the list — these are internal state flags that should not be surfaced unless explicitly required.

**Severity:** MEDIUM

**Exploitability:** LOW
**Attack Preconditions:**
- Requires data divergence between `owner_user_id` and `actor_owners` — edge case, not typically exploitable from a normal user account
- Primarily a data correctness and architecture compliance risk

**Blast Radius:** Settings screen only — affects what VPORTs the calling user sees in their settings tab list.

**Why it matters:** Using the banned identity authority creates correctness risk and architecture drift. The `is_deleted` and `directory_status` fields in the response are internal state that may not need to be returned to the UI.

**Recommended mitigation:**
1. Replace `owner_user_id = userId` filter with `actor_owners` lookup: resolve the calling user's actorIds via `actor_owners`, then fetch matching `vport.profiles` rows.
2. Review whether `is_deleted` and `directory_status` are needed in the list response — if not, remove from the select column list.

**Rationale:** VCSM identity contract requires `actor_owners` as the single source of ownership truth.

**Follow-up command:** ARCHITECT (confirm actor_owners query pattern for "list my VPORTs" use case)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-005

```
Location: features/settings/vports/controller/vportDirectoryVisibility.controller.js — ctrlGetVportDirectoryState
          features/settings/vports/controller/vportBusinessCardSettings.controller.js — ctrlGetVportBusinessCardSettings
Application Scope: VCSM
```

**Current behavior:** Both read controllers pass directly to the DAL without a controller-layer ownership check:
```javascript
export async function ctrlGetVportDirectoryState({ vportId }) {
  if (!vportId) return null;
  return readVportDirectoryStateDAL(vportId);
}
export async function ctrlGetVportBusinessCardSettings({ vportId }) {
  if (!vportId) return null;
  return readVportBusinessCardSettingsDAL(vportId);
}
```

The DALs enforce `owner_user_id = auth.uid()` — so in practice, only the session user can read their own data. However, the controllers provide no ownership check, relying entirely on the DAL for protection.

**Risk:** Defense-in-depth gap. If the DAL-level auth check is removed or changed, controller behavior silently becomes unsafe. Pattern is inconsistent with write controllers that always have controller-layer gates.

**Severity:** LOW

**Exploitability:** LOW
**Attack Preconditions:**
- DAL-level auth check must be removed or bypassed — not currently possible
- No direct exploit path exists while DALs enforce auth

**Blast Radius:** Single actor — would affect only the calling user's settings view.

**Why it matters:** Read and write controllers should apply consistent protection patterns. A controller that passes directly to DAL without an ownership check creates an inconsistent trust model that future maintainers may not recognize as "protected by DAL."

**Recommended mitigation:**
Add `callerActorId` to both read controllers and verify ownership (or at minimum verify `callerActorId` is not null) before delegating to DAL, matching the write controller pattern.

**Rationale:** Consistent defense-in-depth. Controllers should not delegate security entirely to the DAL layer.

**Follow-up command:** ELEKTRA (low-priority: add null-actor guard to read controllers)

**CISSP Domain:**
- Primary: Security Architecture and Engineering
- Secondary: Software Development Security

---

## VENOM SECURITY FINDING — VENOM-SETTINGS-006

```
Location: cards/settings/VportSettingsScreen.jsx — line 69 (identity.vportType usage)
Application Scope: VCSM
```

**Current behavior:**
```javascript
const vportType = useMemo(
  () => normalizeVportType(identity?.vportType ?? dashboardDetails.vportType ?? null),
  [dashboardDetails.vportType, identity?.vportType]
);
```

`identity?.vportType` is read from the identity context and used to determine which dashboard tabs and card settings are shown. `vportType` is not part of the canonical identity surface (`actorId` + `kind`). The architecture contract defines the canonical fields as `actorId` and `kind`; `vportType` is not enumerated.

**Risk:** If `identity.vportType` is populated from the wrong source (e.g., cached state from a previously active VPORT), the settings screen could render tabs/toggles for the wrong VPORT type. This could expose or hide settings sections inappropriately (e.g., service-specific toggles appearing for a different VPORT kind). Severity is low because the fallback is `dashboardDetails.vportType` from the DB.

**Severity:** LOW

**Exploitability:** LOW
**Attack Preconditions:**
- Requires identity context to contain stale or incorrect `vportType` for the active VPORT
- No direct exploit — primarily a correctness/architecture risk

**Blast Radius:** Single actor — affects only the settings display for the calling user.

**Why it matters:** Using non-canonical identity fields creates drift risk. As `kind` is the canonical VCSM identity classification, `vportType` resolution should come from the DB (already available via `dashboardDetails.vportType`) rather than the identity context.

**Recommended mitigation:**
Remove `identity?.vportType` from the `useMemo` dependency. Use `dashboardDetails.vportType` as the sole source for `vportType` determination. The identity context should not be queried for VPORT kind/type data beyond `actorId` and `kind`.

**Rationale:** Canonical identity fields should be the authority. Non-canonical fields from identity context create drift and correctness risk.

**Follow-up command:** SENTRY (architecture compliance — canonical identity surface)

**CISSP Domain:**
- Primary: Identity and Access Management
- Secondary: Software Development Security

---

## MITIGATION PLAN SUMMARY

| Finding | Severity | Layer to Fix | Follow-up |
|---|---|---|---|
| VENOM-SETTINGS-001 | HIGH | DAL (add auth guard) + Module boundary (remove DAL export from index.js) | ELEKTRA |
| VENOM-SETTINGS-002 | HIGH | DB/RLS (audit + add write policies for profile_public_details) | CARNAGE |
| VENOM-SETTINGS-003 | MEDIUM | DAL (add auth guard to syncDirectoryVisibleToPublicDetailsDAL) | ELEKTRA |
| VENOM-SETTINGS-004 | MEDIUM | DAL (replace owner_user_id with actor_owners lookup) | ARCHITECT |
| VENOM-SETTINGS-005 | LOW | Controller (add ownership guard to read controllers) | ELEKTRA |
| VENOM-SETTINGS-006 | LOW | Screen (remove identity.vportType, use dashboardDetails.vportType only) | SENTRY |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 1 | VENOM-SETTINGS-002 (secondary) — unverified RLS on public identity table represents systemic risk |
| Asset Security | 2 | VENOM-SETTINGS-001 (secondary) + VENOM-SETTINGS-002 (secondary) — public identity data could be corrupted |
| Security Architecture and Engineering | 2 | VENOM-SETTINGS-002 (primary), VENOM-SETTINGS-005 (primary) — defense-in-depth gaps |
| Communication and Network Security | 0 | Public details are written to DB, not directly to external network surfaces from this path |
| Identity and Access Management | 4 | VENOM-SETTINGS-001 (secondary), VENOM-SETTINGS-003 (primary), VENOM-SETTINGS-004 (primary), VENOM-SETTINGS-006 (primary) |
| Security Assessment and Testing | 0 | No test coverage gap findings in this card (card has no test files at all — noted but no open test files to audit) |
| Security Operations | 0 | No audit trail or logging issues specific to this card |
| Software Development Security | 6 | Secondary classification on VENOM-SETTINGS-001, 003, 004, 005, 006; architecture contract violation noted |

**Uncovered domains:**
- **Communication and Network Security** — out of scope for this card (DB writes only, no network-facing surfaces in this path)
- **Security Assessment and Testing** — the absence of test files is noted but not actionable without a test suite; flagging to SPIDER-MAN as follow-up outside this report
- **Security Operations** — no findings; write paths have controller-level gates and DAL-level fallback guards

**VENOM completion status:** COMPLETE — all findings classified, all CISSP domains assigned or explicitly noted as out-of-scope, summary table complete.
