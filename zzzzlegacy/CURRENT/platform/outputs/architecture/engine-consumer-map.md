# VCSM Engine Consumer Map
# ARCHITECT Global Scan — 2026-06-02
# Corrected: Second Pass Verification 2026-06-02
# Correction: 5 of 8 engines underdocumented in initial scan; consumer lists expanded after live grep verification.

Aggregated from engine_deps fields across all 29 feature scan results.
Corrected after second-pass grep verification — live import counts authoritative.

---

## Engines Referenced Across Platform

| Engine | Alias | Consuming Features | Consumer Count |
|---|---|---|---|
| engines/booking | @booking | booking, vport, notifications | 3 |
| engines/chat | @chat | chat *(moderation: boundary violation — not a proper consumer)* | 1 proper + 1 violation |
| engines/hydration | @hydration | booking, chat, dashboard, explore, feed, hydration, notifications, post, profiles, settings | 10 |
| engines/identity | (direct import) | identity | 1 |
| engines/media | @media | chat, dashboard/flyerBuilder, media (self), profiles/vport/menu, settings/profile, upload, vport, portfolio, wanders* | 9 (*wanders = FROZEN) |
| engines/notifications | @notifications | notifications | 1 |
| engines/portfolio | @portfolio | dashboard/vport/cards/portfolio, portfolio, profiles/kinds/vport/controller/portfolio | 3 |
| engines/reviews | (direct import) | profiles/kinds/vport/controller/review, reviews | 2 |

---

## Engines in engines/ Root

Engines confirmed present via scan results + second-pass grep:

| Engine Module | Confirmed Via |
|---|---|
| engines/booking | booking, vport, notifications engine_deps |
| engines/chat | chat engine_deps; moderation direct file path (boundary violation — see detail) |
| engines/hydration | booking, chat, dashboard, explore, feed, hydration, notifications, post, profiles, settings imports verified |
| engines/identity | identity engine_deps |
| engines/media | chat, dashboard/flyerBuilder, media, profiles/vport/menu, settings, upload, vport, portfolio, wanders imports verified |
| engines/notifications | notifications engine_deps |
| engines/portfolio | dashboard/vport/cards/portfolio, portfolio, profiles/kinds/vport/controller/portfolio imports verified |
| engines/reviews | profiles/kinds/vport/controller/review, reviews imports verified |

**Total Distinct Engines: 8**

---

## Engine Dependency Detail

### engines/booking (@booking)

| Consumer | Usage |
|---|---|
| booking | Core booking engine — assertActorOwnsVportActor, booking state machine, scheduling |
| vport | createOrganizationLocationWorkspace — workspace provisioning on VPORT creation |
| notifications | @booking alias — appointment notification publishing |

Risk: Dual assertActorOwnsVportActor implementations at feature layer AND engine layer (IRON-BOOK-WARN3 OPEN).
assertActorOwnsVportActorController lives in booking feature adapter — consumed by vport, settings, profiles, dashboard, and join (~45 non-test consumer files) for ownership gates.
Cross-feature ownership dependency is a platform-wide structural coupling. Route to IRONMAN.

---

### engines/chat (@chat)

| Consumer | Type | Usage |
|---|---|---|
| chat | PROPER | Core chat engine — conversation permissions, inbox, membership |
| moderation | BOUNDARY VIOLATION | markConversationSpam.controller.js and moderationActions.write.dal.js consumed directly by file path (not via @chat adapter) |

**Boundary violation note:** moderation consumes engine files by direct internal path rather than the published @chat adapter surface. This is a SENTRY finding, not a proper consumer relationship. Consumer count for governance purposes: 1 proper + 1 violation.

---

### engines/hydration (@hydration)

*Initial scan documented 6 consumers. Second-pass grep verified 10.*

| Consumer | Usage |
|---|---|
| booking | Actor identity resolution for booking participants and ownership checks |
| chat | Message sender and recipient actor hydration |
| dashboard | VPORT dashboard actor data hydration across cards |
| explore | Fire-and-forget actor cache warm on discovery |
| feed | Feed pipeline actor batch hydration — SA2 OPEN: @hydration imported directly from DAL layer (layer violation) |
| hydration (feature) | Feature-level wrapper over engines/hydration |
| notifications | Notification recipient actor resolution before dispatch |
| post | Post author hydration on render |
| profiles | Actor hydration across all profile surfaces |
| settings | Profile actor data hydration for settings display |

Risk: feed.posts.dal.js (SA2 OPEN) imports @hydration engine directly from DAL layer — layer violation. Engine consumption should flow through feature adapter or controller, not DAL.
vcsmActorHydrator.js queries vport.profile_actor_access directly without a named DAL function.

---

### engines/identity

| Consumer | Usage |
|---|---|
| identity | Platform identity provisioning RPCs (provision_vcsm_identity, link_vcsm_actor) |

Risk: VF-01 CRITICAL OPEN — platform.provision_vcsm_identity has NO auth.uid() guard in live DB. JS caller provision.rpc.dal.js confirmed: passes caller-supplied p_user_id with no auth.uid() check. Migration 20260518040000 ready but deployment status UNKNOWN. Cross-user identity poisoning is live risk if undeployed.
~111 external consumer sites measured (64 bypass via state/identity/identityContext; 47 use correct adapter path). Bypass is real and quantitatively confirmed. Route to SENTRY.

---

### engines/media (@media)

*Initial scan documented 5 consumers. Second-pass grep verified 9 (+ 1 FROZEN).*

| Consumer | Usage |
|---|---|
| chat | Media upload in chat messages |
| dashboard/flyerBuilder | Flyer image upload and media management in flyerBuilder card |
| media (feature self) | Feature-level adapter wrapper over engines/media |
| profiles/vport/menu | VPORT public menu media asset management |
| settings/profile | Profile avatar and cover media upload surfaces |
| upload | createPostController via api/uploadMedia.js — note: imports @media barrel directly bypassing adapter (GAP OPEN); recordPostMedia.controller.js uses both media.adapter and mediaAppId.adapter |
| vport | VPORT profile media upload |
| portfolio | Portfolio media asset creation and update |
| wanders | *(FROZEN — excluded from active governance; was consuming media engine before freeze)* |

Risk: upload/api/uploadMedia.js imports @media engine barrel directly — adapter bypass (OPEN).
R2 Cloudflare worker wildcard CORS with no JWT verification — CRITICAL (upload feature).

---

### engines/notifications (@notifications)

| Consumer | Usage |
|---|---|
| notifications | Core notification publishing and delivery |

Risk: Serial publish delivery loop O(N × 3 × RTT) — ELEVATED (KRAVEN 2026-05-19).
Publish ACL gap: any caller via notifications.adapter.js can publish to any actorId.

---

### engines/portfolio (@portfolio)

*Initial scan documented 1 consumer. Second-pass grep verified 3.*

| Consumer | Usage |
|---|---|
| dashboard/vport/cards/portfolio | VPORT owner portfolio card — reads and writes portfolio assets via engine |
| portfolio (feature) | Full CRUD portfolio operations via engine; setup.js is single point of failure for ownership enforcement |
| profiles/kinds/vport/controller/portfolio | Public VPORT portfolio rendering — reads portfolio assets |

Risk: setup.js single point of failure for all engine ownership enforcement. Fragmented layout across 3 feature paths.
dashboard and profiles both depend on portfolio engine for reads — documentation gap concealed dual consumer risk.

---

### engines/reviews

*Initial scan documented 1 consumer. Second-pass grep verified 2.*

| Consumer | Usage |
|---|---|
| reviews (feature) | Review read/write operations, VPORT service review binding |
| profiles/kinds/vport/controller/review | Public VPORT profile review display — reads reviews via engine |

Risk: feature source path contains only setup.js — logic distributed across 4 integration sites with no central index.
profiles dependency was undocumented — reviews engine now has a cross-feature read consumer.

---

## Engine Consumption Heat Map

*Consumer counts corrected after second-pass verification.*

| Engine | Proper Consumers | Structural Risk Level | Correction vs Initial |
|---|---|---|---|
| engines/hydration | 10 | MEDIUM — SA2 layer violation in feed; 4 consumers were undocumented | +4 (booking, dashboard, notifications, settings) |
| engines/media | 8 proper + 1 FROZEN | HIGH — R2 CORS critical; adapter bypass in upload; 4 consumers undocumented | +4 (dashboard/flyerBuilder, media-self, profiles/vport/menu, settings/profile) |
| engines/booking | 3 | HIGH — dual implementation drift; cross-feature coupling | No change |
| engines/chat | 1 proper (moderation: violation) | MEDIUM — moderation boundary violation; must not be counted as proper consumer | Correction: moderation reclassified as violation |
| engines/portfolio | 3 | MEDIUM — single-point-of-failure setup.js; 2 consumers undocumented | +2 (dashboard/cards/portfolio, profiles/controller/portfolio) |
| engines/identity | 1 | CRITICAL — VF-01 unguarded RPC; 111 bypass sites confirmed | No change |
| engines/reviews | 2 | LOW — profiles consumer was undocumented | +1 (profiles/kinds/vport/controller/review) |
| engines/notifications | 1 | MEDIUM — ACL gap; serial delivery perf | No change |

---

## Features With No Engine Dependencies

These features operate entirely on direct Supabase DAL calls with no engine layer.

*Corrected: dashboard and settings removed — both confirmed consuming engines/hydration and engines/media respectively.*

| Feature | Tier | Notes |
|---|---|---|
| auth | CRITICAL | Direct Supabase auth + RPC; no engine abstraction |
| actors | CRITICAL | Direct Supabase DAL |
| block | HIGH | Direct Supabase DAL |
| legal | HIGH | Direct Supabase DAL + Edge Function |
| social | MEDIUM | Direct Supabase DAL + RPC |
| invite | MEDIUM | Direct Edge Function |
| join | MEDIUM | Direct Supabase DAL + Edge Function |
| onboarding | MEDIUM | Direct Supabase DAL |
| professional | MEDIUM | Direct Supabase DAL; enterprise surface is mock only |
| ads | LOW | localStorage only — no Supabase at all |
| void | LOW | Scaffold — no DAL or engine connections |

---

ARCHITECT Run: 2026-06-02
Second Pass Verification: 2026-06-02
Features scanned: 29
Engines catalogued: 8
Corrections applied: engines/chat (1), engines/hydration (+4), engines/media (+4), engines/portfolio (+2), engines/reviews (+1)
