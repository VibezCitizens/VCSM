# Module: Delete Lifecycle (Cross-Kind)

**VPORT Kinds:** ALL  
**Public/Owner:** OWNER (system-triggered)  
**Route:** N/A — system-level flow  
**Source:** TBD — not yet mapped  
**Governance status:** NOT_STARTED (Logan spec exists)  
**Risk:** HIGH — cascading deletion, high blast radius  
**Last audit:** NEVER

---

## What This Module Does

Governs the soft-delete and hard-delete lifecycle for VPORTs and all associated data: posts, reviews, bookings, media, services, followers, and actor records.

## Why This Is High Risk

- Cascading data deletion across multiple tables and engines
- Potential for orphaned records if delete order is wrong
- Irreversible operations — no recovery path without explicit backup
- Actor ownership gate on delete not formally verified by VENOM
- No CARNAGE migration review for the delete cascade order

## Priority

**#2 highest priority next audit** — high blast radius, no security or migration review.

## Next Command

VENOM → CARNAGE (to verify cascade order and RLS policies)

## References

- `logan/vports/vcsm.vport.delete-lifecycle.md` (20KB comprehensive spec)
- `../../../pending-full-audits.md` (entry #2)
