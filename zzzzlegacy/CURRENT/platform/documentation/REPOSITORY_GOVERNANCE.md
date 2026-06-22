# VCSM Repository Governance

This document defines the governance system for the VCSM repository.

It explains the rules, contracts, and command systems that control how engineering work is performed across the repository.

The purpose of this governance layer is to ensure:

- architectural integrity
- project boundary isolation
- safe debugging practices
- consistent documentation
- predictable development workflows
- long-term maintainability

This document is the entry point for understanding repository rules.

---

# Repository Structure

The repository contains multiple independent application roots and shared system layers.

Protected roots:

- `/Users/vcsm/Desktop/VCSM/apps/VCSM`
- `/Users/vcsm/Desktop/VCSM/apps/wentrex`
- `/Users/vcsm/Desktop/VCSM/apps/Traffic`
- `/Users/vcsm/Desktop/VCSM/engines`

These roots represent separate projects or shared system layers.

Each root has strict modification rules enforced by governance contracts.

---

# Core Governance Contracts

## 1. Project Boundary Isolation Contract

File:

`/Users/vcsm/Desktop/VCSM/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

Purpose:

Enforces strict boundaries between projects.

Key rules:

- work started in one project must remain in that project
- cross-project modification is forbidden by default
- engine changes must be explicitly declared
- Traffic must remain isolated from VCSM and Wentrex
- scope expansion must be explicit and approved

This contract protects the repository from accidental cross-project coupling.

---

# Architecture Contracts

Architecture contracts define the system design rules.

These contracts live in:

`/Users/vcsm/Desktop/VCSM/zcontract`

## ARCHITECTURE

File:

`/Users/vcsm/Desktop/VCSM/zcontract/ARCHITECTURE.md`

Defines:

- system layering model
- module ordering rules
- dependency direction

Example layer flow:

`DAL -> Model -> Controller -> Hooks -> Components -> View Screen -> Final Screen`

## Platform Contract

File:

`/Users/vcsm/Desktop/VCSM/zcontract/platformcontract.md`

Defines:

- platform-level architectural rules
- infrastructure boundaries
- shared system responsibilities

## Engine Contract

File:

`/Users/vcsm/Desktop/VCSM/zcontract/enginecontract.md`

Defines:

- rules for shared engines
- engine isolation requirements
- engine dependency boundaries

Engines must remain reusable system layers.

## Capability Contract

File:

`/Users/vcsm/Desktop/VCSM/zcontract/capabilitycontract.md`

Defines:

- capability boundaries
- how system capabilities interact
- communication rules between modules

## Additional Governance Contracts

- `/Users/vcsm/Desktop/VCSM/zcontract/SENIOR_DEVELOPER_CONTRACT.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/SECURITY_ENGINEERING_CONTRACT.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/REAL_WORLD_ENGINEERING_OPS_CONTRACT.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/STRATEGIC_REALITY_DEBRIEF_CONTRACT.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/SINGLE_SOURCE_ACTOR_ARCHITECTURE.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/FORBID_PLATFORM_OWNERS_USAGE.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/CHAT_MIGRATION_PLAN.md`
- `/Users/vcsm/Desktop/VCSM/zcontract/CLAUDE.md`

---

# Command System

Operational commands are located in:

`/Users/vcsm/Desktop/VCSM/.claude/commands`

All commands must load and obey:

`/Users/vcsm/Desktop/VCSM/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`

If any command-local instruction conflicts with boundary isolation rules, the repository boundary contract wins.

---

# Core Operational Commands

- Wolverine — planning, routing, and execution orchestration
- Logan — documentation discipline and drift control
- BugsBunny — root-cause debugging and safe instrumentation
- DB — read-first database analysis and risk review
- review-contract — architecture and contract compliance checks
- session-summary — session closeout and continuity
- Captain — idea capture and backlog handoff

System observer commands:

- Loki — architecture and runtime drift observer
- Kraven — performance bottleneck hunter
- Venom — security and permission boundary inspector
- Carnage — migration architecture and backward-compat safety
- Ironman — feature architecture ownership guard
- Thor — release readiness and deployment safety checks

---

# Debugging Rules

Debug workflows must follow `BUGSBUNNY.md` and the active contracts.

Core rules:

- root cause analysis before fixes
- temporary dev-only instrumentation
- no production debug leakage
- minimal safe fixes
- verified pipeline tracing

---

# Database Safety Rules

Database analysis must follow `DB.md` and security contracts.

Default posture:

READ-ONLY DATABASE MODE

Allowed:

- schema inspection
- query analysis
- dependency inspection
- index review
- policy inspection

Forbidden without explicit approval:

- schema modification
- data modification
- migrations
- permission changes
- index creation or deletion

---

# Traffic Application

Traffic is a dedicated traffic acquisition application.

Location:

`/Users/vcsm/Desktop/VCSM/apps/Traffic`

Purpose:

- generate programmatic SEO pages
- capture organic search traffic
- route users to the main platform
- operate independently from core applications

Traffic must remain isolated from core app roots unless scope expansion is explicitly approved.

---

# Governance Principle

This repository operates as a multi-project system governed by contracts and command workflows.

Key principles:

- project isolation first
- explicit scope expansion
- architecture contracts govern system design
- governance contracts protect project boundaries
- command systems enforce development discipline

No system rule may be silently bypassed.

All development must respect:

- architecture contracts
- project boundary contracts
- command workflows
- debugging discipline
- database safety rules

Governance exists to protect the system from accidental architectural drift while allowing safe, controlled evolution.
