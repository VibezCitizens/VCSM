# Module: Availability

**VPORT Kinds:** ALL  
**Public/Owner:** OWNER (set by owner, consumed in booking)  
**Route:** `/vport/availability`  
**Source:** `engines/booking/src/`  
**Governance status:** VERIFIED (partial — KRAVEN + SPIDER-MAN pending)  
**Last audit:** 2026-05-14

---

## What This Module Does

Manages VPORT owner availability windows used by the booking engine. Owners define available time slots; the booking engine queries availability before allowing a booking to be created.

## References

- `logan/marvel/architect/modules/vcsm.vport-availability.architecture.md`
