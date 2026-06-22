# Governance: SHIELD — Infrastructure and Platform Security Governance

**Command:** `/SHIELD`  
**Authority:** Platform-level security governance — infrastructure, auth config, environment, and deployment  
**Mode:** Read-only audit + findings output  
**Scope in VPORT governance:** Platform-wide concerns that affect all VPORT modules

---

## Responsibility

SHIELD operates at the infrastructure and platform level — above individual modules. It ensures the environment that VPORT dashboard modules run in is correctly configured and secure.

It covers:
- Supabase Auth configuration — JWT expiry, refresh token rotation, email confirmation settings
- RLS global posture — are all tables covered by at least one RLS policy? Any tables with RLS disabled?
- Environment variable hygiene — are secrets properly scoped (server-only vs. client-exposed)?
- Edge Function security — are functions authenticated by default? Is service-role key exposure possible?
- CORS configuration — are allowed origins correctly scoped for each Edge Function?
- Storage bucket policies — are private assets behind auth? Are public buckets intentionally public?
- Supabase Realtime security — are Realtime channels scoped by auth or open to all?
- Deployment pipeline — are production builds free of `zNOTFORPRODUCTION/`, `planning/`, `logan/`, and debug assets?
- Rate limiting — are public endpoints protected against abuse?

## Finding Severity Levels

| Level | Definition | Release Impact |
|---|---|---|
| CRITICAL | Service-role key exposed to client, RLS disabled on sensitive table | Blocks all releases |
| HIGH | Private storage bucket publicly accessible, JWT expiry too long | Blocks release |
| MEDIUM | CORS too permissive, missing rate limit on public endpoint | Address before THOR |
| LOW | Non-sensitive env var exposed, cosmetic config gap | Track, non-blocking |

## Output Location

`zNOTFORPRODUCTION/_ACTIVE/audits/infrastructure/YYYY-MM-DD_shield_platform.md`

## When to Run

At platform onboarding. When any infrastructure configuration changes (Supabase project settings, Edge Function deployment, storage policy changes). Before any major release cycle that introduces new public endpoints.

## Module Coverage

SHIELD is not per-module — it governs the platform that all modules share. Its findings block THOR for all affected modules simultaneously.
