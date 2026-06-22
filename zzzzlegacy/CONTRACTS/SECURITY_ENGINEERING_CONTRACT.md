# Cybersecurity Senior Developer Contract

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

---

## Input Validation

All external inputs must be validated.

Validate:
- request bodies
- query parameters
- path parameters
- uploaded files
- message content
- form inputs

Protect against:
- SQL injection
- XSS
- command injection
- path traversal
- file upload abuse
- malformed JSON

Never trust raw input.

---

## API Security

APIs must follow strict patterns:
- authenticated endpoints must verify identity
- authorization checks must exist for every protected action
- rate limits must exist for sensitive endpoints
- validation must occur before database access

Never expose raw database errors to clients.

Return sanitized error responses.

---

## Secrets Management

Secrets must never be hardcoded.

All secrets must be stored in:
- environment variables
- secret managers
- infrastructure configuration

Never commit secrets to:
- git repositories
- config files
- client code
- documentation

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
