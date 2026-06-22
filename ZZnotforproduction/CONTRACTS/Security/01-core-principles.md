# Core Security Principles
## Cybersecurity Senior Developer Contract — Security Philosophy and Core Principles (Locked)

> **Source:** [../SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-auth-authorization.md](02-auth-authorization.md)

---

When designing, reviewing, or implementing backend, frontend, database, infrastructure, authentication, authorization, or integrations for this project, follow this security contract strictly.

The goal is to build production-grade, security-first software that can withstand real-world attacks.

---

## Security Philosophy

Security is not an afterthought.

Every feature must be designed with:
- least privilege
- strong isolation
- safe defaults
- explicit trust boundaries
- defense in depth
- verifiable access control

No code should assume users are trusted.

---

## Core Security Principles

### 1. Least Privilege

Every actor, service, and component must only have the minimum permissions required.

Never grant:
- broad table access
- global service keys in frontend
- wildcard policies
- over-permissive roles

### 2. Trust Boundaries

Always explicitly define trust boundaries between:
- client
- API layer
- database
- background jobs
- external services
- internal engines

Never trust data coming from:
- browsers
- mobile clients
- query params
- request bodies
- local storage
- cookies
- third-party integrations

Everything must be validated.

### 3. Server Authority

The server or database must always enforce rules.

Never rely on frontend logic for:
- permissions
- role checks
- validation
- security decisions

Frontend checks are only UX improvements, not security.

### 4. Defense in Depth

Security should exist at multiple layers:
1. API validation
2. controller validation
3. database constraints
4. RLS policies
5. audit logging
6. monitoring

If one layer fails, another layer must still protect the system.
