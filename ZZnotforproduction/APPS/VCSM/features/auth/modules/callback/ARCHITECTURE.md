---
title: Callback Module — Architecture
status: STUB
feature: auth
module: callback
source: architect-derived
created: 2026-06-05
---

# auth / modules / callback — ARCHITECTURE

## Status

STUB. Layer stack seeded from ARCHITECT review.

## Layer Stack

```
/auth/callback (route — public)
  └── AuthCallbackScreen.jsx (loading state)
        └── useAuthCallback.js
              └── authCallback.controller.js
                    └── authCallback.dal.js
                          └── supabase.auth.exchangeCodeForSession(code)
                                → on success: session established
                                      └── redirect (destination UNVERIFIED)
```

## PKCE Flow (if enabled)

```
Browser → /auth/callback?code=...
  └── authCallback.dal.js extracts code from URL
        └── supabase.auth.exchangeCodeForSession
              └── Supabase verifies code + PKCE verifier (from sessionStorage)
                    → returns session tokens
```

## TODO

- [ ] Confirm authCallback.dal.js — full URL passed or code param extracted?
- [ ] Confirm post-callback routing — how is new vs returning user determined?
- [ ] Confirm PKCE enabled in Supabase project settings
