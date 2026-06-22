# Input Validation, API Security, and Secrets Management
## Cybersecurity Senior Developer Contract — Input Validation, API Security, Secrets Management (Locked)

> **Source:** [../SECURITY_ENGINEERING_CONTRACT.md](../SECURITY_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [03-database-data.md](03-database-data.md)
> **Reads Before:** [05-logging-code-review.md](05-logging-code-review.md)

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
