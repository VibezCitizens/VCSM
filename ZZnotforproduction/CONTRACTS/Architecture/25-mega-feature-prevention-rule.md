# Mega Feature / God Folder Prevention Rule

> **Source Contract:** [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md)
> **Section:** Mega Feature / God Folder Prevention Rule

---

## Rule

A feature folder must not grow without architectural review.

Features must remain small enough that one developer can understand the feature boundary, responsibilities, and public adapter surface without opening dozens of unrelated files.

---

## Governing Principle

When a feature can no longer be understood in one reading without searching, it has already become a god folder.

The threshold rules in this contract exist to trigger intervention before that point is reached.

---

## Cross-Link

Feature size thresholds: [26-feature-size-thresholds.md](26-feature-size-thresholds.md)

Required actions at each threshold: [27-feature-review-actions.md](27-feature-review-actions.md)

God folder signs: [28-god-folder-definition.md](28-god-folder-definition.md)

Extraction protocol: [29-extraction-rule.md](29-extraction-rule.md)
