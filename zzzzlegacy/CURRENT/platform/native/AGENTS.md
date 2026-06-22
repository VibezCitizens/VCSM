# VCSM Native Transfer System

This folder contains prompts for VCSM Web/PWA → Native iOS sync.

---

## Architecture Contract Gate

Before generating or editing any native code, read:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

---

## Canonical Files

| Purpose | Path |
|---|---|
| Architecture contract | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md` |
| ROADTRIP baseline (consolidated) | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/ROADTRIP.md` |
| Modular transfer index | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/ROADTRIP_INDEX.md` |
| Module tracker files | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/native-transfer/modules/` |
| Native command center | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_COMMAND_CENTER.md` |
| Native sync command | `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_ACTIVE/native/NATIVE_SYNC_COMMAND.md` |

---

## Rules

- Read `ARCHITECTURE.md` before any native code work.
- Read `ROADTRIP_INDEX.md` before any transfer session.
- After PWA changes, update the affected `native-transfer/modules/<module>.md` **before** starting native work.
- "Update ROADTRIP" means:
  - Update the affected `native-transfer/modules/<module>.md` (primary target).
  - Update `ROADTRIP_INDEX.md` **only** if module status, priority, or parity summary changes.
  - Update `ROADTRIP.md` **only** if the monolithic baseline is intentionally being corrected.
- Never modify native code without updating the affected module tracker first.
- Never bypass RLS or moderation RPCs.
- Never use legacy schema paths unless confirmed canonical.
- Never delete, rename, or restructure files without approval.

---

## Architecture Enforcement Rules

Apply to all native code and planning:

- Actor-based identity only: use `actorId` and `kind`.
- Never scope behavior by `profileId`, `vportId`, or raw `userId`.
- Owner means Actor Owner through `actor_owners`.
- Build order: DAL → Model → Controller → Hooks → Components → View Screen → Final Screen.
- Screens must respect role boundaries — no business logic in screens, no DB access in hooks.
- DAL must use explicit column selects. Never use `.select('*')`.
- Cross-feature imports must go through adapters.
- Fail closed on all safety, RLS, and moderation checks.

---

## Prompt Usage

| Prompt | Purpose | When to use |
|---|---|---|
| `prompts/PIPELINE_PROMPT.md` | Full automated PWA → Native pipeline | Full sync session |
| `prompts/MODULE_PROMPT_TEMPLATE.md` | Single module transfer | Daily focused work |
| `prompts/PWA_TO_NATIVE_GENERATOR.md` | Planning only — no native code changes | Assess PWA change impact |
