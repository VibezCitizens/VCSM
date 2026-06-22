# Feature Runtime Index

## Purpose

This layer maps source reality for fast DR. STRANGE lookup. It answers what exists in the actual codebase — not what governance documents say should exist.

The FEATURE_INDEX layer (one directory up) answers: what documentation exists and what is missing.
This FEATURE_INDEX_RUNTIME layer answers: what source code exists, what write/mutation surfaces exist, what routes are public vs protected, what upload/media surfaces exist, and what security-sensitive surfaces have been identified.

Use this layer when:
- DR. STRANGE needs to know what a feature's actual runtime surface looks like
- A security audit command (VENOM, ELEKTRA, BLACKWIDOW) needs to identify source files to scan
- IRONMAN needs to map ownership to real controller/DAL paths
- SPIDER-MAN needs to know what controllers and DALs have zero test coverage
- CARNAGE needs to know what write paths interact with the DB

Generated: 2026-06-02
Scope: VCSM only — apps/VCSM/src/features/
Excluded: wentrex, Traffic, engines (not scanned)

---

## Feature Runtime Table

| Feature | Runtime Index | Controllers | DALs | Hooks | Screens | Routes | Write Surface | Public Surface | Upload Surface | Highest Risk | Recommended Command |
|---|---|---:|---:|---:|---:|---:|---|---|---|---|---|
| actors | [actors.md](actors.md) | 2 | 2 | 0 | 0 | 0 | NO | NO | NO | MEDIUM | ARCHITECT |
| auth | [auth.md](auth.md) | 14 | 11 | 9 | 9 | 1 | YES | NO | NO | CRITICAL | CARNAGE |
| block | [block.md](block.md) | 3 | 3 | 5 | 0 | 0 | YES | NO | NO | HIGH | CARNAGE |
| booking | [booking.md](booking.md) | 15 | 22 | 16 | 0 | 1 | YES | NO | NO | CRITICAL | SPIDER-MAN |
| chat | [chat.md](chat.md) | 2 | 3 | 24 | 11 | 1 | YES | NO | YES | HIGH | VENOM |
| dashboard | [dashboard.md](dashboard.md) | 32 | 42 | 27 | 14 | 6 | YES | NO | YES | HIGH | SENTRY |
| feed | [feed.md](feed.md) | 4 | 16 | 9 | 3 | 1 | YES | NO | NO | HIGH | CARNAGE |
| identity | [identity.md](identity.md) | 2 | 2 | 1 | 0 | 0 | YES | NO | NO | CRITICAL | VENOM |
| invite | [invite.md](invite.md) | 1 | 1 | 1 | 3 | 1 | YES | YES | NO | CRITICAL | VENOM |
| join | [join.md](join.md) | 3 | 3 | 1 | 5 | 1 | YES | YES | NO | CRITICAL | VENOM |
| legal | [legal.md](legal.md) | 2 | 4 | 3 | 11 | 4 | YES | YES | NO | HIGH | ELEKTRA |
| media | [media.md](media.md) | 2 | 3 | 0 | 0 | 0 | YES | NO | YES | MEDIUM | CARNAGE |
| moderation | [moderation.md](moderation.md) | 7 | 9 | 10 | 0 | 0 | YES | NO | NO | CRITICAL | CARNAGE |
| notifications | [notifications.md](notifications.md) | 3 | 3 | 5 | 5 | 1 | YES | NO | NO | MEDIUM | CARNAGE |
| onboarding | [onboarding.md](onboarding.md) | 3 | 4 | 2 | 2 | 1 | YES | NO | NO | MEDIUM | IRONMAN |
| portfolio | [portfolio.md](portfolio.md) | 0 | 0 | 0 | 0 | 0 | NO | NO | YES | HIGH | IRONMAN |
| post | [post.md](post.md) | 13 | 18 | 17 | 7 | 1 | YES | NO | NO | HIGH | CARNAGE |
| profiles | [profiles.md](profiles.md) | 56 | 77 | 70 | 158 | 3 | YES | NO | YES | HIGH | BLACKWIDOW |
| public | [public.md](public.md) | 6 | 11 | 9 | 9 | 5 | YES | YES | NO | HIGH | VENOM |
| settings | [settings.md](settings.md) | 15 | 21 | 17 | 1 | 2 | YES | NO | NO | HIGH | SENTRY |
| social | [social.md](social.md) | 10 | 7 | 19 | 0 | 0 | YES | NO | NO | MEDIUM | VENOM |
| upload | [upload.md](upload.md) | 3 | 8 | 4 | 2 | 1 | YES | NO | YES | HIGH | VENOM |
| vgrid | [vgrid.md](vgrid.md) | 0 | 0 | 0 | 0 | 0 | NO | NO | NO | UNKNOWN | IRONMAN |
| vport | [vport.md](vport.md) | 3 | 4 | 4 | 1 | 2 | YES | YES | YES | CRITICAL | ARCHITECT |

---

## Critical Runtime Gaps

| Feature | Gap | Severity | Next Command |
|---|---|---|---|
| moderation | assertModerationAccessController ALWAYS THROWS FORBIDDEN — moderator actions broken in production | CRITICAL | CARNAGE |
| identity | platform.provision_vcsm_identity has NO auth.uid() guard — cross-user identity poisoning possible. Migration ready, deployment UNKNOWN | CRITICAL | VENOM |
| join | PUBLIC route /join/barbershop/:token has two controller create paths with no ownership assertion (ELEK-024/025) | CRITICAL | VENOM |
| public | Both sub-modules released to production with ZERO security audit coverage (vportMenu + vportBusinessCard) | CRITICAL | VENOM |
| upload | Cloudflare R2 worker has wildcard CORS, no JWT verification — any origin writes to post-media R2 bucket | CRITICAL | VENOM |
| booking | customer_actor_id injection confirmed on live DB — TICKET-BOOKING-RPC-001 DB-BLOCKED | CRITICAL | SPIDER-MAN |
| vport | S-BLK-001: 3 locksmith write paths have no ownership gate — BEFORE RELEASE BLOCKER | CRITICAL | ARCHITECT |
| invite | Standalone /invite module NEVER audited — released to production with zero coverage | HIGH | VENOM |
| onboarding | ALL governance files missing (0/10); write paths to onboarding_steps have no confirmed RLS WITH CHECK | HIGH | IRONMAN |
| portfolio | ALL governance files missing (0/10); ctrlSavePortfolioDetail missing ownership gate (ELEK-040) | HIGH | IRONMAN |
| vgrid | Skeleton-only feature in BOTH features/ and frozen/ — governance state ambiguous | MEDIUM | IRONMAN |
| chat | SECURITY.md missing for HIGH-tier real-time messaging engine | MEDIUM | VENOM |
| auth | 3 P0 findings (booking source bypass, dev diagnostics, client-controlled fields) open with no dedicated ticket | HIGH | CARNAGE |
| post | DR-001 CRITICAL: vc.posts INSERT RLS gap — migration endorsed but staging PENDING | CRITICAL | CARNAGE |

---

## DR. STRANGE Lookup Flow

For any feature query, follow this 3-read sequence:

### Step 1
Read `CURRENT/FEATURE_DOCUMENTATION_INDEX.md`

This is the master index. It tells you:
- CURRENT folder path for the feature
- DR. STRANGE read order
- Documentation coverage score (which governance files exist vs are missing)
- Latest ticket IDs
- Quick Lookup Layer pointer → FEATURE_INDEX/[feature].md

### Step 2
Read `CURRENT/FEATURE_INDEX/[feature].md`

This is the governance synthesis layer. It tells you:
- Pre-synthesized status from CURRENT evidence
- Active risks extracted from CURRENT_STATUS, SECURITY, BLOCKERS
- Open blockers (explicit)
- Deferred items (explicit)
- Audit coverage across all commands
- Recommended next command and next ticket

### Step 3
Read `CURRENT/FEATURE_INDEX_RUNTIME/[feature].md`

This is the source reality layer. It tells you:
- Actual source file counts per layer
- Route/screen map with auth classification (PUBLIC/AUTH/OWNER)
- Mutation surface map with ownership gate status
- Upload/media surfaces
- Security-sensitive surfaces with evidence
- Runtime risk summary

### Step 4 (only if deeper evidence needed)
Read specific files from `CURRENT/features/[feature]/` as needed:
- `CURRENT_STATUS.md` — current ticket state and known blockers
- `SECURITY.md` — full findings register
- `ARCHITECTURE.md` — layer contracts and boundary rules
- `BLOCKERS.md` / `DEFERRED.md` — if they exist (dashboard only has both)

This 3-read flow gives DR. STRANGE full operational context before touching a single source file.
