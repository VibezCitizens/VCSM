# VCSM Legal Automation Scripts

**Last updated:** May 10, 2026

---

## Overview

Three local Node.js scripts enforce discipline around legal document releases. They operate purely on the local filesystem and git — no database connection, no Supabase credentials required.

**Location:** `apps/VCSM/scripts/legal/`

---

## Files

| File | Role |
|---|---|
| `legal.registry.mjs` | Central registry: maps document_type → { file, route, titleBase } |
| `check-legal-files.mjs` | Git diff check — verifies JSX changes are paired with a migration |
| `generate-legal-migration.mjs` | Generates a timestamped SQL migration for a version bump |

---

## Registry (`legal.registry.mjs`)

Single source of truth for local automation. Exports:

```js
export const APP_KEY = 'vcsm'

export const REGISTRY = {
  terms_of_service: {
    file: 'src/features/legal/docs/TermsOfServiceContent.jsx',
    route: '/legal/terms-of-service',
    titleBase: 'Terms of Service',
  },
  privacy_policy: {
    file: 'src/features/legal/docs/PrivacyPolicyContent.jsx',
    route: '/legal/privacy-policy',
    titleBase: 'Privacy Policy',
  },
  age_verification: {
    file: 'src/features/legal/docs/AgeVerificationContent.jsx',
    route: '/legal/age-verification',
    titleBase: 'Age Verification Attestation',
  },
}
```

The registry does NOT store version numbers — versions live in `platform.legal_documents` (DB). The registry maps what files and routes belong to each type so the scripts can validate and generate correctly.

**To add a new document type:**
1. Add the JSX content file in `src/features/legal/docs/`
2. Add the entry to `REGISTRY` in `legal.registry.mjs`
3. Add the `docType` key to `DOCUMENT_MAP` in `LegalDocumentScreen.jsx`
4. Add the `consent_type` value to the DB CHECK constraint via a migration
5. Run `npm run legal:release -- --type <new_type> --version 1.0 --effective-date <date>` to seed the first active row

---

## Script 1: check-legal-files (`npm run legal:check-files`)

**What it does:**

1. Runs `git diff HEAD --name-only` — finds all files changed vs the last commit
2. Checks if any of those files match registry entries (by path suffix)
3. For each matched legal JSX file: scans `supabase/migrations/*.sql` for any file containing that `document_type` string
4. If a legal JSX changed but no matching migration exists: exits 1 with the exact fix command

**Exit codes:**
- `0` — no legal JSX files changed, OR all changed files have a matching migration
- `1` — changed legal JSX file(s) with no matching migration found

**Example output (clean):**
```
legal:check-files — no registered legal JSX files changed. Nothing to verify.
```

**Example output (failure):**
```
legal:check-files — checking changed legal files:

  ✗ terms_of_service  (src/features/legal/docs/TermsOfServiceContent.jsx)

ERROR: The following changed legal files have no matching migration:

  document_type : terms_of_service
  changed file  : src/features/legal/docs/TermsOfServiceContent.jsx
  fix with      : npm run legal:release -- --type terms_of_service --version <X.Y> --effective-date <YYYY-MM-DD>
```

**No DB connection.** File system + git only.

---

## Script 2: generate-legal-migration (`npm run legal:release`)

**Command:**
```bash
npm run legal:release -- --type <type> --version <X.Y> --effective-date <YYYY-MM-DD>
```

**Arguments:**

| Flag | Required | Format | Example |
|---|---|---|---|
| `--type` | Yes | Must match a registry key | `age_verification` |
| `--version` | Yes | `X.Y` — two numeric segments | `1.1` |
| `--effective-date` | Yes | `YYYY-MM-DD` | `2026-05-10` |

**What it does:**

1. Validates all three arguments — exits 1 with a clear error list if any fail
2. Warns if the registry JSX file has no uncommitted git diff (version-only bump is valid; content bump without file change is a signal to investigate)
3. Generates a UTC timestamp → constructs filename: `{timestamp}_legal_{type}_v{X_Y}.sql`
4. Writes the SQL file to `supabase/migrations/`
5. Prints next steps

**Does NOT:**
- Connect to Supabase
- Execute any SQL
- Modify any DB
- Require any environment variable or credential

**Generated SQL pattern:**
```sql
BEGIN;

-- Deactivate old active row
UPDATE platform.legal_documents
SET    is_active = false
WHERE  document_type = '<type>'
  AND  is_active     = true
  AND  app_id = (SELECT id FROM platform.apps WHERE key = 'vcsm' LIMIT 1);

-- Insert new active row (idempotent via NOT EXISTS)
INSERT INTO platform.legal_documents (
  app_id, document_type, version, title, content_url, is_active, published_at
)
SELECT a.id, '<type>', '<version>', '<titleBase>', '<route>', true, '<effective-date>'::date
FROM platform.apps a
WHERE a.key = 'vcsm'
  AND NOT EXISTS (
    SELECT 1 FROM platform.legal_documents ld
    WHERE ld.app_id = a.id AND ld.document_type = '<type>' AND ld.version = '<version>'
  );

COMMIT;
```

**`platform.publish_legal_document()` does not exist.** The generator uses explicit SQL. If that function is added later, update the generator to call it instead.

---

## npm Scripts

Defined in `apps/VCSM/package.json`:

```json
"legal:check-files": "node scripts/legal/check-legal-files.mjs",
"legal:release": "node scripts/legal/generate-legal-migration.mjs"
```

---

## Local Publish Workflow

```bash
# 1. Edit JSX content (if content changed)
vim src/features/legal/docs/TermsOfServiceContent.jsx

# 2. Generate the migration
npm run legal:release -- --type terms_of_service --version 1.1 --effective-date 2026-06-01

# 3. Review the generated SQL
#    supabase/migrations/YYYYMMDDHHMMSS_legal_terms_of_service_v1_1.sql

# 4. Apply via Supabase dashboard or CLI
supabase db push

# 5. Verify the pair is wired
npm run legal:check-files

# 6. Commit both files together
git add supabase/migrations/YYYYMMDDHHMMSS_... src/features/legal/docs/TermsOfServiceContent.jsx
git commit -m "legal: terms_of_service v1.1"
```

---

## Design Decisions

**Why no DB connection in the scripts?**
Credentials vary per developer and environment. DB-connected scripts require a service role key that should not be stored in the repo. The scripts are designed to be runnable by any developer at any time without configuration.

**Why does the generator not detect content changes automatically?**
Hashing JSX content and comparing it to a stored checksum would require maintaining the checksum separately (in the registry, in the DB, or in a sidecar file) — three potential divergence points. The explicit `--version` flag keeps the version bump deliberate, not automatic.

**Why `git diff HEAD` instead of `git diff --cached`?**
`git diff HEAD` covers both staged and unstaged changes. This catches the case where a developer edited the JSX but forgot to stage it. For a stricter pre-commit hook, `--cached` could be used instead.

**Why `BEGIN`/`COMMIT` instead of a stored procedure?**
`platform.publish_legal_document()` does not exist in the current schema. Plain SQL in a transaction is always readable and requires no function maintenance. When the function is added, the generator should be updated to call it.

---

## Planned Enhancements

| Enhancement | Status |
|---|---|
| `legal:check-files` wired into CI pipeline | Not yet — scripts exist but CI step not configured |
| `platform.publish_legal_document()` stored procedure | Not yet — generator will call it when available |
| Version-only bump without JSX change: suppress warning | Low priority — current warning is correct behavior |
