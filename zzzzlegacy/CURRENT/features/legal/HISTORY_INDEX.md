# HISTORY_INDEX — legal

All audit and planning documents that inform this feature's governance state.

---

| Date | Command | Type | Path |
|---|---|---|---|
| 2026-05-10 | VENOM | Security | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_venom_terms-of-service-logic.md` |
| 2026-05-10 | KRAVEN | Performance | `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-10_kraven_terms-of-service-logic.md` |
| 2026-05-10 | SENTRY | Compliance | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-10_sentry_vport-system-post-realm-hardening.md` |
| 2026-05-18 | VENOM | Security (Resolution Audit) | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-18_venom_legal-dal-finding-resolution.md` |

---

## Notes

- The 2026-05-10 VENOM report covers 9 findings across the consent gate, signup flow, and DB consent schema.
- The 2026-05-18 VENOM resolution audit verified finding status by direct source code inspection; it does not verify live DB state (migrations are tracked but not confirmed applied).
- The 2026-05-10 SENTRY report is scoped to VPORT system post realm hardening (gas + menu controllers + resolvePublicRealm.dal.js), not the legal consent gate directly. It is included here because it covers a contract relevant to VPORT system posts that intersect with the legal/privacy/realm boundary (Void Realm system post exclusion rule).
- The 2026-05-10 KRAVEN report (first 80 lines read during governance anchor pass) covers the consent write path performance. The full file contains additional findings not captured in this summary.
- ARCHITECT report (`2026-05-10_architect_terms-of-service-logic.md`) is referenced as input to both VENOM and KRAVEN reports but was not directly read during this governance anchor pass. It may exist in the audits directory.
