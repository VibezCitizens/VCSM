# ARCHITECT TRAFFIC ARCHITECTURE MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Traffic Application Summary

**Purpose:** Programmatic SEO directory — acquisition funnel routing to VCSM
**Domain:** traffic.vibezcitizens.com (planned)
**Framework:** Next.js 14 (App Router)
**Data Source:** MIXED — mock data + live DB (answers feature only)
**App Type:** Static generation + server-side read-only + API routes for moderation

---

## Route Architecture

| Route Family | Count | Type | Data Source |
|---|---|---|---|
| / (home) | 1 | Static | Mock |
| /categories | 1 | Static | Mock |
| /directory | 1 | Static | Mock |
| /top-providers | 1 | Static | Mock |
| /[city] | Dynamic | SSG | Mock providers |
| /[city]/[segment] | Dynamic | SSG | Mock providers |
| /[city]/[segment]/[service] | Dynamic | SSG | Mock providers |
| /[city]/[segment]/[service]/[detail] | Dynamic | SSG | Mock providers |
| /[city]/[segment]/[service]/[detail]/[specialty] | Dynamic | SSG | Mock providers |
| /[city]/categories | Dynamic | SSG | Mock |
| /[city]/pro/[providerSlug] | Dynamic | SSG | Mock provider |
| /[city]/top-providers | Dynamic | SSG | Mock providers |
| /answers/[slug] | Dynamic | SSR | Live DB (answers schema) |
| /en/answers/[slug] | Dynamic | SSR | Live DB (answers schema) |
| /es/answers/[slug] | Dynamic | SSR | Live DB (answers schema) |

Total routes: 51

---

## Feature Architecture

| Feature | Nodes | Role | DB Access |
|---|---|---|---|
| Traffic:data | 277 | Data access and providers layer | Mock + provider index view |
| Traffic:app | 174 | Route modules and pages | None direct |
| Traffic:answers | 108 | Q&A content + moderation API | Live DB — answers.answers, answers.questions |
| Traffic:home | — | Home page components | Mock |
| Traffic:categories | — | Category listing | Mock |
| Traffic:providers | — | Provider profile pages | Mock + provider index view |
| Traffic:reviews | — | Review display | Mock |
| Traffic:conversion | — | VCSM deep-link conversion | None |
| Traffic:directories | — | Directory listings | Mock |

---

## Live Database Access (Traffic)

**Tables accessed:** answers.answers, answers.questions
**Access type:** READ + WRITE (moderation API routes)
**Write surfaces:** 58 (answers INSERT, UPDATE; questions UPDATE)

⚠️ Traffic has live DB write access via API routes for content moderation.
These routes require auth verification — they are server-side API routes not protected by client auth.

---

## Conversion Architecture

Traffic → VCSM conversion flow:
1. Visitor lands on /[city]/[segment]/[service] — reads mock provider data
2. Provider card includes deep-link to VCSM (vibezcitizens.com/actor/:actorId/...)
3. TRAZE tracking parameters appended to deep-link
4. VCSM receives traffic with conversion attribution

---

## Deployment Status

| Component | Status |
|---|---|
| Route structure | COMPLETE |
| Mock data | WIRED |
| Live DB (answers) | WIRED |
| Live DB (providers) | NOT WIRED — deployment pending |
| VCSM deep links | WIRED (mock provider IDs) |
| TRAZE tracking | PARTIAL |
| i18n (en/es) | PARTIAL (answers only) |
