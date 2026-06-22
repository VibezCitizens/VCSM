# VENOM V2 Security Review — profiles

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Feature | profiles |
| Application | VCSM |
| Review Date | 2026-06-04 |
| Review Time | 19:48 |
| VENOM Version | V2 |
| Reviewer | VENOM (automated security sheriff) |
| Output File | ZZnotforproduction/APPS/VCSM/features/profiles/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_profiles-security-review.md |
| BEHAVIOR.md Status | PLACEHOLDER — no security rules defined |
| SECURITY.md Pre-existing | NOT EXISTS — created fresh by this run |

---

## 2. Scanner Preflight Block

```
VENOM SCANNER PREFLIGHT
========================
Scanner Version: 1.1.0
Maps Root: /Users/vcsm/Desktop/VCSM/apps/scanner/maps
Freshness Window: 3 days

| Map                  | Generated At                 | Age  | Freshness | Confidence | Status |
|---|---|---|---|---|---|
| write-surface-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-map              | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-function-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| security-path-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| route-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| write-execution-map  | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| rpc-execution-map    | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |
| edge-execution-map   | 2026-06-04T19:48:25.152Z     | <1h  | FRESH     | HIGH       | PASS   |

Overall Preflight: PASS
```

---

## 3. Scanner Inputs Block

| Category | Count |
|---|---|
| Write Surfaces | 28 |
| RPCs | 6 |
| Security Paths | 34 |
| Edge Functions | 0 |
| Write Execution Paths | 28 |
| RPC Execution Paths | 6 |

### Tables Written To

| Table | Operations |
|---|---|
| content_pages | INSERT, DELETE, UPDATE (toggle publish), UPDATE (patch) |
| locksmith_portfolio_details | UPSERT |
| locksmith_service_areas | DELETE, INSERT, UPDATE, UPSERT |
| locksmith_service_details | DELETE, UPSERT (x2) |
| menu_categories | INSERT, DELETE, UPDATE |
| menu_items | INSERT, DELETE, UPDATE |
| menu_item_media | INSERT |
| rates | UPSERT |
| service_addons | DELETE |
| services | UPSERT |

### RPCs Called

| RPC | Schema | Callers |
|---|---|---|
| get_friend_ranks | vc | reconcileFriendRanks, readFriendRankRows |
| save_friend_ranks | vc | reconcileFriendRanks, saveFriendRanks |
| count_vport_subscribers | vc | dalCountVportSubscribers |
| list_vport_subscribers | vc | dalListVportSubscribers |

### Edge Functions

None detected.

---

## 4. Security Surface Inventory

| Surface | File | Ownership Check | Auth Enforcement | Notes |
|---|---|---|---|---|
| save_friend_ranks RPC (saveFriendRanks) | friendRanks.write.dal.js | NONE | NONE at DAL | Relies on RPC DB-level RLS only; controller passes ownerActorId from URL params |
| save_friend_ranks RPC (reconcileFriendRanks) | friendRanks.reconcile.dal.js | NONE | NONE at DAL | Reconcile also uses URL-param actorId |
| get_friend_ranks RPC | friends.read.dal.js | NONE | NONE at DAL | Read-only — acceptable |
| content_pages INSERT | createVportContentPage.dal.js | actorId .eq filter + resolveVportProfileId | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| content_pages DELETE | deleteVportContentPage.dal.js | .eq("actor_id", actorId) double filter | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| content_pages UPDATE (toggle publish) | toggleVportContentPagePublish.dal.js | .eq("actor_id", actorId) double filter | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| content_pages UPDATE (patch) | updateVportContentPage.dal.js | .eq("actor_id", actorId) + field allowlist | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| locksmith_portfolio_details UPSERT | locksmithPortfolioDetails.write.dal.js | portfolio_item_id only — NO actor_id filter | assertActorOwnsVportActorController in locksmithOwner.controller.js | HIGH: no actor_id ownership filter at DAL layer |
| locksmith_service_areas DELETE | locksmithServiceAreas.write.dal.js | .eq("actor_id", actorId) | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| locksmith_service_areas INSERT | locksmithServiceAreas.write.dal.js | actor_id injected from param | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| locksmith_service_areas UPDATE | locksmithServiceAreas.write.dal.js | .eq("actor_id", actorId) | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| locksmith_service_areas UPSERT | locksmithServiceAreas.write.dal.js | NOT EXPORTED — dead code | N/A | scanner lead only — function not exported |
| locksmith_service_details UPSERT | locksmithServiceDetails.write.dal.js | .eq("actor_id", actorId) indirectly via onConflict | assertActorOwnsVportActorController in controller | Weak — actor_id not in WHERE filter |
| locksmith_service_details DELETE | locksmithServiceDetails.write.dal.js | .eq("actor_id", actorId) | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| menu_categories INSERT | createVportActorMenuCategory.dal.js | resolveVportProfileId(actorId) — profileId injected | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| menu_categories DELETE | deleteVportActorMenuCategory.dal.js | NO actor_id or profile_id filter — categoryId only | assertActorOwnsVportActorController in controller | HIGH: DAL uses only .eq("id", categoryId) |
| menu_categories UPDATE | updateVportActorMenuCategory.dal.js | .eq("profile_id", profileId) | assertActorOwnsVportActorController indirectly | MEDIUM: profileId passed from controller caller, not re-validated as owned |
| menu_items INSERT | createVportActorMenuItem.dal.js | resolveVportProfileId(actorId) — profileId injected | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| menu_items DELETE | deleteVportActorMenuItem.dal.js | NO actor_id or profile_id filter — itemId only | assertActorOwnsVportActorController in controller | HIGH: DAL uses only .eq("id", itemId) |
| menu_items UPDATE | updateVportActorMenuItem.dal.js | .eq("profile_id", profileId) | Relies on profileId passed by controller | MEDIUM: profileId passed from controller, not confirmed |
| menu_item_media INSERT | createVportMenuItemMedia.dal.js | resolveVportProfileId(actorId) + itemId passed unverified | Depends on controller | MEDIUM: itemId not verified as owned by actor |
| rates UPSERT | upsertVportRate.dal.js | resolveVportProfileId(actorId) + onConflict filter | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| service_addons DELETE | deleteVportServiceAddon.dal.js | .eq("profile_id", profileId) via resolveVportProfileId | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| services UPSERT | upsertVportServicesByActor.dal.js | resolveVportProfileId(actorId) — profileId injected | assertActorOwnsVportActorController in controller | VERIFIED_SAFE |
| count_vport_subscribers | subscribersCount.dal.js | actorId passed — no caller check | getSubscribersController with dalCanViewActorSignal | Read RPC — visibility gate in controller |
| list_vport_subscribers | subscribersList.dal.js | actorId passed — no caller check | getSubscribersController with dalCanViewActorSignal | Read RPC — visibility gate in controller |

---

## 5. Scanner Signals Block

| Signal | Assessment |
|---|---|
| All 34 security paths have LOW confidence (no route-confirmed path) | Expected for this codebase pattern — route linking is not fully mapped |
| All 28 write surfaces have HIGH scanner confidence | Evidence is AST-extracted — reliable |
| 0 edge functions | Profiles feature does not use edge functions |
| RPCs save_friend_ranks and get_friend_ranks: no route execution path confirmed | Warrants deeper inspection — confirmed via source read |
| menu DELETE DALs: no ownership filter in DAL body | SOURCE VERIFIED HIGH finding |
| locksmith portfolio UPSERT: no actor_id filter at DAL | SOURCE VERIFIED HIGH finding |
| friend ranks: ownerActorId taken from URL params in UI | SOURCE VERIFIED HIGH finding |

---

## 6. Behavior Contract Status Block

**BEHAVIOR.md Status: PLACEHOLDER**

The BEHAVIOR.md at `/ZZnotforproduction/APPS/VCSM/features/profiles/BEHAVIOR.md` is a stub with no defined security rules or Must Never Happen invariants.

- Section 5 Security Rules: NONE DEFINED (0 BEH IDs)
- Section 9 Must Never Happen: NONE DEFINED (0 BEH IDs)

This constitutes a finding. The profiles feature is one of the most security-sensitive features in the platform (identity resolution, subscriber lists, content ownership, social graph writes), yet it has no documented security contract. The full behavior contract must be authored and approved before this feature is THOR-eligible.

**MISSING_BEHAVIOR_CONTRACT** is recorded as a HIGH finding (VEN-PROFILES-001).

---

## 7. Trust Boundary Findings

---

### VEN-PROFILES-001 — Missing Behavior Contract

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-001
- Location: ZZnotforproduction/APPS/VCSM/features/profiles/BEHAVIOR.md
- Application Scope: VCSM
- Platform Surface: Feature Governance
- Trust Boundary: Feature security boundary
- Boundary Violated: Security contract is unspecified — no §5 Security Rules, no §9 Must Never Happen invariants
- Contract Violated: VCSM contributor quality gate contract (zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md)
- Current behavior: BEHAVIOR.md is a stub placeholder with no security rules defined
- Risk: Security assumptions cannot be audited against a spec. Future changes have no security invariant baseline to check against.
- Severity: HIGH
- Exploitability: LOW (indirect — no direct exploitable surface, but increases likelihood of future gaps slipping through)
- Attack Preconditions: N/A (governance gap, not a direct attack surface)
- Blast Radius: All 28 write surfaces and 6 RPCs in this feature are uncovered by a behavior contract
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: The profiles feature manages social identity, content ownership, subscriber lists, and friend social graphs — all privacy-sensitive. Without a documented security contract, there is no baseline to verify ownership rules or access restrictions.
- Recommended mitigation: Author a complete BEHAVIOR.md for profiles with §5 Security Rules (ownership rules for each write surface) and §9 Must Never Happen (cross-actor writes, unauthenticated writes, URL-param identity injection)
- Rationale: Without a behavior contract, VENOM and ELEKTRA reviews cannot cross-check implementation against intent. Future reviewers have no baseline.
- Follow-up command: ELEKTRA (full scan after contract is authored)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Security and Risk Management
  - Secondary: Software Development Security
```

---

### VEN-PROFILES-002 — Friend Rank Write: No Session Identity Verification (ownerActorId from URL)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-002
- Location: apps/VCSM/src/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor.jsx:20
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Authenticated citizen → own profile write
- Boundary Violated: ownerActorId is derived from URL route param (:id), not from the authenticated session. Any authenticated user can manipulate friend ranks for any actor by navigating to /profile/{victimActorId}/friends/ranks.
- Contract Violated: VCSM CLAUDE.md — "Ownership is verified through actor_owners only"; identity must never come from URL params for write operations
- Current behavior: TopFriendsRankEditor.jsx line 19-20: const { id } = useParams(); const ownerActorId = id — ownerActorId is passed directly from URL param to saveTopFriendRanksController, which calls save_friend_ranks RPC with p_owner_actor_id = ownerActorId
- Risk: Any authenticated citizen can navigate to /profile/{victimActorId}/friends/ranks and overwrite another user's top friends list. The save_friend_ranks RPC receives an arbitrary ownerActorId.
- Severity: HIGH
- Exploitability: HIGH
- Attack Preconditions: Authenticated session. Knowledge of target actor UUID or slug-to-UUID resolution.
- Blast Radius: Any user's friend rank list can be overwritten. Social graph data integrity compromised. Potential harassment vector (force-rank arbitrary actors into someone's top friends).
- Identity Leak Type: Client-controlled identity injection
- Cache Trust Type: None
- RLS Dependency: ASSUMED — if save_friend_ranks RPC uses auth.uid() to scope its write, this finding is mitigated at DB; if not, it is fully exploitable
- Why it matters: Friend ranks are a social identity feature — manipulating another user's top friends list is a privacy and harassment vector. This is a classic broken object-level authorization (BOLA/IDOR) pattern.
- Recommended mitigation: (1) Derive ownerActorId from the session identity (e.g., useIdentity().actorId) not from URL params; (2) Add an explicit ownership check in saveTopFriendRanksController comparing ownerActorId to session actorId; (3) Verify save_friend_ranks RPC enforces auth.uid() ownership at DB level.
- Rationale: Write operations must never use URL-supplied identity as the authorization subject. Session-derived identity is the only trusted source.
- Follow-up command: DB (confirm whether save_friend_ranks RPC enforces auth.uid() = owner's user_id), SPIDER-MAN (regression test for cross-actor write)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Software Development Security
```

---

### VEN-PROFILES-003 — menu_categories DELETE: No Ownership Filter at DAL Layer

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-003
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js:13
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport schema — menu_categories)
- Trust Boundary: Vport owner → own menu category
- Boundary Violated: DAL executes DELETE with only .eq("id", categoryId) — no actor_id or profile_id ownership filter at the database query level
- Contract Violated: Defense-in-depth principle — ownership must be enforced at every layer (controller + DAL); DAL must not issue unbounded deletes
- Current behavior: deleteVportActorMenuCategoryDAL({ categoryId }) deletes any row matching categoryId with no scope filter. Ownership check exists only in deleteVportActorMenuCategoryController (assertActorOwnsVportActorController), but the DAL itself is callable without the controller.
- Risk: If the controller is ever bypassed (test harness, future refactor, direct DAL import), any authenticated session can delete any menu category across all vports by knowing only a categoryId.
- Severity: HIGH
- Exploitability: MEDIUM (requires controller bypass; currently protected at controller layer)
- Attack Preconditions: Authenticated session, categoryId (UUID). Controller bypass or future direct DAL use.
- Blast Radius: Complete erasure of any vport's menu categories across the platform.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — if vport schema has RLS on menu_categories enforcing profile ownership, this is partially mitigated; unverified
- Why it matters: Menu categories represent business data. Unauthorized deletion directly damages vport operators' businesses. The pattern where a DAL has no ownership scope is an architectural fragility.
- Recommended mitigation: Add .eq("profile_id", profileId) to the DELETE filter in deleteVportActorMenuCategoryDAL — require profileId as a mandatory parameter; remove it from the signature if profile resolution is done at controller layer and passed down.
- Rationale: DAL must be safe to call in isolation. Ownership at DAL layer is defense-in-depth.
- Follow-up command: DB (verify RLS policy on vport.menu_categories), ELEKTRA (patch proposal)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-PROFILES-004 — menu_items DELETE: No Ownership Filter at DAL Layer

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-004
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js:13
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport schema — menu_items)
- Trust Boundary: Vport owner → own menu item
- Boundary Violated: DAL executes DELETE with only .eq("id", itemId) — no actor_id or profile_id ownership filter at the database query level
- Contract Violated: Defense-in-depth principle — same pattern as VEN-PROFILES-003
- Current behavior: deleteVportActorMenuItemDAL({ itemId }) deletes any row matching itemId with no scope filter. Ownership check exists only in deleteVportActorMenuItemController.
- Risk: Controller bypass allows deletion of any menu item across all vports.
- Severity: HIGH
- Exploitability: MEDIUM (requires controller bypass; currently protected at controller layer)
- Attack Preconditions: Authenticated session, itemId (UUID). Controller bypass.
- Blast Radius: Menu item erasure across any vport.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: Same business damage vector as VEN-PROFILES-003. Menu items with prices and media are core business data.
- Recommended mitigation: Add .eq("profile_id", profileId) filter to deleteVportActorMenuItemDAL — make profileId a required parameter.
- Rationale: Defense-in-depth; DAL must never issue unscoped deletes.
- Follow-up command: DB (verify RLS on vport.menu_items), ELEKTRA (patch proposal)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-PROFILES-005 — locksmith_portfolio_details UPSERT: No Actor Ownership Filter at DAL Layer

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-005
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js:18-23
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport schema — locksmith_portfolio_details)
- Trust Boundary: Locksmith vport owner → own portfolio detail
- Boundary Violated: DAL upserts a locksmith portfolio detail row using only portfolio_item_id as the conflict key. No actor_id or profile_id is injected or filtered in the WHERE clause. The row itself may contain an actor_id field if the caller provides it, but the DAL does not enforce this.
- Contract Violated: Defense-in-depth; VCSM ownership model requires actor_owners verification before any write
- Current behavior: dalUpsertLocksmithPortfolioDetail(row) — the function validates only that portfolio_item_id is present in the row. No actor_id field presence is checked. The entire row is passed as-is to the upsert call; any fields in the row are written without scope restriction.
- Risk: A caller who can supply an arbitrary portfolio_item_id (which belongs to another locksmith vport) and knowledge of that ID can overwrite that vport's portfolio detail record. Additionally, arbitrary row fields (including potentially actor_id itself) could be injected.
- Severity: HIGH
- Exploitability: MEDIUM (requires knowledge of portfolio_item_id belonging to victim; controller enforces ownership via assertActorOwnsVportActorController before calling this DAL)
- Attack Preconditions: Controller bypass or direct DAL import; knowledge of victim's portfolio_item_id
- Blast Radius: Locksmith portfolio data corruption for any vport. SEO and trust-signal data manipulated.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED — unverified whether locksmith_portfolio_details has RLS; if RLS enforces actor ownership, risk is partially mitigated
- Why it matters: Portfolio details include job types, credentials markers, and emergency service flags that affect platform trust signals for locksmith businesses.
- Recommended mitigation: Require and inject actor_id into the upsert row; add .eq("actor_id", actorId) to the upsert's onConflict scope or a WHERE clause; validate actor_id is present in the row before executing.
- Rationale: Without an actor_id scope, the DAL trusts entirely that the conflict key (portfolio_item_id) belongs to the caller. This is insufficient for a defense-in-depth posture.
- Follow-up command: DB (verify RLS on locksmith_portfolio_details), ELEKTRA (patch proposal)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-PROFILES-006 — menu_item_media INSERT: itemId Not Verified as Owned by Actor

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-006
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/menu/createVportMenuItemMedia.dal.js:10-33
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport schema — menu_item_media)
- Trust Boundary: Vport owner → media attached to own menu items
- Boundary Violated: The DAL resolves profileId from actorId correctly, but itemId is passed in directly without verification that menu_items.profile_id = profileId. A caller can link media to a menu item belonging to a different vport.
- Contract Violated: Ownership validation must cover all referenced entities, not just the primary actor
- Current behavior: createVportMenuItemMediaDAL({ actorId, itemId, url, ... }) resolves profileId from actorId, then inserts into menu_item_media with profile_id = profileId but item_id = itemId (untrusted). The category and menu item lookup does not verify that the menu item belongs to this profile.
- Risk: A vport owner can attach media (images/urls) to menu items belonging to a different vport, if they know the target itemId. This is a cross-actor data injection.
- Severity: MEDIUM
- Exploitability: LOW (requires knowledge of victim's itemId UUID; media records are owned by the attacker's profile_id which limits direct damage)
- Attack Preconditions: Authenticated vport owner session. Knowledge of another vport's menu item UUID.
- Blast Radius: Spurious media records attached to other vports' menu items. Could cause display corruption in those vports' menus.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: Cross-vport data injection, even if low-harm, violates the isolation guarantee between business operators.
- Recommended mitigation: Before inserting, verify that the target itemId belongs to the resolved profileId: add a pre-flight SELECT to confirm menu_items.profile_id = profileId for the given itemId.
- Rationale: All referenced foreign keys (not just the actor itself) must be ownership-verified before write operations.
- Follow-up command: ELEKTRA (patch proposal for DAL pre-flight check)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-PROFILES-007 — Subscriber List Exposure: No Auth Guard at DAL Layer (Read Privacy Relies Entirely on Controller)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-007
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/subscribersList.dal.js:3-16
- Application Scope: VCSM
- Platform Surface: Supabase RPC (vc schema — list_vport_subscribers)
- Trust Boundary: Authenticated or public viewer → subscriber list visibility
- Boundary Violated: The DAL function dalListVportSubscribers has no visibility/permission check. Privacy enforcement (dalCanViewActorSignal) exists only in getSubscribersController. The DAL is directly callable from any import site without the privacy gate.
- Contract Violated: Sensitive list data must not be directly accessible without a privacy check at the DAL or the data source level
- Current behavior: dalListVportSubscribers({ actorId, limit, offset }) calls list_vport_subscribers RPC with no caller verification. getSubscribersController wraps it with dalCanViewActorSignal checks, but the DAL itself is a naked RPC call.
- Risk: Direct DAL import bypasses the privacy visibility gate. Subscriber lists (PII — who follows a business) are exposed to any code that imports the DAL.
- Severity: MEDIUM
- Exploitability: MEDIUM (requires direct import or bypassing the controller)
- Attack Preconditions: Code that imports dalListVportSubscribers directly instead of using getSubscribersController.
- Blast Radius: PII exposure — subscriber lists reveal which users follow a particular vport. Depending on RPC security definer mode, may expose data cross-actor.
- Identity Leak Type: Social graph / follower identity leak
- Cache Trust Type: None
- RLS Dependency: ASSUMED — if list_vport_subscribers has SECURITY DEFINER and/or proper authz checks, risk is reduced; unverified
- Why it matters: Subscriber/follower lists are privacy-sensitive. A privacy setting of "private follower list" should be enforced at every call path, not just through one controller entry point.
- Recommended mitigation: (1) Confirm list_vport_subscribers RPC enforces auth context at DB layer (SECURITY INVOKER or RLS); (2) Consider moving privacy gate check into the DAL or enforcing via a wrapper that cannot be imported separately; (3) Document which code paths are approved to bypass the controller.
- Rationale: Privacy gates must not be bypassable by import path selection.
- Follow-up command: DB (audit list_vport_subscribers RPC — SECURITY DEFINER vs INVOKER, RLS applicability)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Identity and Access Management
  - Secondary: Privacy Protection
```

---

### VEN-PROFILES-008 — locksmith_service_details UPSERT: actor_id Not in DB Filter (Relies on onConflict Key Only)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-008
- Location: apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js:17-27
- Application Scope: VCSM
- Platform Surface: Supabase Table/View (vport schema — locksmith_service_details)
- Trust Boundary: Locksmith vport owner → own service detail
- Boundary Violated: The upsert uses service_id as the sole onConflict key. actor_id is included in the row payload but is not included in the onConflict columns or in a WHERE/filter clause. This means a row can be upserted for any service_id regardless of actor ownership if the caller controls the row object.
- Contract Violated: Ownership must be enforced at DB filter level, not only through the row payload value
- Current behavior: dalUpsertLocksmithServiceDetail(row) validates that row.service_id and row.actor_id are present, but the actual upsert uses .upsert(row, { onConflict: 'service_id' }) — the conflict resolution is by service_id alone. If an attacker knows a service_id belonging to a different locksmith vport, they can overwrite its detail record by providing that service_id with their own actor_id.
- Risk: Cross-actor overwrite of service details (pricing, requirements, emergency flags) for another locksmith vport if service_id is guessable or enumerable.
- Severity: MEDIUM
- Exploitability: LOW (requires knowledge of victim's service_id; controller enforces ownership via assertActorOwnsVportActorController)
- Attack Preconditions: Controller bypass or direct DAL import; knowledge of victim's service_id
- Blast Radius: Corruption of locksmith service detail records — pricing model, emergency flags, ID verification requirements.
- Identity Leak Type: None
- Cache Trust Type: None
- RLS Dependency: ASSUMED
- Why it matters: Locksmith service details include sensitive professional data — ID requirements, pricing, emergency coverage. Unauthorized modification damages business integrity.
- Recommended mitigation: Add actor_id to the onConflict composite key (onConflict: 'service_id,actor_id') or add a .eq("actor_id", row.actor_id) filter to scope the upsert.
- Rationale: The conflict key determines what row gets updated. If it does not include an ownership field, a cross-actor overwrite is possible.
- Follow-up command: DB (check locksmith_service_details unique constraint definition), ELEKTRA (patch proposal)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Identity and Access Management
```

---

### VEN-PROFILES-009 — console.error in Production Path (locksmith provisioning in upsertVportServices)

```
VENOM SECURITY FINDING
- Finding ID: VEN-PROFILES-009
- Location: apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js:118-125
- Application Scope: VCSM
- Platform Surface: PWA
- Trust Boundary: Internal — log visibility
- Boundary Violated: console.error is used inside an import.meta.env.DEV guard, which is correct. However, the error payload logged includes actorId, serviceId, serviceKey, and error.message. If this guard ever evaluates to true in a non-dev environment (e.g., staging with DEV=true), internal identifiers are logged to browser console.
- Contract Violated: VCSM debug logging rules — no console.log/error; debug output must render on screen and be dev-only (never production)
- Current behavior: In DEV mode, console.error('[locksmith] detail provision failed', { actorId, serviceId, serviceKey, error }) is called when locksmith service detail provisioning fails for an enabled service row.
- Risk: Internal actorId and serviceId identifiers leak into browser console logs. Low risk in strict DEV-only mode; medium risk if staging/preview misidentifies environment.
- Severity: LOW
- Exploitability: LOW
- Attack Preconditions: DEV environment or misconfigured staging environment
- Blast Radius: Internal identifier exposure in browser console (actorId, serviceId)
- Identity Leak Type: Internal actor ID exposure
- Cache Trust Type: None
- RLS Dependency: NONE
- Why it matters: Project memory states that all debug output must render on screen (not console) and must be truly dev-only. This console.error deviates from the pattern.
- Recommended mitigation: Remove the console.error; use structured provisioningWarnings (already returned) for observability. If debug logging is needed, use the platform debugger pattern at zNOTFORPRODUCTION/debuggers/.
- Rationale: Consistent enforcement of no-console-log rule.
- Follow-up command: SPIDER-MAN (verify removal does not break test coverage of provisioning error path)
- Provenance: SOURCE_VERIFIED
- CISSP Domain:
  - Primary: Software Development Security
  - Secondary: Security Operations
```

---

## 8. Source Verification Summary

| Finding ID | Source File | Line(s) | Verified |
|---|---|---|---|
| VEN-PROFILES-001 | ZZnotforproduction/APPS/VCSM/features/profiles/BEHAVIOR.md | 1-9 | YES — stub with Status: PLACEHOLDER |
| VEN-PROFILES-002 | apps/VCSM/src/features/profiles/screens/views/tabs/friends/components/TopFriendsRankEditor.jsx | 19-20 | YES — `const { id } = useParams(); const ownerActorId = id` |
| VEN-PROFILES-003 | apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js | 13 | YES — `.eq("id", categoryId)` only |
| VEN-PROFILES-004 | apps/VCSM/src/features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js | 13 | YES — `.eq("id", itemId)` only |
| VEN-PROFILES-005 | apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js | 14-24 | YES — no actor_id in filter |
| VEN-PROFILES-006 | apps/VCSM/src/features/profiles/kinds/vport/dal/menu/createVportMenuItemMedia.dal.js | 10-33 | YES — itemId unverified against profileId |
| VEN-PROFILES-007 | apps/VCSM/src/features/profiles/kinds/vport/dal/subscribersList.dal.js | 3-16 | YES — naked RPC call |
| VEN-PROFILES-008 | apps/VCSM/src/features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js | 17-27 | YES — onConflict: 'service_id' only |
| VEN-PROFILES-009 | apps/VCSM/src/features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js | 118-125 | YES — console.error in DEV guard |

### Surfaces Confirmed VERIFIED_SAFE

| Surface | File | Enforcement |
|---|---|---|
| content_pages CREATE/DELETE/UPDATE | All 4 DAL files | Double filter (.eq actor_id) + assertActorOwnsVportActorController in controller |
| locksmith service areas (all ops) | locksmithServiceAreas.write.dal.js | .eq("actor_id", actorId) filter + controller ownership gate |
| locksmith service details DELETE | locksmithServiceDetails.write.dal.js | .eq("actor_id", actorId) filter + controller ownership gate |
| menu categories/items CREATE | createVportActorMenuCategory/MenuItem.dal.js | resolveVportProfileId(actorId) injection + controller gate |
| rates UPSERT | upsertVportRate.dal.js | resolveVportProfileId(actorId) injection + onConflict composite key + controller gate |
| service_addons DELETE | deleteVportServiceAddon.dal.js | .eq("profile_id", profileId) via resolveVportProfileId + controller gate |
| services UPSERT | upsertVportServicesByActor.dal.js | resolveVportProfileId injection + catalog key validation + controller gate |
| subscriber count/list | subscribersCount/List.dal.js | Privacy gate in getSubscribersController (dalCanViewActorSignal) |

---

## 9. Confidence Summary

| Finding ID | Severity | Provenance | Confidence |
|---|---|---|---|
| VEN-PROFILES-001 | HIGH | SOURCE_VERIFIED | HIGH — file read directly |
| VEN-PROFILES-002 | HIGH | SOURCE_VERIFIED | HIGH — line 19-20 confirmed |
| VEN-PROFILES-003 | HIGH | SOURCE_VERIFIED | HIGH — DAL body confirmed |
| VEN-PROFILES-004 | HIGH | SOURCE_VERIFIED | HIGH — DAL body confirmed |
| VEN-PROFILES-005 | HIGH | SOURCE_VERIFIED | HIGH — DAL body confirmed |
| VEN-PROFILES-006 | MEDIUM | SOURCE_VERIFIED | HIGH — DAL body confirmed |
| VEN-PROFILES-007 | MEDIUM | SOURCE_VERIFIED | MEDIUM — RPC DB-level enforcement unverified (DB audit needed) |
| VEN-PROFILES-008 | MEDIUM | SOURCE_VERIFIED | HIGH — onConflict key confirmed |
| VEN-PROFILES-009 | LOW | SOURCE_VERIFIED | HIGH — console.error line confirmed |

**Overall Review Confidence: HIGH** — 9 of 9 findings are SOURCE_VERIFIED with direct file reads.

---

## 10. THOR Impact

| Finding ID | Severity | THOR Blocker | Justification |
|---|---|---|---|
| VEN-PROFILES-002 | HIGH | YES | Broken object-level authorization on friend rank writes — URL param identity injection. Active IDOR against social graph writes. Must be closed before release. |
| VEN-PROFILES-003 | HIGH | YES | Menu category DELETE has no ownership filter at DAL layer — defense-in-depth gap. High blast radius (cross-vport deletion). |
| VEN-PROFILES-004 | HIGH | YES | Menu item DELETE same pattern as VEN-PROFILES-003. |
| VEN-PROFILES-005 | HIGH | YES | Locksmith portfolio UPSERT — no actor scope in DB filter. Requires DB audit + DAL patch. |
| VEN-PROFILES-001 | HIGH | YES | Missing behavior contract blocks all future security verification for this feature. |
| VEN-PROFILES-006 | MEDIUM | NO | itemId cross-vport injection — low exploitability, limited damage. Author BEHAVIOR.md and fix in follow-up. |
| VEN-PROFILES-007 | MEDIUM | NO | Subscriber list privacy — requires DB audit to confirm RPC enforcement. Not a THOR blocker pending DB confirmation. |
| VEN-PROFILES-008 | MEDIUM | NO | Locksmith service details onConflict scope — limited exploitability, requires controller bypass. Fix in follow-up. |
| VEN-PROFILES-009 | LOW | NO | Console.error in DEV guard — code quality issue, not a security blocker. |

**THOR Release Blocker: YES — VEN-PROFILES-002 (IDOR on friend rank writes)**

---

## 11. Required Follow-Up Commands

| Priority | Command | Scope | Reason |
|---|---|---|---|
| P0 | DB | save_friend_ranks RPC — verify auth.uid() enforcement | If RPC is not auth-scoped, VEN-PROFILES-002 is fully exploitable in production now |
| P0 | DB | list_vport_subscribers RPC — SECURITY DEFINER vs INVOKER | VEN-PROFILES-007 severity depends on RPC auth model |
| P0 | ELEKTRA | Patch proposals for VEN-PROFILES-002, 003, 004, 005 | Concrete source-level fixes needed before THOR can clear this feature |
| P1 | DB | Audit RLS on: menu_categories, menu_items, locksmith_portfolio_details, locksmith_service_details | VEN-PROFILES-003/004/005/008 severity depends on whether RLS provides a compensating control |
| P1 | SPIDER-MAN | Regression tests: cross-actor friend rank write, cross-vport menu delete | Ensure fixes for 002/003/004 are regression-covered |
| P2 | ELEKTRA | Patch proposals for VEN-PROFILES-006, 007, 008 | Medium-severity follow-up fixes |
| P3 | SPIDER-MAN | Verify console.error removal does not break provisioning error path | VEN-PROFILES-009 |

---

## 12. Mitigation Plan Table

| Finding ID | Severity | File | Recommended Fix | Owner Layer | Estimated Effort |
|---|---|---|---|---|---|
| VEN-PROFILES-001 | HIGH | BEHAVIOR.md | Author full behavior contract with §5 Security Rules and §9 Must Never Happen | Feature governance | Medium |
| VEN-PROFILES-002 | HIGH | TopFriendsRankEditor.jsx + saveTopFriendRanksController | Derive ownerActorId from session identity; add ownership assertion in controller | Screen + Controller | Small |
| VEN-PROFILES-003 | HIGH | deleteVportActorMenuCategory.dal.js | Add .eq("profile_id", profileId) filter; require profileId as mandatory param | DAL | Small |
| VEN-PROFILES-004 | HIGH | deleteVportActorMenuItem.dal.js | Add .eq("profile_id", profileId) filter; require profileId as mandatory param | DAL | Small |
| VEN-PROFILES-005 | HIGH | locksmithPortfolioDetails.write.dal.js | Require actor_id in row; validate actor_id presence; add actor_id to onConflict composite if schema supports | DAL | Small-Medium |
| VEN-PROFILES-006 | MEDIUM | createVportMenuItemMedia.dal.js | Add pre-flight SELECT to verify menu_items.profile_id = profileId for itemId | DAL | Small |
| VEN-PROFILES-007 | MEDIUM | subscribersList.dal.js | DB audit first; if needed, add wrapper that enforces privacy check or document approved bypass paths | DAL + DB | Small |
| VEN-PROFILES-008 | MEDIUM | locksmithServiceDetails.write.dal.js | Add actor_id to onConflict composite key or add .eq filter | DAL + DB migration | Small-Medium |
| VEN-PROFILES-009 | LOW | upsertVportServices.controller.js | Remove console.error; rely on provisioningWarnings return value | Controller | Trivial |

---

## 13. CISSP Domain Coverage Summary

| CISSP Domain | Findings Covered | Finding IDs |
|---|---|---|
| Identity and Access Management | 5 | VEN-PROFILES-002, VEN-PROFILES-003, VEN-PROFILES-004, VEN-PROFILES-005, VEN-PROFILES-007 |
| Software Development Security | 7 | VEN-PROFILES-001, VEN-PROFILES-003, VEN-PROFILES-004, VEN-PROFILES-005, VEN-PROFILES-006, VEN-PROFILES-008, VEN-PROFILES-009 |
| Security and Risk Management | 1 | VEN-PROFILES-001 |
| Privacy Protection | 1 | VEN-PROFILES-007 |
| Security Operations | 1 | VEN-PROFILES-009 |

**Domains NOT covered by findings (no surface identified):**
- Asset Security (no data classification issues found)
- Security Architecture and Engineering (no structural violations beyond DAL depth findings)
- Communication and Network Security (no edge/network surface)
- Security Assessment and Testing (addressed by SPIDER-MAN follow-up)

---

*VENOM V2 Review Complete — profiles — 2026-06-04*
*9 findings: 0 CRITICAL, 5 HIGH, 3 MEDIUM, 1 LOW*
*THOR Release Blocker: YES — VEN-PROFILES-002*
