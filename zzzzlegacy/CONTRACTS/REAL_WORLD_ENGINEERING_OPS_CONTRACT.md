# Real-World Engineering Operations Contract

This contract defines the operational discipline required to run a real software product in production.

Engineering decisions must consider not only code correctness but also real-world usage, operations, product constraints, and long-term maintainability.

This contract supplements:
- Senior Developer Execution Contract
- Cybersecurity Engineering Contract
- UI/UX Premium Contract
- Strategic Debrief Contract
- Anti-Hallucination Engineering Contract

The goal is to align the project with the practices used by high-quality real engineering teams.

---

## 1. Product Decision Contract

Engineering must not build features in isolation from real product needs.

Before implementing a feature, the following questions must be answered:
1. What user problem does this solve?
2. Who specifically needs this capability?
3. What happens if this feature is not built?
4. What is the smallest possible version that solves the problem?
5. How will success be measured?

Avoid:
- solving theoretical problems
- building infrastructure without real demand
- overengineering early features
- expanding scope unnecessarily

Engineering effort must remain aligned with real user value.

---

## 2. Operational Reality Contract

Software must survive real operational conditions.

Systems must assume:
- users will make mistakes
- administrators will misconfigure things
- data will sometimes be incomplete
- roles and permissions will change over time
- organizations will evolve

Examples of operational realities:
- administrators assigning incorrect roles
- duplicated accounts
- users losing access
- organizations merging records
- messages sent accidentally
- configuration errors

The system must include mechanisms for:
- correcting mistakes
- auditing actions
- restoring data
- diagnosing access problems

Engineering must design with operational recovery in mind, not just ideal usage.

---

## 3. Observability Contract

The system must provide visibility into its behavior.

Without observability, it is impossible to diagnose production problems.

The system must support:

### Logging

Logs should capture:
- authentication events
- authorization failures
- critical system operations
- messaging activity
- moderation actions
- provisioning events

Logs must never expose:
- passwords
- tokens
- secrets

### Metrics

Metrics should track:
- request rates
- error rates
- latency
- queue backlogs
- messaging throughput

### Tracing

Tracing should allow engineers to follow a request path through the system.

Example flow:
```
UI → API → Controller → Service → DAL → Database
```

### Alerting

The system should notify engineers when:
- error rates spike
- services become unavailable
- database performance degrades
- messaging fails

Observability ensures the system is operationally visible, not opaque.

---

## 4. Release Discipline Contract

Production systems require controlled deployment processes.

Changes must be released in a safe and predictable way.

Key rules:
- database migrations must be reversible
- schema changes must maintain backward compatibility when possible
- high-risk changes should be introduced gradually
- large changes should be broken into stages
- critical features should support feature flags when appropriate

Avoid:
- simultaneous architecture changes and feature changes
- large unreviewed migrations
- untested production deployments

Release discipline protects system stability.

---

## 5. Developer Experience Contract

The codebase must remain maintainable as the team grows.

Engineering decisions must consider the developer experience.

Questions to evaluate:
- Can a new developer understand the architecture quickly?
- Are patterns consistent across the codebase?
- Is it easy to trace execution paths?
- Are file structures predictable?
- Is documentation aligned with code reality?

Avoid:
- inconsistent patterns
- scattered logic
- hidden runtime ownership
- undocumented architectural rules

Maintain a structure that allows engineers to:
- understand the system quickly
- diagnose problems efficiently
- extend functionality safely

---

## Platform Evolution Awareness

As the system evolves, components may become shared platform capabilities.

Examples within the current architecture include:
- identity engine
- chat engine
- potential LMS engine
- multi-application actor model

Engineering should periodically evaluate whether functionality belongs:
- inside an application
- inside a shared engine
- inside the platform layer

This prevents uncontrolled architectural growth.

---

## Domain Ownership

Clear domain ownership improves system stability.

Each domain should have a logical owner responsible for its architecture.

Examples:
- Identity domain → identity engine
- Messaging domain → chat engine
- Education domain → LMS components

Ownership ensures that architectural decisions remain consistent.

---

## Incident Preparedness

The system must be capable of handling operational incidents.

Examples of incidents include:
- authentication failures
- messaging outages
- corrupted data
- permission errors

The system should support:
- investigation through logs
- isolating problematic accounts
- restoring system state
- revoking compromised access

Operational resilience is essential for production systems.

---

## Engineering Culture Principles

All work must follow these principles:
- Truthfulness
- Transparency
- Operational awareness
- User-centered thinking
- Architectural discipline

Engineering should balance:
- product needs
- operational stability
- architectural integrity
- long-term maintainability

---

## Command Behavior

Apply this contract whenever discussing:
- system operations
- deployment practices
- product strategy
- production readiness
- engineering process improvements
- architecture evolution

The system must consider real-world software operation, not just theoretical engineering design.

---

## Expected Outcome

Following this contract ensures the project evolves into a system that is:
- technically strong
- operationally resilient
- maintainable by teams
- aligned with real user behavior
- capable of long-term growth

The goal is not only to build good code, but to build software that survives the real world.
