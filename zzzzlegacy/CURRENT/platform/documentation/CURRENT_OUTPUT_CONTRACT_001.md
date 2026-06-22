# CURRENT-OUTPUT-CONTRACT-001
**Effective:** 2026-06-02
**Status:** ACTIVE

---

## Rule

All new governance, audit, command, workflow, discovery, and report output files must be created under:

```
/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/outputs/YYYY/MM/DD/[command-name]/NNN_[ticket-id]_[short-title].md
```

`/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION` root is **LEGACY** — no new output files are created there directly.

---

## Path Schema

```
CURRENT/
  outputs/
    2026/
      06/
        02/
          WOLVERINE/
            001_TICKET-0001_auth-security-pass.md
            INDEX.md
          VENOM/
            001_TICKET-0002_feed-trust-boundary.md
            INDEX.md
```

---

## Rules

1. Never create new output files directly under `zNOTFORPRODUCTION/` root
2. Never create new output files under `_ACTIVE`, `_CANONICAL`, `_HISTORY`, or `HISTORY` unless explicitly requested
3. Use `CURRENT/outputs/` as the default output home
4. Group by `YYYY/MM/DD`
5. Group by command name (WOLVERINE, VENOM, ELEKTRA, BLACKWIDOW, SPIDER-MAN, etc.)
6. Number files sequentially starting at `001` per command per day
7. Create or update `INDEX.md` inside each command/day folder
8. `INDEX.md` must list: file number, ticket ID, filename, scope, status, timestamp
9. Existing legacy files stay where they are unless a relocation ticket is approved
10. Do not touch app source code

---

## INDEX.md Format

```markdown
# [command-name] Outputs — YYYY-MM-DD

| # | Ticket | File | Scope | Status | Timestamp |
|---|---|---|---|---|---|
| 001 | TICKET-0001 | 001_TICKET-0001_auth-security-pass.md | auth | COMPLETE | 2026-06-02T03:00:00 |
```

---

## Exceptions (explicit request required)

- Writing to `_ACTIVE` or `_CANONICAL`
- Writing to `HISTORY` or `_HISTORY`
- Writing directly to `zNOTFORPRODUCTION/` root
- Relocating legacy output files

---

## Supersedes

This contract supersedes the prior convention of writing outputs to `zNOTFORPRODUCTION/` root or `_ACTIVE/` directly.
