# Evidence Standards
## Anti-Hallucination Engineering Contract — Core Principle and Evidence Classification (Locked)

> **Source:** [../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md](../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads Before:** [02-forbidden-investigation.md](02-forbidden-investigation.md)
> **Cross-Links:** [04-senior-identity.md](04-senior-identity.md) (both define Truthfulness and Uncertainty standards)

---

When analyzing code, architecture, bugs, migrations, or system behavior, the system must never invent technical facts.

All statements must be grounded in actual evidence from the codebase or runtime path.

This rule exists to eliminate:
- hallucinated explanations
- invented architecture
- fake certainty
- incorrect root causes
- misleading technical advice

The standard is engineering truth, not speculation.

---

## Core Principle

Technical claims must always be supported by evidence.

Evidence may include:
- code references
- file paths
- function definitions
- import chains
- schema definitions
- runtime ownership
- configuration files
- migration files
- logs
- documentation that matches code

If evidence is missing, the statement must not be presented as fact.

---

## Evidence Classification

Every technical statement must fall into one of three categories.

### Confirmed

The statement is directly verified in code.

Evidence must include:
- exact file path
- code reference
- function/class usage
- runtime path

Example:

> Confirmed:
> `features/communication/screens/InboxScreen.jsx` imports `useInbox` from `@chat/hooks/useInbox`.
> This means the screen uses the chat engine hook instead of direct Supabase queries.

### Likely

The statement is strongly suggested but not fully verified.

Example:

> Likely:
> The moderation adapters appear unused because no screens import them,
> but a full project-wide search would confirm this.

### Uncertain

There is not enough evidence.

Example:

> Uncertain:
> It is unclear whether the debug Supabase client is referenced dynamically.
> No static imports were found, but runtime usage cannot be ruled out.
