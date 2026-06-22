# SETTINGS_SECURITY_ARCHITECTURE

**Ticket:** TICKET-0004 / SETTINGS-RISK-001
**Phase:** 4 — Settings Security Intersection
**Reference Finding:** VENOM-SETTINGS-002
**Produced:** 2026-06-02
**Status:** Documentation only — no code changes

---

## 1. Current Trust Boundary

The settings card writes to `vport.profile_public_details` — the VPORT's public business
identity table, consumed by TRAZE, business cards, and QR landing pages. The trust chain
is multi-layered:

### Boundary Diagram

```
Client (React Screen)
  ↓ VportSettingsFinalScreen — GATE: useVportOwnership (UI only, not authoritative)
  ↓ VportSettingsScreen
  ↓ useSaveVportSettings (Hook) — manages draft, validation, toast
  ↓ useSaveVportPublicDetailsByActorId (Hook wrapper)
  ↓
  ┌─────────────────────────────────────────────┐
  │  TRUST BOUNDARY 1 — Application Layer Gate  │
  │  saveVportPublicDetailsByActorIdController   │
  │  assertActorOwnsVportActorController(        │
  │    requestActorId, targetActorId             │
  │  )  → queries vc.actor_owners                │
  └─────────────────────────────────────────────┘
  ↓ (passes ownership check)
  ↓ reads vportProfile → profileId
  ↓
  ┌─────────────────────────────────────────────┐
  │  TRUST BOUNDARY 2 — DAL Layer Secondary     │
  │  upsertVportPublicDetailsDAL                 │
  │  supabase.auth.getUser() → userId            │
  │  queries vport.profiles WHERE                │
  │    id = row.profile_id                       │
  │    AND owner_user_id = userId                │
  │  ← LEGACY PATTERN (not actor_owners)        │
  └─────────────────────────────────────────────┘
  ↓ (passes secondary check)
  ↓
  ┌─────────────────────────────────────────────┐
  │  TRUST BOUNDARY 3 — Database RLS Gate       │
  │  vport.profile_public_details               │
  │  Policy: public_details_insert_managed      │
  │  Policy: public_details_update_managed      │
  │  Gate: actor_can_manage_profile(profile_id) │
  │  → queries vc.actor_owners (CANONICAL)      │
  └─────────────────────────────────────────────┘
  ↓ DB write committed
```

### Trust Boundary Strength Assessment

| Boundary | Gate | Strength | Notes |
|---|---|---|---|
| Screen gate | `useVportOwnership` (UI) | WEAK — UI-only | Cannot be relied on as security gate |
| Controller gate | `assertActorOwnsVportActorController` | STRONG — actor_owners query | Authoritative application-layer check |
| DAL secondary | `owner_user_id = userId` check | MEDIUM — legacy pattern | Redundant but uses non-canonical field |
| DB RLS | `actor_can_manage_profile(profile_id)` | STRONG — canonical | Authoritative DB-layer enforcement |

Defense-in-depth: two strong gates (controller + DB RLS) for the write path.
The DAL secondary check is belt-and-suspenders using the legacy pattern — it works but is not
the canonical ownership model.

---

## 2. Current Ownership Boundary

### Ownership Anchor Points

The system uses two distinct ownership patterns — one canonical, one legacy:

**Canonical (new):** `vc.actor_owners` table
- Columns: `actor_id`, `user_id`, `is_void`
- Used by: `assertActorOwnsVportActorController`, RLS `actor_can_manage_profile()`
- Enforced at: controller layer (application) + DB layer (RLS)

**Legacy:** `vport.profiles.owner_user_id`
- Column on vport.profiles table
- Used by: `upsertVportPublicDetailsDAL` secondary check (lines 27–40)
- Enforced at: DAL layer only

### Module Boundary Violation (VENOM-SETTINGS-001)

`cards/settings/index.js` line 2 exports `upsertVportPublicDetailsDAL` from the card's
public surface:
```javascript
export * from "./dal/vportPublicDetails.write.dal";
```

This creates a bypass channel: any module that imports from the settings card's public index
can call the DAL directly, bypassing Boundary 1 (controller gate). The DAL's secondary
`owner_user_id` check (Boundary 2) would fire, but it uses the legacy pattern and is weaker
than `assertActorOwnsVportActorController`.

**Current exposure:** DAL is exported from index.js but no known caller bypasses the controller.
The risk is structural — the bypass path exists, not that it is being exploited.

**Resolution (planned, ELEKTRA task):** Remove `vportPublicDetails.write.dal` from `index.js` exports.

---

## 3. Current Write Path

### Primary Write Path — About / Address / Hours

```
1. User updates form field
   → VportSettingsScreen: onChange(patch) → useSaveVportSettings.onChange(patch)
   → draft state updated

2. User clicks Save
   → useSaveVportSettings.onSave()
   → validation: normalizeAddress(draft.address)
   → validation: hasCompleteAddress() — if partial address, block
   → validation: getAddressValidationError() — specific message
   → (phone validation)

3. If valid:
   → useSaveVportPublicDetailsByActorId.saveByActorId(draft)
   → saveVportPublicDetailsByActorIdController({
         requestActorId: identity.actorId,
         targetActorId: actorId
       })

4. Controller:
   → assertActorOwnsVportActorController(requestActorId, targetActorId)   [GATE 1]
   → readVportProfileByActorIdDAL(targetActorId) → profileId
   → normalizeAddress(draft.address)
   → resolveVportCityIdDAL(city) → cityId
   → builds row = { profile_id, city_id, website_url, ... }

5. DAL:
   → upsertVportPublicDetailsDAL({ row })
   → supabase.auth.getUser() → userId
   → check vport.profiles WHERE id = row.profile_id AND owner_user_id = userId  [GATE 2]
   → supabase.from("profile_public_details").upsert(pick(row, ALLOWED_COLS))   [GATE 3 via RLS]

6. On success:
   → invalidation callback fires → cache bust → useVportDashboardDetails refetches
   → toast: "Settings saved"
```

### Secondary Write Paths (Other Settings Domains)

**Directory Visibility (TRAZE toggle):**
```
useVportDirectoryVisibility.toggle(visible)
  → ctrlSetVportDirectoryVisible({ callerActorId, vportActorId, visible })
    → assertActorOwnsVportActorController [GATE 1]
    → DAL: UPDATE vport.profile_public_details
           SET directory_visible = visible
           WHERE vport_id = vportId        [GATE 3 via RLS]
```

**Business Card Settings:**
```
useVportBusinessCardSettings.updateSettings(patch)
  → ctrlSetVportBusinessCardSettings({ callerActorId, vportActorId, patch })
    → assertActorOwnsVportActorController [GATE 1]
    → DAL: UPDATE business_card_settings  [GATE 3 via RLS on that table]
```

**Business Card Publish State (ELEK-2026-05-28-001 — OPEN):**
```
ctrlSetVportBusinessCardPublishState({ ... })
  → NO assertActorOwnsVportActorController  ← MISSING GATE 1
  → SECURITY DEFINER RPC only              ← single gate, no application fallback
```

---

## 4. Dependency on CARNAGE Migration

### What Was Completed (2026-05-27)

Migration `20260527030000_vport_profile_public_details_rls.sql`:
- Dropped 6 legacy policies (mixed `owner_user_id` pattern + redundant TO public)
- Added canonical policies: `public_details_insert_managed`, `public_details_update_managed`
- Gate: `actor_can_manage_profile(profile_id)` — queries `vc.actor_owners`

Migration `20260527040000_vport_profile_public_details_owner_select.sql`:
- Added `public_details_select_owner` policy (owner can SELECT regardless of listing status)
- Fills gap: owner viewing their own unlisted VPORT's settings

**Result:** VENOM-SETTINGS-002 is RESOLVED. RLS is active and canonical on the table.

### What Remains for CARNAGE

**VENOM-SETTINGS-004 — `listMyVportsDAL` uses `owner_user_id` (OPEN, deferred)**
- Location: DAL used to list VPORTs owned by the current user
- Pattern: queries `vport.profiles WHERE owner_user_id = userId`
- Should use: `actor_owners` join
- Risk: MEDIUM — read-only query, no write surface; but if user_id ≠ actor_owner mapping drifts,
  the list may show/hide VPORTs incorrectly
- Sprint: CARNAGE migration sprint (no date assigned)

**VENOM-SETTINGS-001 — DAL export in index.js (OPEN, ELEKTRA task)**
- Not a migration — code fix: remove export from index.js
- No CARNAGE dependency

**DAL layer `owner_user_id` check (lines 27–40 of upsertVportPublicDetailsDAL):**
- The secondary check in the DAL uses the legacy pattern
- CARNAGE should migrate this to use `actor_owners` for consistency
- RLS (canonical) is the authoritative gate — this is belt-and-suspenders
- Risk: LOW — RLS is the final enforcer; this check is redundant

---

## 5. Architectural Impact if RLS Remains Missing

**NOTE: RLS is confirmed present post-migration. This section documents the counterfactual
for architectural record — what the risk would be if RLS were removed or bypassed.**

If `vport.profile_public_details` had no RLS (pre-migration state or hypothetical regression):

### Exposure Surface

Any authenticated user who knows or can obtain a valid `profile_id` could:
1. Call `upsertVportPublicDetailsDAL` directly (if exported from index.js per VENOM-SETTINGS-001)
2. The DAL's secondary `owner_user_id` check would block non-owners — but only at DAL scope
3. Any future DAL refactor that removes the secondary check would expose a full write bypass

### Data at Risk

```
vport.profile_public_details columns:
  - website_url, booking_url   ← Could be replaced with attacker-controlled URLs
  - email_public, phone_public ← PII exfiltration + redirect
  - address, lat, lng          ← Location spoofing
  - hours                      ← Service disruption (showing VPORT as closed)
  - social_links               ← Profile hijacking (social accounts replaced)
  - directory_visible          ← TRAZE suppression / false listing
```

### Downstream Impact

- TRAZE reads `profile_public_details` for all public VPORT pages — poisoned data
  would propagate to indexed SEO pages
- Business card links would redirect to attacker-controlled URLs
- QR landing pages would display false location/contact info

### Architectural Lesson

The three-gate model (controller + DAL secondary + RLS) provides appropriate redundancy.
The absence of any single gate elevates risk to the remaining gates. The confirmed presence
of canonical RLS means Gate 3 (DB) is the final backstop even if Gates 1 and 2 fail.

---

## 6. Open Findings Requiring Architecture Decisions

| Finding | Status | Owner | Impact | Blocks Code? |
|---|---|---|---|---|
| VENOM-SETTINGS-001: DAL exported from index.js | OPEN | ELEKTRA | Bypass channel exists | YES — remove export |
| VENOM-SETTINGS-002: profile_public_details RLS | RESOLVED | CARNAGE | Canonical RLS confirmed | NO |
| VENOM-SETTINGS-003: syncDirectoryVisibleToPublicDetailsDAL auth guard | OPEN | ELEKTRA | DAL writes without session binding | YES |
| VENOM-SETTINGS-004: listMyVportsDAL owner_user_id → actor_owners | OPEN | CARNAGE | Read-only legacy pattern | NO (deferred P2) |
| ELEK-001: ctrlSetVportBusinessCardPublishState no ownership gate | OPEN | SPIDER-MAN | Missing Boundary 1 on write path | YES |
| ELEK-002: ctrlSetActorPrivacy actor impersonation | OPEN | SPIDER-MAN | Any actor can be forced private | YES |
| ELEK-004: dalSetActorPrivacy no auth.getUser() binding | OPEN | DB | DAL accepts any actorId without session check | YES |

### Architecture Decision Required: settingsCoordinator vs direct controller

If `settingsCoordinator.controller.js` is created (per SETTINGS-ARCH-001 planning),
the security architecture changes:
- Coordinator becomes the new Boundary 1 entry point
- `assertActorOwnsVportActorController` must be called in the coordinator, not delegated to sub-controllers
- Sub-controllers (directory, business card) should still verify independently per defense-in-depth

This pattern is compatible with resolving VENOM-SETTINGS-001 simultaneously:
- Remove DAL from index.js as part of the coordinator creation
- Coordinator owns the only path to the write DAL
