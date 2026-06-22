# Security Contracts — Index

> **Concern:** What security rules govern the system
> **Source contracts (canonical, untouched):** 2 files at CONTRACTS/ root
> **Library files:** 6 derived files in this folder

---

## Source Contracts

| Source | Lines | Core Concern |
|---|---|---|
| [SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md) | 404 | Comprehensive security rules for all layers |
| [FORBID_PLATFORM_OWNERS_USAGE.md](../FORBID_PLATFORM_OWNERS_USAGE.md) | 123 | Single-rule prohibition: platform_owners table forbidden in app domain |

---

## Library Files — Reading Order

### Security Engineering (SECURITY_ENGINEERING_CONTRACT.md)

| # | File | Sections Covered |
|---|---|---|
| 01 | [01-core-principles.md](01-core-principles.md) | Security Philosophy, Least Privilege, Trust Boundaries, Server Authority, Defense in Depth |
| 02 | [02-auth-authorization.md](02-auth-authorization.md) | Authentication Security, Authorization Security |
| 03 | [03-database-data.md](03-database-data.md) | Database Security, Data Protection |
| 04 | [04-input-api-secrets.md](04-input-api-secrets.md) | Input Validation, API Security, Secrets Management |
| 05 | [05-logging-code-review.md](05-logging-code-review.md) | Logging, Messaging Security, File Upload, Third-Party, Infrastructure, Code Security, Review Requirements, Incident Preparedness, Workflow, Prohibitions, Command, Standard |

### Platform Owners Prohibition (FORBID_PLATFORM_OWNERS_USAGE.md)

| # | File | Sections Covered |
|---|---|---|
| 06 | [06-platform-owners-prohibition.md](06-platform-owners-prohibition.md) | Core Rule, Forbidden Table, Forbidden Consumers, Allowed Use, Required Alternatives, Enforcement, Review Check |

---

## Machine Reading Index

| Enforcement Point | Source Contract | Library File |
|---|---|---|
| Every component: minimum permissions only | SECURITY_ENGINEERING | [01-core-principles.md](01-core-principles.md) |
| Never grant wildcard policies or global service keys in frontend | SECURITY_ENGINEERING | [01-core-principles.md](01-core-principles.md) |
| Trust boundaries: validate everything from client | SECURITY_ENGINEERING | [01-core-principles.md](01-core-principles.md) |
| Server enforces all rules; frontend is UX only | SECURITY_ENGINEERING | [01-core-principles.md](01-core-principles.md) |
| Defense in depth: security at every layer | SECURITY_ENGINEERING | [01-core-principles.md](01-core-principles.md) |
| Never expose service keys or admin tokens | SECURITY_ENGINEERING | [02-auth-authorization.md](02-auth-authorization.md) |
| Roles verified in backend; no client-side auth | SECURITY_ENGINEERING | [02-auth-authorization.md](02-auth-authorization.md) |
| RLS required on all user-facing tables | SECURITY_ENGINEERING | [02-auth-authorization.md](02-auth-authorization.md) |
| RLS on all sensitive tables; no direct access | SECURITY_ENGINEERING | [03-database-data.md](03-database-data.md) |
| Never store passwords, tokens, secrets in plaintext | SECURITY_ENGINEERING | [03-database-data.md](03-database-data.md) |
| Validate all: body, params, files, message content | SECURITY_ENGINEERING | [04-input-api-secrets.md](04-input-api-secrets.md) |
| Protect against SQL injection, XSS, path traversal | SECURITY_ENGINEERING | [04-input-api-secrets.md](04-input-api-secrets.md) |
| Rate limits required on sensitive endpoints | SECURITY_ENGINEERING | [04-input-api-secrets.md](04-input-api-secrets.md) |
| No secrets hardcoded; use env vars / secret managers | SECURITY_ENGINEERING | [04-input-api-secrets.md](04-input-api-secrets.md) |
| Log all security-sensitive actions | SECURITY_ENGINEERING | [05-logging-code-review.md](05-logging-code-review.md) |
| Logs must not expose passwords, tokens, secrets | SECURITY_ENGINEERING | [05-logging-code-review.md](05-logging-code-review.md) |
| Validate MIME type and extension on file uploads | SECURITY_ENGINEERING | [05-logging-code-review.md](05-logging-code-review.md) |
| Remove debug routes and test endpoints before production | SECURITY_ENGINEERING | [05-logging-code-review.md](05-logging-code-review.md) |
| Review for auth bypass, privilege escalation before merge | SECURITY_ENGINEERING | [05-logging-code-review.md](05-logging-code-review.md) |
| platform.platform_owners forbidden in all app domain logic | FORBID_PLATFORM_OWNERS | [06-platform-owners-prohibition.md](06-platform-owners-prohibition.md) |
| Required alternative: platform.user_app_access for role checks | FORBID_PLATFORM_OWNERS | [06-platform-owners-prohibition.md](06-platform-owners-prohibition.md) |
| Review check: grep for platform_owners in app code | FORBID_PLATFORM_OWNERS | [06-platform-owners-prohibition.md](06-platform-owners-prohibition.md) |

---

## Cross-Link Graph

```
01-core-principles.md  ↔  02-auth-authorization.md
  (defense in depth principles apply to auth layer)

02-auth-authorization.md  ↔  System/04-actor-core-rule.md
  (authorization and actor identity model are related)

02-auth-authorization.md  ↔  Architecture/33-auth-authz-separation.md
  (security rules for auth/authz + structural separation at code layer are complementary)

03-database-data.md  ↔  06-platform-owners-prohibition.md
  (both govern database access restrictions)

04-input-api-secrets.md  ↔  05-logging-code-review.md
  (validation at entry → audit at exit)
```

---

## Related Architectural Contract

The [AUTH_AUTHZ_SEPARATION_CONTRACT](../AUTH_AUTHZ_SEPARATION_CONTRACT.md) (§33) governs structural separation at the code layer — auth and authorization must never be mixed in the same feature, controller, DAL, hook, or screen. It complements this security contract, which governs session security, password handling, and RLS enforcement. Both apply simultaneously.
