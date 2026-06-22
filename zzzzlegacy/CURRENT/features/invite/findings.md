# Invite — Findings Log

**Status:** No findings — no audit has run.

Findings will be recorded here after VENOM.

---

## Pre-Audit Security Questions (for VENOM)

1. Are invite tokens single-use? Is consumption enforced at the DAL level with an atomic UPDATE?
2. Can an invite be accepted by a different actor than the intended recipient?
3. Is invite issuance gated on VPORT ownership (only the VPORT owner can issue invites)?
4. Is there an invite token enumeration risk (predictable IDs or no expiry)?
5. Is the invite link safe to share publicly (no sensitive data embedded in URL)?
6. Does the DAL enforce invite expiry without trusting client-supplied timestamps?
7. What happens if an invite is accepted twice (replay attack)?
