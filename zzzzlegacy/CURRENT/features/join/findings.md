# Join — Findings Log

**Status:** No findings — no audit has run.

Findings will be recorded here after VENOM.

---

## Pre-Audit Security Questions (for VENOM)

1. Can a barber join a VPORT they are not authorized for without owner approval?
2. Is the QR join token (resource UUID) replay-protected at the DAL level?
3. Does `joinInvite.dal.js` enforce ownership before accepting a resource slot?
4. Is the QR preview path correctly isolated from the accept path (no auth leakage)?
5. Can the invite token be accepted by a different actor than intended?
6. Is there expiry enforcement at the DAL level (not just UI)?
7. Is there a race condition between invite issuance and acceptance?
8. Does `acceptJoinResourceDAL` use an atomic UPDATE with guard conditions?
