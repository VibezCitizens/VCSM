# Media Feature — Ownership

**Source:** `2026-05-19_13-00_ironman_media-feature-ownership.md`
**Canonical ownership file:** `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.media.owner.md`

---

## Ownership Clarity

```
Ownership Clarity: CLEAR
Evidence: Single feature directory, single controller, single write path, all layers present.
  Adapter boundary enforced (RISK-1 resolved). No cross-root violations. 7 files, 349 lines total.
Confidence: HIGH
```

---

## Responsibility Classification

| Responsibility Type | Owner | Confidence | Notes |
|---|---|---|---|
| Feature ownership | VCSM media feature | HIGH | `apps/VCSM/src/features/media/` |
| Engine ownership | `engines/media` (shared) | HIGH | Sealed engine; VCSM media feature is consumer/configurator |
| DAL ownership | VCSM media feature | HIGH | Both DAL files owned entirely by this feature |
| Controller ownership | VCSM media feature | HIGH | `createMediaAssetController` is the canonical write path |
| UI ownership | NONE — intentional | HIGH | Feature owns no hooks, components, or screens |
| Runtime ownership | VCSM media feature (write) | HIGH | All 10 consumer flows route through this controller |
| Data ownership | VCSM media feature | HIGH | Owns `platform.media_assets` schema + RLS policies |
| Contract ownership | VCSM Architecture Contract | HIGH | Adapter boundary rule; cross-feature access rules |
| Documentation ownership | VCSM media feature | HIGH | `vcsm.dal.media.md` — governed by this feature |
| Security ownership | DB RLS (owner-scoped) | HIGH | INSERT WITH CHECK via `vc.actor_owners` |
| Migration ownership | VCSM media feature | HIGH | 3 migration files in `supabase/migrations/` |
| Native parity ownership | N/A | HIGH | DAL layer — no native surface |

---

## Ownership Boundary Risks

| Area | Risk | Status |
|---|---|---|
| `resolveVcsmAppId` cross-feature use | LOW | Adapter boundary enforced — all 9 external callers use adapter. RESOLVED. |
| `createMediaAssetController` caller trust | LOW | DB RLS enforces `owner_actor_id` ownership; controller-layer gap is defense-in-depth | Optional: add `requireOwnerActorAccess` (Carnage Plan B follow-up) |
| Engine / feature separation | LOW | Feature configures engine in `setup.js` only; no internal engine imports | NONE |
| SCOPE_MAP governance | MEDIUM | No documented approver for new scope entries | OPEN |
| Soft-delete capability blocked | MEDIUM | Schema supports soft-delete but DB layer blocks UPDATE for owners | OPEN — Carnage Plan B |

---

## Data Ownership Registry

| Object | Primary Owner | Read Consumers | Write Owner | RLS Owner | Migration Owner | Docs Owner |
|---|---|---|---|---|---|---|
| `platform.media_assets` | VCSM media feature | All features with media (chat, upload, vport, dashboard, wanders, profiles) via SELECT policy | VCSM media feature (via `createMediaAssetController`) | VCSM media feature | VCSM media feature | VCSM media feature (`vcsm.dal.media.md`) |
| `platform.apps` | Platform (service) | VCSM media feature (`resolveVcsmAppIdDAL`) — read-only, cached | N/A — read only from this feature | Not applicable | N/A | VCSM media feature (`vcsm.dal.media.md`) |

---

## Rule Ownership Registry

| Rule | Owner | Enforcement Layer | Risk |
|---|---|---|---|
| All platform media writes go through `createMediaAssetController` | VCSM media feature | Adapter boundary | LOW |
| `owner_actor_id` must belong to `auth.uid()` | DB RLS | Database — `vc.actor_owners` join | MITIGATED |
| `scope` must be a valid SCOPE_MAP key | VCSM media feature | Model (`mediaAsset.model.js`) | LOW |
