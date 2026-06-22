# Governance: REVIEW-CONTRACT — Architecture Contract Compliance Check

**Command:** `/review-contract`  
**Authority:** Architecture contract compliance verification across the full codebase  
**Mode:** Read-only + compliance report  
**Scope in VPORT governance:** All modules — used when contract compliance is in question

---

## Responsibility

REVIEW-CONTRACT verifies that VPORT dashboard modules comply with the locked architecture contracts defined in `zNOTFORPRODUCTION/_CANONICAL/zcontract/`.

It covers:
- Layer boundary compliance — DAL → Model → Controller → Hook → Component → View → Final ordering
- Identity contract — no `profileId`, `vportId`, or `userId` scoping in public surfaces
- Import rule compliance — `@/...` aliases only, no `../../` chains, no cross-app imports
- File naming conventions — `.dal.js`, `.model.js`, `.controller.js`, `use*.js`, etc.
- File size limits — 300-line hard cap
- Controller fan-out limits — maximum 5 external module dependencies per controller
- Folder depth limits — maximum 3 levels below the feature root
- DAL select hygiene — `select('*')` banned
- Security baseline — ownership verified through `actor_owners`, no raw UUIDs in public surfaces
- Technology constraints — no TypeScript, no tsconfig.json, no CSS-in-JS

## Contract References

| Contract File | What It Governs |
|---|---|
| `ARCHITECTURE.md` | Layer contracts, identity, build order, adapter rules |
| `SECURITY_ENGINEERING_CONTRACT.md` | Auth, database, infrastructure security |
| `SENIOR_DEVELOPER_CONTRACT.md` | Execution quality, truthfulness, claim evidence |
| `ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md` | Claim verification, evidence classification |
| `REAL_WORLD_ENGINEERING_OPS_CONTRACT.md` | Operational engineering standards |

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_review-contract_[module].md`

## When to Run

At session start when contract compliance is unclear. After any agent that may have drifted from the contract. As a pre-THOR gate when SENTRY findings are ambiguous.
