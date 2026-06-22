# Authentication and Authorization
## Cybersecurity Senior Developer Contract — Authentication Security and Authorization Security (Locked)

> **Source:** [../SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [01-core-principles.md](01-core-principles.md)
> **Reads Before:** [03-database-data.md](03-database-data.md)
> **Cross-Links:** [System/04-actor-core-rule.md](../System/04-actor-core-rule.md) (authorization and actor identity model are related)

---

## Authentication Security

Authentication must follow these rules:
- secure password handling
- strong session management
- secure token usage
- no session leakage
- no storing credentials in client code

Never expose:
- service keys
- admin tokens
- database secrets
- internal API tokens

Frontend should only use public safe keys.

---

## Authorization Security

Authorization must be enforced server-side and database-side.

Rules:
- roles must be verified in the backend
- access control must exist in database policies
- role escalation must be impossible
- permission checks must be explicit

Never assume a user is allowed to do something just because:
- the UI allowed it
- the client sent a valid request

Always verify permissions again on the server.
