# VENOM SECURITY REPORT
**Date:** 2026-05-10  
**Trigger:** Pre-push full security sweep  
**Reviewer:** VENOM — Security Sheriff  
**Mode:** Read-only analysis

---

## VENOM TARGET

| Field | Value |
|---|---|
| Feature / Route / Engine | Full repository — all changed files + WT boundary |
| Application Scope | VCSM + WT (boundary audit) |
| Reason for review | Pre-push sweep: API leakage, secrets, not-for-production content |
| Primary trust boundary | Git tracking boundary / identity surface / moderation access |

---

## SECURITY SURFACE

| Field | Value |
|---|---|
| Entry points | Git push → GitHub public repo |
| Auth sources | Supabase session (auth.uid()), VITE env vars |
| Authorization layers | Controller (moderation), RLS (DB) |
| Identity surfaces | actorId, kind — plus violations listed below |
| Sensitive objects | WT internal admin code, superadmin panels, R2 config, debug privacy data |

---

## TRUST BOUNDARY TRACE

| Stage | Detail |
|---|---|
| Client input | Browser, git commit |
| Validated at | .gitignore excludes .env, zNOTFORPRODUCTION/ |
| Identity resolved at | Supabase auth session via auth.uid() |
| Authorization enforced at | Controller layer (moderation), RLS (DB) |
| Data returned to | GitHub public repo (push target) |

---

# SECURITY RISK FINDINGS

---

## FINDING 1 — CRITICAL: `apps/WT/mine-transfer/` Fully Tracked by Git (346 Files)

**VENOM SECURITY FINDING**

- **Location:** `apps/WT/mine-transfer/` — all 346 files tracked by git
- **Application Scope:** WT (internal staging workspace — must never be public)
- **Current behavior:** `git ls-files apps/WT/` returns 346 tracked files including:
  - `cloudflare-worker-upload/wrangler.toml` — infrastructure config with domain + bucket name
  - `cloudflare-worker-upload/worker.js` — Cloudflare R2 upload worker source
  - `supabase/functions/create-org-member/`, `create-parent/`, `create-tenant/` — Edge Function TypeScript source
  - `src/superadmin/` — full superadmin panel code (create tenant, list tenants, admin login screen)
  - `ARCHITECTURE.md`, `README.md` — internal documentation
  - `VCSM_Feature_Button_Test_Matrix.xlsx` — internal test matrix binary
  - `src/features/dashboard/auth/tripointDashboardAccess.js` — named partner access file
- **Risk:** Pushing to GitHub exposes:
  - Full internal admin tooling architecture and code
  - Partner-specific access controls (Tripoint)
  - Cloudflare infrastructure bindings (`post-media` R2 bucket, `upload.vibezcitizens.com` domain)
  - Supabase Edge Function bootstrap code for tenant provisioning
  - Superadmin screens exposing all platform tenants and orgs
- **Severity:** CRITICAL
- **Why it matters:** CLAUDE.md explicitly states `apps/WT/` is "internal staging and transfer workspace — never deploy, bundle, or reference from any production build." It should never be publicly accessible. Pushing these 346 files to a GitHub repo makes all this internal architecture, partner logic, and admin tooling visible to anyone who can access the repo.
- **Recommended mitigation:**
  1. Add `apps/WT/` to the root `.gitignore` immediately
  2. Run `git rm -r --cached apps/WT/` to untrack without deleting locally
  3. Commit the removal before pushing
  4. Confirm the `.gitignore` entry prevents future re-tracking
- **Rationale:** The `.gitignore` at root already excludes `zNOTFORPRODUCTION/` but does NOT exclude `apps/WT/`. This is a gap.
- **Follow-up command:** Thor (release gating), Carnage (if Edge Functions need tracking strategy)
- **CISSP Domain:**
  - Primary: Security and Risk Management
  - Secondary: Asset Security, Software Development Security

---

## FINDING 2 — HIGH: Cloudflare Worker Has Wildcard CORS (`Access-Control-Allow-Origin: '*'`)

**VENOM SECURITY FINDING**

- **Location:** `apps/WT/mine-transfer/cloudflare-worker-upload/worker.js` (lines 2-7)
- **Application Scope:** WT
- **Current behavior:** The R2 upload worker responds to all `POST` requests with `Access-Control-Allow-Origin: *`, accepting uploads from any origin. No origin allowlist, no auth header validation, no Supabase JWT verification.
- **Risk:** Any origin can POST a file to `upload.vibezcitizens.com` and write objects to the `post-media` R2 bucket. There is no caller identity check — anyone who discovers the endpoint can upload arbitrary content.
- **Severity:** HIGH
- **Why it matters:** Unrestricted cross-origin write access to cloud storage is a direct storage abuse vector. Combined with the domain being disclosed via the tracked `wrangler.toml`, this is exploitable.
- **Recommended mitigation:**
  1. Add origin validation — restrict to known frontend domains
  2. Require and validate a Supabase JWT or pre-signed token before accepting the upload
  3. Scope the CORS header to: `Access-Control-Allow-Origin: https://vibezcitizens.com` (or equivalent)
- **Rationale:** Upload workers must verify caller identity; `*` CORS + no auth = open write endpoint.
- **Follow-up command:** BUGSBUNNY (if testing is needed), DB (if bucket policy hardening required)
- **CISSP Domain:**
  - Primary: Communication and Network Security
  - Secondary: Identity and Access Management

---

## FINDING 3 — HIGH: `getDebugPrivacyRows.controller.js` Returns Banned Identity Fields

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js` — lines 75–76
- **Application Scope:** VCSM
- **Current behavior:** The controller builds its return payload with:
  ```js
  profile_id: actor?.profile_id ?? null,
  vport_id: actor?.vport_id ?? null,
  ```
  These values are returned to the debug hook and rendered in `DebugPrivacyPanel.jsx`.
- **Risk:** `profile_id` and `vport_id` are explicitly banned identity surfaces per the VCSM architecture contract. Even though this is a dev-only debug path, the controller exports these values which can be inspected by a developer or accidentally widened to non-debug callers.
- **Severity:** HIGH
- **Why it matters:** The architecture contract states: "Never expose `profileId` or `vportId` through any public hook/controller surface." Debug controllers are still controllers. Returning these fields normalizes their exposure and creates a code path where they can leak into a wider context.
- **Recommended mitigation:**
  - Remove `profile_id` and `vport_id` from the return shape
  - Replace with `isVport` (boolean, already present) which communicates the same intent without exposing the raw internal ID
- **Rationale:** Identity surface violations must be zero-tolerance, even in debug paths.
- **Follow-up command:** CONTRACT REVIEWER
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Asset Security, Software Development Security

---

## FINDING 4 — HIGH: `isModerationAuthorizedDAL` Accepts `actorId` That Is Silently Ignored

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export async function isModerationAuthorizedDAL(actorId) {
    // actorId is accepted but never used
    const { data, error } = await supabase
      .schema('learning')
      .rpc('is_current_user_platform_admin')
    // resolves via auth.uid() server-side
  ```
  The function signature accepts `actorId` but the actual authorization check uses `auth.uid()` from the session, not the passed parameter.
- **Risk:** A caller that passes `actorId = someOtherActor` will receive authorization based on **their own session identity**, not the actor they passed. This creates a misleading security contract: the function appears to validate a specific actor, but actually validates the session user. If a future caller relies on the `actorId` parameter for delegation logic, the authorization will be incorrect.
- **Severity:** HIGH
- **Why it matters:** Phantom parameters in authorization functions are a trust boundary defect. They create false documentation of what is actually being authorized, and can lead to privilege escalation if the caller assumes the check is actor-scoped.
- **Recommended mitigation:**
  - Remove the `actorId` parameter from `isModerationAuthorizedDAL` since it is unused
  - Update `assertModerationAccess.controller.js` to not pass it
  - Optionally: validate that `actorId` matches the current session user before calling the DAL, or log a warning if they differ
- **Rationale:** Authorization function signatures must accurately reflect what they actually validate.
- **Follow-up command:** BUGSBUNNY
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

## FINDING 5 — MEDIUM: `DebugPrivacyPanel.jsx` Emits `console.log` for Privacy Data

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx` — lines 18–26
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  useEffect(() => {
    if (!isDev || !rows.length) return;
    console.groupCollapsed('%c[Privacy Debug]...', 'color:#a78bfa');
    rows.forEach((row) => console.log(row));
    console.groupEnd();
  }, [...]);
  ```
  Privacy visibility rows (follow state, private/public flags, actor ownership) are emitted to the browser console.
- **Risk:** Browser console output is visible to any user who opens DevTools, regardless of whether they are a developer. In staging or preview environments that share production data, these logs expose the privacy model for all feed actors. Additionally, this violates the project memory rule: "No console.log; debug output must render on screen and be dev-only (never production)."
- **Severity:** MEDIUM
- **Why it matters:** Privacy visibility data (who follows whom, who is private, who owns what actor) is sensitive. Console leakage of this data is a data exposure risk in shared environments.
- **Recommended mitigation:**
  - Remove the `console.groupCollapsed`/`console.log` block entirely — the panel already renders the rows on screen
  - If console output is needed, use a dedicated dev logger utility, not raw `console.log`
- **Rationale:** Project memory explicitly bans `console.log`; debug panels must render on screen only.
- **Follow-up command:** LOGAN (update debug logging policy)
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Asset Security

---

## FINDING 6 — MEDIUM: `chatNavDebugger.js` Togglable via Browser Console by Any User

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/chat/debug/chatNavDebugger.js`
- **Application Scope:** VCSM
- **Current behavior:** The debugger is enabled via `window.__CHAT_NAV_DEBUG = true`. Any user who opens browser DevTools can enable this flag and activate detailed chat navigation state logging including conversation IDs, actor IDs, timing, and state transitions.
- **Risk:** Chat navigation metadata (conversation IDs, participant actor IDs, message state) is exposed to any technically curious user in any environment — including production.
- **Severity:** MEDIUM
- **Why it matters:** Debug flags toggled via global window properties are accessible to all users in any environment. Chat data is sensitive by nature.
- **Recommended mitigation:**
  - Gate `window.__CHAT_NAV_DEBUG` behind `import.meta.env.DEV` before it has any effect
  - Or use a non-guessable internal key pattern that requires knowing the exact key
  - Or remove the feature entirely and rely on the on-screen debug panel pattern
- **Rationale:** Production-accessible debug flags violate the principle of least exposure for operational data.
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Security Operations
  - Secondary: Software Development Security

---

## FINDING 7 — MEDIUM: `getPublicIp.dal.js` Dead Code Calling External Third-Party Service

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/legal/dal/getPublicIp.dal.js`
- **Application Scope:** VCSM
- **Current behavior:** File is marked "NOT CALLED — retained for reference only." However, it contains an active function that calls `https://api.ipify.org?format=json` — an external third-party IP resolution service.
- **Risk:**
  1. Dead code that calls a third-party service should not exist in the codebase — if accidentally re-imported, it introduces a dependency on an external service for legal consent data
  2. Client-side IP from ipify is inherently untrustworthy (VPNs, proxies, NAT) and was already noted as unfit for legal records
  3. Relying on ipify adds an external service dependency with unknown uptime and data handling policies
- **Severity:** MEDIUM
- **Why it matters:** Dead code that calls external services is a liability: it can be accidentally re-activated, it represents an untrusted data source in a legal context, and it exfiltrates user IP to a third-party.
- **Recommended mitigation:**
  - Delete `getPublicIp.dal.js` entirely — it is self-documented as "not called"
  - IP capture must be done server-side via a Supabase Edge Function as already noted in the file
- **Rationale:** Dead code with external calls must be removed, not retained.
- **Follow-up command:** Carnage (Edge Function for server-side IP capture)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Software Development Security, Security and Risk Management

---

## FINDING 8 — LOW: `joinInvite.dal.js` Write Path Has No Ownership Gate in DAL

**VENOM SECURITY FINDING**

- **Location:** `apps/VCSM/src/features/join/dal/joinInvite.dal.js` — `acceptJoinResourceDAL`
- **Application Scope:** VCSM
- **Current behavior:** `acceptJoinResourceDAL(resourceId, barberVportActorId, extraMeta)` writes `member_actor_id` and activates a resource based on `resourceId` alone. No ownership check is performed in the DAL — the write succeeds for any `resourceId` passed.
- **Risk:** If the controller layer fails to verify that the calling actor is authorized to accept this specific resource, any authenticated user could call this with an arbitrary `resourceId` and link themselves to a resource they do not own. The DAL is fully trusting of inputs.
- **Severity:** LOW (mitigated if RLS enforces ownership server-side; flag for DB verification)
- **Why it matters:** Write DALs that accept and act on IDs without ownership checks rely entirely on RLS correctness. If the DB policy for `resources` does not restrict `UPDATE` to the owner, this becomes HIGH.
- **Recommended mitigation:**
  - Verify with DB/Carnage that `vport.resources` has an RLS UPDATE policy requiring the calling user to own the resource
  - If RLS is absent or incomplete, add an ownership check in the controller before calling this DAL
- **Rationale:** Defense-in-depth requires that write paths not rely solely on RLS — controllers should validate ownership before writing.
- **Follow-up command:** DB (verify RLS on `vport.resources`), Carnage (if policy addition needed)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering

---

## FINDING 9 — LOW: Root `.env` Mixes Client (VITE_) and Server Vars in One File

**VENOM SECURITY FINDING**

- **Location:** `.env` (root)
- **Application Scope:** VCSM
- **Current behavior:** Root `.env` contains both:
  - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — Vite-exposed, bundled into client
  - `SUPABASE_URL` / `SUPABASE_ANON_KEY` — non-Vite, server/script context
- **Risk:** Mixing client and server env vars in a single file risks accidental exposure. If any tooling or script loads `.env` without the Vite filter and passes all vars to a server-side process, the anon key (already relatively low-risk but still) is accessible in two namespaces with unclear authority.
- **Severity:** LOW (anon key has limited power; file is gitignored; no service role key detected)
- **Why it matters:** Clear separation of client-exposed vs server-only vars prevents confusion and reduces misuse risk as the system scales.
- **Recommended mitigation:**
  - Create a separate `.env.server` or `.env.functions` for non-Vite vars
  - Or document the dual-namespace pattern explicitly so future developers don't add service-role keys to the same file
- **Rationale:** Separation of concerns in environment variable management reduces exposure surface.
- **Follow-up command:** LOGAN
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Asset Security

---

# IDENTITY SURFACE WARNINGS

## WARNING 1

```
IDENTITY SURFACE WARNING
Location:     apps/VCSM/src/features/feed/controllers/getDebugPrivacyRows.controller.js:75-76
Current:      profile_id, vport_id returned in controller output
Expected:     actorId + kind only; replace with isVport boolean (already present)
Risk:         Normalizes banned identity fields in a controller return shape
Correction:   Remove profile_id and vport_id from return object; keep isVport
```

---

# DEBUG LEAKAGE WARNINGS

## WARNING 1

```
DEBUG LEAKAGE WARNING
Location:     apps/VCSM/src/features/feed/screens/DebugPrivacyPanel.jsx:18-26
Behavior:     console.log emits privacy visibility rows including follow state, private flags
Leak risk:    Visible to any user who opens DevTools in any environment
Severity:     MEDIUM
Mitigation:   Remove console.log block; panel already renders data on screen
```

## WARNING 2

```
DEBUG LEAKAGE WARNING
Location:     apps/VCSM/src/features/chat/debug/chatNavDebugger.js
Behavior:     window.__CHAT_NAV_DEBUG toggleable by any user in browser console
Leak risk:    Chat navigation metadata exposed in production to curious users
Severity:     MEDIUM
Mitigation:   Gate behind import.meta.env.DEV or remove window-toggle
```

---

# WT BOUNDARY VERIFICATION

```
WT BOUNDARY TRACE
Files tracked by git:    346 files in apps/WT/mine-transfer/
Cross-imports into prod: NONE FOUND (no production app imports from apps/WT/)
WT in CI/CD pipelines:   NOT VERIFIED (manual check recommended)
Root .gitignore:         Does NOT exclude apps/WT/ — CRITICAL GAP
WT .gitignore:           Exists at apps/WT/mine-transfer/.gitignore (only covers local .env)
Status:                  WT is fully tracked by git and will push to GitHub
```

**No cross-imports found** — `apps/WT/` code does not bleed into `apps/VCSM/`, `apps/wentrex/`, or `apps/Traffic/` imports. The boundary leakage is **tracking**, not runtime imports.

---

# CLEAR FINDINGS

The following areas were reviewed and found clean:

| Area | Status |
|---|---|
| Root `.gitignore` excludes `.env`, `zNOTFORPRODUCTION/`, `logan/`, `session-summaries/` | CLEAN |
| No service role key found in source code | CLEAN |
| No hardcoded API keys in `apps/VCSM/src` or `engines/` | CLEAN |
| `.env.example` files tracked (by design, values are placeholders) | CLEAN |
| `DebugPrivacyPanel` gated behind `import.meta.env.DEV` | CLEAN |
| Moderation controller calls `assertModerationAccessController` before every read/write | CLEAN |
| No `apps/WT/` imports found in production app code | CLEAN |
| Cloudflare worker reads env from `env.R2_BUCKET` (no hardcoded credentials) | CLEAN |
| `isModerationAuthorizedDAL` uses server-side `auth.uid()` RPC (not client-provided identity) | CLEAN |
| No `select('*')` found in changed DAL files | CLEAN |

---

# CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | Finding 1 (WT tracking), Finding 7 (dead code) |
| Asset Security | 4 | Findings 1, 3, 5, 7 — profile_id exposure, privacy data logs, dead code |
| Security Architecture and Engineering | 3 | Findings 4, 8, 9 — auth phantom param, ownership depth, env mixing |
| Communication and Network Security | 1 | Finding 2 — wildcard CORS on upload worker |
| Identity and Access Management | 4 | Findings 3, 4, 8 + Identity Surface Warning 1 |
| Security Assessment and Testing | 0 | Not in scope for this sweep; recommend DB verify RLS on vport.resources |
| Security Operations | 2 | Findings 5, 6 — console.log leakage, window debug flag |
| Software Development Security | 5 | Findings 1, 2, 4, 5, 6, 7 — code quality + debug hygiene |

### Uncovered Domain Note

**Security Assessment and Testing** was not meaningfully covered by this sweep. A targeted audit of RLS policies (particularly `vport.resources`, `moderation.*`) via the DB command is recommended before shipping.

---

# MITIGATION PRIORITY ORDER

| Priority | Finding | Action |
|---|---|---|
| 1 — BLOCK PUSH | Finding 1 — WT tracked by git | `git rm -r --cached apps/WT/` + `.gitignore` entry before push |
| 2 — Ship blocker | Finding 2 — Wildcard CORS on R2 worker | Add origin allowlist + JWT check to worker |
| 3 — Fix before merge | Finding 3 — `profile_id`/`vport_id` in debug controller | Remove banned fields from return shape |
| 4 — Fix before merge | Finding 4 — Phantom `actorId` in moderation DAL | Remove unused parameter |
| 5 — Soon | Finding 5 — `console.log` in DebugPrivacyPanel | Remove log block |
| 6 — Soon | Finding 6 — window toggle on chatNavDebugger | Gate behind DEV env |
| 7 — Clean up | Finding 7 — Dead `getPublicIp.dal.js` | Delete the file |
| 8 — Verify | Finding 8 — joinInvite write DAL ownership | Run DB audit on vport.resources RLS |
| 9 — Low | Finding 9 — Mixed .env namespaces | Document or separate |

---

**VENOM STATUS: COMPLETE**  
Read-only. No files modified. No schema changes. No fixes applied.  
All findings are surfaced — resolution is the responsibility of the engineering team.
