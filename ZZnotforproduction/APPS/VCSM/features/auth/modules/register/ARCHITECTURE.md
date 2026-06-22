---
title: Register Module — Architecture
status: CURRENT
feature: auth
module: register
source: ARCHITECT-V2-source-verified
last-architect-run: 2026-06-06
scanner-version: V2
---

# auth / modules / register — ARCHITECTURE

## Status

CURRENT. Full source-verified rebuild — 2026-06-06 ARCHITECT V2 run.

## Layer Stack

```
GUARD         AuthPublicRoute.jsx
              └── useAuth() → { user, loading }
              └── if user → Navigate to /feed (replace)

SCREEN        RegisterScreen.jsx
              ├── RegisterFormCard.jsx
              │     ├── ConsentCheckbox.jsx
              │     ├── lucide-react icons
              │     ├── react-router-dom Link (/legal/terms-of-service, /legal/privacy-policy)
              │     └── @i18n (useTranslation)
              └── useRegister.js
                    ├── register.controller.js (ctrlRegisterAccount)
                    │     ├── authInputValidation.model.js (validateEmail)
                    │     ├── wandersSupabaseClient.adapter (getWandersSupabase — Wanders path)
                    │     └── register.dal.js
                    │           ├── supabase.auth.getSession   (pre-check)
                    │           ├── supabase.auth.signUp        (new user)
                    │           ├── supabase.auth.updateUser    (anonymous upgrade)
                    │           ├── supabase.auth.signOut       (stale JWT recovery)
                    │           ├── supabase.from('profiles').upsert (profile shell)
                    │           ├── supabase.auth.setSession    (Wanders mirror)
                    │           └── supabase.auth.getSession    (Wanders warm)
                    ├── legal.adapter.js → useSignupConsent
                    │     └── legalConsent.controller.js (recordSignupConsent)
                    │           ├── legalDocuments.read.dal.js → platform.legal_documents SELECT
                    │           └── userConsents.write.dal.js → platform.user_consents INSERT
                    ├── registerPasswordRules.model.js (evaluateRegisterPasswordRules, evaluateConfirmPasswordState)
                    ├── authInputValidation.model.js (isValidInviteCode)
                    └── monitoringClient.js (captureFrontendError)
                          └── supabase.functions.invoke('monitoring-ingest-error')
```

## Post-Registration Branch Logic

```
ctrlRegisterAccount result:

  requiresEmailConfirm = true
    └── navigate('/verify-email', { replace: true, state: { email } })
        Post-email-confirm consent recording path: NOT audited in this scan (callback path)

  requiresEmailConfirm = false + userId present
    └── recordSignupConsent({ userId })         ← consent recorded NOW
    └── goOnboarding()
          └── navigate('/onboarding', { replace: true, state: navState })
                navState.from — WARNING: not whitelist-validated (FINDING-HIGH-001)
```

## Anonymous User Upgrade Path

```
dalReadRegisterSession → session exists → isAnonymousUser(session.user) === true
  └── dalUpdateRegisterUser (email + password on existing anon user)
  └── dalUpsertRegisterProfile
  └── maybeMirrorWandersSession (if isWandersFlow)
  └── return { ok: true, requiresEmailConfirm: false, userId: existingUserId }
```

## Stale JWT Recovery

```
dalSignUpRegisterUser → throws "user from sub claim in JWT does not exist"
  └── isStaleJwtSubjectError(error) === true
  └── dalSignOutRegisterSession
  └── dalSignUpRegisterUser (retry)
```

## Model Layer

```
registerPasswordRules.model.js  — 5 password rules (client-only enforcement)
authInputValidation.model.js    — email validation, invite_code UUID check, safe return path whitelist
```

## Security Notes

- navState.from: string type check only — isSafeAuthReturnPath() exists but is NOT called (FINDING-HIGH-001)
- profiles upsert: RLS unconfirmed (FINDING-MED-005 / BW-AUTH-002)
- platform.user_consents INSERT: RLS unconfirmed (FINDING-MED-004)
- isWandersFlow: client-controlled, mitigated by userId match guard (FINDING-LOW-007)
- Password rules: client-only — no server enforcement confirmed (FINDING-LOW-006)

## Open Architecture Questions

- [ ] Does onboarding.controller.js apply isSafeAuthReturnPath() to navState.from?
- [ ] Is consent recorded in the callback path after email confirmation?
- [ ] What is the RLS policy on public.profiles for upsert?
- [ ] What is the RLS policy on platform.user_consents for insert?
