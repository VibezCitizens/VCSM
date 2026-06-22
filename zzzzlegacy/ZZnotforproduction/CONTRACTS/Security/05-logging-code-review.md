# Logging, Code Security, and Review Standards
## Cybersecurity Senior Developer Contract — Logging, Messaging Security, File Upload, Third-Party, Infrastructure, Code Security, Review Requirements, Incident Preparedness, Workflow, Prohibitions, Command, Expected Standard (Locked)

> **Source:** [../SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-input-api-secrets.md](04-input-api-secrets.md)
> **Cross-Links:** [Agent/08-observability-release.md](../Agent/08-observability-release.md) (both govern logging standards)

---

## Logging and Auditing

Security-sensitive actions must be logged.

Examples include:
- login attempts
- password changes
- permission changes
- moderation actions
- account provisioning
- identity resolution
- data deletion
- role changes

Logs must not expose:
- passwords
- tokens
- secrets

---

## Messaging and Realtime Security

For chat, messaging, or realtime systems:
- users must only access conversations they belong to
- message visibility must be enforced in the database
- inbox access must be actor-scoped
- moderation permissions must be explicit
- attachments must be validated

Never allow actors to access messages outside their membership.

---

## File Upload Security

Uploaded files must be protected against:
- malicious scripts
- executable files
- oversized uploads
- MIME spoofing
- path traversal

Best practices:
- validate MIME type
- validate file extension
- scan files if necessary
- store files outside direct execution paths

---

## Third-Party Integration Security

External integrations must be treated as untrusted.

Protect against:
- webhook spoofing
- API abuse
- token leakage
- unexpected payloads

Validate:
- signatures
- payload structure
- source authenticity

---

## Infrastructure Security

Deployment environments must enforce:
- HTTPS
- environment separation (dev/staging/prod)
- secure key management
- restricted service access
- minimal public exposure

---

## Code Security

Secure coding standards must include:
- no unsafe eval
- no raw SQL concatenation
- parameterized queries
- strict input typing
- safe error handling
- no debug logs in production

Remove:
- console logs exposing sensitive data
- debug routes
- test endpoints

before production.

---

## Security Review Requirements

Before merging major features, review for:
- authentication bypass risk
- authorization flaws
- insecure direct object references
- privilege escalation
- injection vulnerabilities
- missing RLS policies
- exposed secrets

Security must be reviewed with the same seriousness as functionality.

---

## Incident Preparedness

Systems must be designed so that:
- suspicious activity can be detected
- logs allow investigation
- compromised accounts can be isolated
- access can be revoked quickly

---

## Expected Workflow for Secure Development

When implementing features:
1. identify trust boundaries
2. define authentication requirements
3. define authorization rules
4. validate inputs
5. enforce database security
6. implement logging
7. review for privilege escalation risks
8. ensure secrets are protected

Security is part of the design process, not a final step.

---

## What Must Never Happen

Never allow:
- client-side role enforcement
- open database tables without RLS
- service keys in frontend code
- secrets in source code
- unrestricted file uploads
- insecure password storage
- raw user input directly into queries
- unauthenticated access to sensitive data

These are considered critical security failures.

---

## Command Behavior

When the user asks to:
- review security
- audit authentication
- check access control
- review database policies
- secure an API
- secure a feature
- design authentication
- design authorization

apply this contract automatically.

Security decisions must favor safety over convenience.

---

## Expected Security Standard

The codebase must be capable of supporting:
- production SaaS workloads
- real user data
- multi-tenant systems
- secure messaging
- protected identities

The expectation is senior-level security engineering, not basic protection.
