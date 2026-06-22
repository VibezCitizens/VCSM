# Governance: BLACKWIDOW — Ethical Red Team

**Command:** `/BlackWidow`  
**Authority:** Adversarial runtime verification — attacks the system from an attacker's perspective  
**Mode:** Read-only adversarial simulation + findings output  
**Scope in VPORT governance:** All modules post-VENOM, pre-THOR

---

## Responsibility

BLACKWIDOW is the ethical red team. After VENOM identifies trust boundary vulnerabilities, BLACKWIDOW attempts to exploit them to verify whether the defenses actually hold under adversarial conditions.

It covers:
- Ownership bypass attempts — can a non-owner actor reach owner-only paths?
- Session spoofing — what happens if a client submits a fake `actorId`?
- Rate and input abuse — does a write path break under malformed or out-of-range input?
- QR and link tampering — can a public link be modified to access private data?
- Cross-kind data access — can an EXCHANGE actor reach a GAS actor's private data?
- Realtime channel abuse — can a subscriber listen to channels they don't own?
- Auth token manipulation — what happens with an expired or invalid session token?

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Confirmed exploit — attack succeeds, data exposed or mutated | Blocks release immediately |
| HIGH | Attack vector confirmed, defense is fragile or bypassable | Blocks release |
| MEDIUM | Partial defense — attack is constrained but not fully blocked | Must address before THOR |
| LOW | Defense holds, but pattern is brittle — document for future hardening | Track, non-blocking |

## Relationship to VENOM and ELEKTRA

- VENOM identifies the trust boundaries
- BLACKWIDOW attacks them to verify they hold
- ELEKTRA traces specific source→sink chains for targeted vulnerability classes

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_blackwidow_[module].md`

## When to Run

After VENOM completes. Before THOR on any module that handles auth, ownership, booking, payments, or public API exposure.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` — BLACKWIDOW findings feed into the VENOM column.
