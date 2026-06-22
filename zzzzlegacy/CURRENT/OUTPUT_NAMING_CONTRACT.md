# Output Naming Contract
**Created:** 2026-06-02
**Last Updated:** 2026-06-02  
**Ticket:** TICKET-CURRENT-CATEGORY-INDEX-0001
**Supersedes:** CURRENT-OUTPUT-CONTRACT-001 (extends, does not replace)
**Status:** ACTIVE

---

## Rule

All output files produced by any command must follow this naming pattern:

```
CURRENT/outputs/YYYY/MM/DD/[command-name]/NNN_[category-key]_[command-name]_[ticket-or-run-label].md
```

---

## Pattern Components

| Component | Description | Example |
|---|---|---|
| `YYYY/MM/DD` | Date the output was created | `2026/06/02` |
| `[command-name]` | Lowercase command name | `venom`, `dr-strange`, `elektra` |
| `NNN` | 3-digit sequential number per command per day (001, 002...) | `001` |
| `[category-key]` | Canonical key from CATEGORY_REGISTRY.md | `dashboard-settings`, `booking`, `platform-security` |
| `[command-name]` | Same command name repeated for readability | `sentry` |
| `[ticket-or-run-label]` | Ticket ID or short descriptive run label | `TICKET-DASH-001`, `reality-review` |

---

## Examples

| Command | Category Key | Example Filename |
|---|---|---|
| dr-strange | dashboard | 001_dashboard_dr-strange_reality-review.md |
| sentry | dashboard-settings | 002_dashboard-settings_sentry_post-execution-review.md |
| venom | booking | 003_booking_venom_rpc-trust-boundary.md |
| hawkeye | platform-security | 004_platform-security_hawkeye_endpoint-verification.md |
| blackwidow | profiles | 005_profiles_blackwidow_adversarial-review.md |
| elektra | auth | 006_auth_elektra_source-sink-audit.md |
| spider-man | feed | 007_feed_spider-man_regression-coverage.md |
| carnage | identity | 008_identity_carnage_migration-safety.md |
| architect | chat | 009_chat_architect_structure-map.md |
| ironman | social | 010_social_ironman_ownership-audit.md |

---

## Required Output File Metadata

Every output file must begin with this metadata block:

```markdown
## Output Metadata
| Field | Value |
|---|---|
| Category Key | [category-key] |
| Feature / Area | [Display Name] |
| Command | [COMMAND NAME] |
| Ticket | [TICKET-ID or RUN-LABEL] |
| Output Path | CURRENT/outputs/YYYY/MM/DD/[command]/NNN_... |
| CURRENT Destination | CURRENT/features/[feature] or CURRENT/platform/[area] |
| Source Scope | apps/VCSM/src/features/[feature] or N/A |
| Timestamp | YYYY-MM-DDTHH:MM:SS |
```

---

## INDEX.md Requirement

Every command folder under `CURRENT/outputs/YYYY/MM/DD/[command]/` must have an `INDEX.md`:

```markdown
# [COMMAND] Output Index — YYYY-MM-DD

| # | Category Key | File | Ticket | Status | Timestamp |
|---|---|---|---|---|---|
| 001 | booking | 001_booking_venom_rpc-trust-boundary.md | TICKET-BOOKING-RPC-001 | COMPLETE | 2026-06-02T10:30:00 |
```

---

## Timestamp Rule

Every output file and every INDEX.md row must include a timestamp in ISO 8601 format:

`YYYY-MM-DDTHH:MM:SS`

Record when the work was performed, not just the date.

---

## Category Key Registry

See: `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/CURRENT/CATEGORY_REGISTRY.md`

---

*Generated: 2026-06-02 | Ticket: TICKET-CURRENT-CATEGORY-INDEX-0001*
