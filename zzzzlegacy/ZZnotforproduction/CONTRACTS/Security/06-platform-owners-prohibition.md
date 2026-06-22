# Platform Owners Prohibition
## Contract Rule — FORBID_PLATFORM_OWNERS_USAGE (Locked)

> **Source:** [../FORBID_PLATFORM_OWNERS_USAGE.md](../FORBID_PLATFORM_OWNERS_USAGE.md)
> **Status:** ACTIVE
> **Index:** [INDEX.md](INDEX.md)
> **Cross-Links:** [03-database-data.md](03-database-data.md) (both govern database access restrictions), [System/04-actor-core-rule.md](../System/04-actor-core-rule.md) (actor identity must not use platform_owners)

---

**Rule Name:** FORBID_PLATFORM_OWNERS_USAGE
**Status:** ACTIVE
**Scope:** apps/VCSM, apps/wentrex, all app-owned resolvers and adapters

---

## Rule

The table `platform.platform_owners` must never be used by Wentrex or VCSM in any app-domain logic, identity resolution flow, actor hydration flow, actor switching flow, booking flow, feed flow, profile flow, onboarding flow, access derivation flow, UI visibility rule, or feature authorization path.

---

## Forbidden Table

- `platform.platform_owners`

This table is reserved strictly for platform-level governance and internal platform administration only.

---

## Must NOT Be Used By

- `apps/wentrex/**`
- `apps/VCSM/**`
- app-owned resolvers
- app controllers
- app DAL files
- app hooks
- app adapters
- app services
- app context providers
- app route guards
- app feature flags
- app UI logic
- app identity engines/resolvers
- app booking/customer/business logic

---

## Allowed Use

`platform.platform_owners` may only be used in explicitly platform-governance-only code, such as:

- platform super-admin tooling
- platform governance audits
- internal platform owner management flows
- platform-only maintenance scripts

---

## Not an Input To

- actor identity
- actor hydration
- actor directory projection
- actor switching
- app access
- app role selection
- citizen vs vport logic
- owner/business authorization inside VCSM
- student/parent/org authorization inside Wentrex
- booking permissions
- feature gating in app code

---

## Required Alternatives

When app logic needs authorization or identity decisions, use only the appropriate domain/app tables:

- `platform.user_app_access`
- `platform.user_app_accounts`
- `platform.user_app_actor_links`
- `platform.user_app_preferences`
- `platform.user_app_state`
- app/domain actor tables like `vc.actors`
- app/domain membership/access tables owned by the app
- app/domain ownership tables owned by the app

---

## Explicit Prohibition

Do not join to, read from, infer from, or branch on `platform.platform_owners` anywhere in Wentrex or VCSM feature code.

### Examples of Forbidden Behavior

- "If user exists in platform.platform_owners, allow feature"
- "If user is a platform owner, bypass app identity checks"
- "Use platform.platform_owners to resolve actor access"
- "Use platform.platform_owners in booking/admin/business rules"
- "Use platform.platform_owners in Wentrex learning access"
- "Use platform.platform_owners in VCSM vport/citizen logic"

---

## Enforcement

Any new code in Wentrex or VCSM that references `platform.platform_owners` is a contract violation and must be rejected in review.

---

## Review Check

Search for any of the following in app code and reject if found:

```
platform.platform_owners
.from("platform_owners")
.from('platform_owners')
```

Also reject joins or subqueries against `platform.platform_owners`.

---

## Final Principle

`platform.platform_owners` is platform governance only.
It is never a source of truth for Wentrex or VCSM application behavior.
