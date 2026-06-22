# God Folder Definition

> **Source Contract:** [FEATURE_SIZE_GOVERNANCE_CONTRACT.md](../FEATURE_SIZE_GOVERNANCE_CONTRACT.md)
> **Section:** God Folder Definition

---

## Definition

A feature becomes a god folder when it owns multiple unrelated capabilities that could be independently understood, tested, or extracted.

---

## Signs of God-Folder Formation

| Sign | Description |
|---|---|
| Multiple business domains | More than one distinct business domain lives inside the folder |
| Separate DAL/controller/hook stacks | Multiple independent stacks indicate hidden features |
| Adapter exports from unrelated capabilities | The adapter surface spans multiple concerns |
| Folder exceeds 3 levels deep | Depth is a symptom of hidden complexity |
| Developers must search, not navigate | No clear mental model of what lives where |
| Feature name no longer describes files | The name has become too generic to be meaningful |

---

## Action

When a feature shows 3 or more of these signs, it must be treated as a god folder.

A god folder requires an immediate extraction plan regardless of file count.

See [29-extraction-rule.md](29-extraction-rule.md).
