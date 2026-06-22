# Database and Data Protection
## Cybersecurity Senior Developer Contract — Database Security and Data Protection (Locked)

> **Source:** [../SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-auth-authorization.md](02-auth-authorization.md)
> **Reads Before:** [04-input-api-secrets.md](04-input-api-secrets.md)
> **Cross-Links:** [06-platform-owners-prohibition.md](06-platform-owners-prohibition.md) (both govern database access restrictions)

---

## Database Security

The database must enforce security.

Mandatory protections include:
- Row Level Security (RLS)
- foreign key constraints
- input validation
- proper indexing for audit and access checks
- restricted schemas

Never allow direct access to sensitive tables without RLS.

Sensitive areas include:
- user identities
- messaging data
- access roles
- internal state
- audit logs
- tokens or secrets

---

## Data Protection

Sensitive data must be protected both:
- at rest
- in transit

Best practices:
- use HTTPS everywhere
- avoid storing sensitive data in plaintext
- encrypt where appropriate
- minimize data retention

Never store:
- passwords
- access tokens
- private keys
- secrets

in logs or client-visible storage.
