# NATIVE_SYNC_COMMAND

This command defines the standard process for syncing PWA changes to native iOS tracker docs and implementation.

---

## When to Run

Run this command when:
- PWA code was changed and native transfer docs need updating.
- A native implementation batch is being planned.
- A daily sync check is needed against the current PWA git diff.

---

## Architecture Contract Gate

Before any native code work, read:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

Apply these rules to all native work:

- Actor-based identity only: `actorId` and `kind`.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- DAL must use explicit selects. Never use `.select('*')`.
- Screens must respect role boundaries — no business logic in screens, no DB access in hooks.
- Fail closed on safety, RLS, and moderation checks.

---

## Step 1 — Detect PWA Git Diff

Run a git diff on the PWA source to identify changed files:

```
git -C /Users/vcsm/Desktop/VCSM diff HEAD~1 -- apps/VCSM/src/
```

Or for a specific range:

```
git -C /Users/vcsm/Desktop/VCSM diff <base>..<head> -- apps/VCSM/src/
```

Focus on changes to:
- `apps/VCSM/src/features/*/dal/` — schema changes
- `apps/VCSM/src/features/*/controller/` — business rule changes
- `apps/VCSM/src/features/*/hooks/` — behavior changes
- `apps/VCSM/src/app/routes/` — route changes
- `apps/VCSM/src/features/*/screens/` — screen/UI changes
- Supabase schema files (if tracked in repo) — RLS/table changes

---

## Step 2 — Map Diffs to Native-Transfer Modules

Open the modular transfer index:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
```

For each changed PWA file, identify the affected module(s) from the parity table.

Use this mapping:
- `features/auth/*` → `modules/auth.md`
- `features/feed/*` → `modules/feed.md`
- `features/post/*` → `modules/post-card.md`, `modules/post-detail.md`
- `features/identity/*` → `modules/identity.md`
- `features/settings/*` → `modules/settings.md`
- `features/moderation/*` → `modules/moderation.md`
- `features/booking/*` → `modules/booking.md`
- `features/notifications/*` → `modules/notifications.md`
- `features/explore/*` → `modules/explore-search.md`
- `features/social/*` → `modules/social-follow.md`
- `features/profiles/*` → `modules/public-vport-profile.md`, `modules/public-menu.md`, `modules/reviews.md`
- `features/dashboard/*` → `modules/dashboard-routes.md`
- `features/chat/*` → `modules/chat-inbox.md`
- `features/wanders/*` → `modules/wanders.md`
- Supabase `vc.*` changes → `modules/schema-vc.md`
- Supabase `vport.*` changes → `modules/schema-vport.md`
- Supabase `reviews.*` changes → `modules/schema-reviews.md`
- Supabase `platform.*` changes → `modules/schema-platform.md`
- Auth/RLS changes → `modules/rls-authenticated-access.md`

---

## Step 3 — Update Module Transfer Logs First

Before touching any native code, open each affected module file and fill in the PWA → Native Transfer Log:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/<module>.md
```

Fill in:
- Date
- Change type
- PWA files changed
- Routes affected
- Screens/components changed
- Services/DAL changed
- Behavior change
- Supabase schema/RPC change
- RLS expectations changed
- Affected native modules
- Priority: P0 / P1 / P2
- Native status
- Testing notes
- Notes

**Do not start native implementation until all affected module files are updated.**

---

## Step 4 — Classify Priority

For each affected module, assign priority:

| Priority | Criteria |
|---|---|
| P0 | Security, RLS, auth, fail-open risk, schema mismatch, data exposure |
| P1 | Product parity, missing screens, wrong behavior, incomplete routes |
| P2 | Polish, optional parity, non-critical UX improvements |

---

## Step 5 — Plan Native Changes

For each P0 module:

1. List exact native files to modify (with file paths).
2. List Supabase tables/RPCs that will be touched.
3. List what must NOT be changed.
4. Note any schema or RLS alignment requirements.

Do not list file changes for P1/P2 unless explicitly instructed to implement them.

---

## Step 6 — Implement P0 Only

Implement only P0 modules unless instructed otherwise.

Rules during implementation:
- No file restructuring.
- No rewriting working code.
- No enabling feature gates without explicit approval.
- No legacy schema paths.
- No `vc.booking_*` — use `vport.*`.
- No `vc.user_blocks` — use `moderation.block_actor` / `moderation.unblock_actor`.
- No `moderation.blocks.id` reads — `moderation.blocks` uses actor/domain composite identity fields.
- No `vc.actor_presentation` — use `identity.actor_directory` / `identity.search_actor_directory`.
- No `vc.notifications` — use `notification.inbox_full_view`, `notification.recipients`, and `notification.inbox_items`.
- No `vc.reports` / `vc.report_events` — use `moderation.*` RPCs.
- No direct `vc.vports` deletes — use canonical RPC path.

---

## Step 7 — Verify

After implementation:
- Run native build if possible.
- Run focused tests if available.
- Record pass/fail, errors, warnings.
- Note any untested areas.

---

## Step 8 — Update Module Files and Index

After verification:

1. Update each affected module file:
   - Native Transfer Status
   - Native Gaps
   - Transfer History (update date)

2. Update `ROADTRIP_INDEX.md` parity table only if module status changed:
   ```
   /Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md
   ```

3. Update `NATIVE_COMMAND_CENTER.md` summary tables:
   ```
   /Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_COMMAND_CENTER.md
   ```

---

## Do Not Touch Without Approval

- Native feature folder restructuring
- Enabling `NativeFeatureGate.wandersEnabled`
- Broad rewrites of booking, chat, dashboard, profile, public menu
- PWA source code (source of truth — do not modify)
- `NativeAppRoute.swift` cases without route audit
- `SupabaseClient.swift` outside of scoped method changes
