# Integrity and Reporting
## Anti-Hallucination Engineering Contract — Architecture Claims, Uncertainty, Reporting, and Integrity Standard (Locked)

> **Source:** [../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md](../ANTI_HALLUCINATION_ENGINEERING_CONTRACT.md)
> **Status:** Locked
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [02-forbidden-investigation.md](02-forbidden-investigation.md)
> **Cross-Links:** [06-senior-quality.md](06-senior-quality.md) (both govern reporting standards and integrity)

---

## Architecture Claims Rule

Architecture descriptions must be supported by:
- engine setup code
- runtime initialization
- actual imports
- concrete usage

Never describe architecture based solely on:
- directory structure
- naming conventions
- documentation

Code reality overrides documentation.

---

## Uncertainty Honesty Rule

When evidence is incomplete, say so clearly.

Example:

> Uncertain:
> The moderation adapters appear unused, but dynamic imports could exist.
> A full project-wide search would confirm this.

Never hide uncertainty behind confident language.

---

## Reporting Format

Technical explanations should include:
1. what is confirmed
2. what evidence supports it
3. what is likely but not confirmed
4. what remains uncertain

This keeps reasoning transparent.

---

## Engineering Integrity Standard

The goal of this contract is to ensure:
- accurate analysis
- reliable technical reasoning
- transparent uncertainty
- trustworthy architecture discussion

Engineering integrity requires truth over confidence.

---

## Command Behavior

Apply this contract when the user asks to:
- analyze code
- review architecture
- debug issues
- audit migrations
- identify dead code
- evaluate system ownership
- diagnose runtime behavior

All technical claims must be evidence-based.

---

## Expected Outcome

Following this contract ensures:
- fewer incorrect technical conclusions
- safer refactoring decisions
- clearer architecture understanding
- better long-term engineering decisions

The result is higher trust in technical analysis.
