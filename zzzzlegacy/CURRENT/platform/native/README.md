# VCSM Native Transfer — Modular Tracker

This folder is the modular PWA → Native iOS transfer tracker for the VCSM platform.

---

## Architecture Contract Gate

Before any native transfer work, read:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md
```

---

## Entry Points

| File | Purpose |
|---|---|
| [ROADTRIP_INDEX.md](ROADTRIP_INDEX.md) | Master entry point — canonical paths, contract gate, workflow, priorities, parity table, risk areas, all module links |
| [modules/](modules/) | Per-module transfer tracker files — primary update targets after any PWA or native change |
| [../AGENTS.md](../AGENTS.md) | System rules, canonical file paths, architecture enforcement rules, and prompt usage guide |
| [../prompts/](../prompts/) | Prompt files for full pipeline, single-module, and planning-only workflows |

---

## How This Works

- **ROADTRIP_INDEX.md** is the first file to read before any native transfer session. It contains the architecture contract gate, global rules, the full parity summary, P0/P1/P2 checklists, and links to every module.
- **modules/*.md** are the primary update targets. Each module file owns one feature area and tracks PWA source of truth, native transfer status, gaps, risk notes, and transfer history.
- **AGENTS.md** defines system rules, canonical paths, and which prompts to use.
- **prompts/** contains the actual prompt files to use for transfer sessions.
- The original consolidated tracker lives at `../ROADTRIP.md` and is preserved for history. It is not the active update target.

---

## Workflow

1. Read `ROADTRIP_INDEX.md` at the start of every transfer session.
2. Open the affected module file(s) from `modules/`.
3. After PWA changes, fill in the **PWA → Native Transfer Log** in the affected module before starting native work.
4. After native work, update **Native Transfer Status**, **Native Gaps**, and **Transfer History** in the module file.
5. Update the parity table in `ROADTRIP_INDEX.md` only if a module status, priority, or parity summary changes.

**"Update ROADTRIP" always means:**
- Primary target: `modules/<module>.md`.
- `ROADTRIP_INDEX.md` only if status/priority/parity changes.
- `../ROADTRIP.md` only if the monolithic baseline is intentionally being corrected.

---

## Last-Updated Rule

- Whenever a module file changes, update its **Transfer History** date.
- If a module's status changes (e.g., Partial → Complete), update the parity table in `ROADTRIP_INDEX.md`.

---

## Rules

- Never modify app code from this folder.
- Always update the affected module file after PWA or native work.
- Do not mark a module `Complete` unless route, screen, service/DAL, and schema usage are all verified in current native files.
- Do not enable feature gates (e.g., Wanders) without parity and RLS verification.
- Actor-based identity only: `actorId` and `kind`. Never `profileId`, `vportId`, or raw `userId`.
- Fail closed on safety, RLS, and moderation checks.
