# VCSM Feature Dependency DAG

**Version:** 1.0  
**Generated:** 2026-06-06  
**Source:** FEATURE_IMPORT_MAP.md, BIDIR_DEPENDENCY_DECISION.md  
**Purpose:** Define the intended one-way dependency direction between feature groups. Violations of this DAG are architectural defects.

---

## Intended Dependency Layers

Dependencies must flow **downward** through these layers. An upward import is a violation.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 0 — Platform Primitives                              │
│  auth · identity · actors · legal · media                   │
│  No feature-to-feature imports from this layer              │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layer 0)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — Core Infrastructure                              │
│  notifications · social · block · moderation · upload       │
│  booking · chat                                             │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layers 0–1)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2 — Content System                                   │
│  post · feed · public                                       │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layers 0–2)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3 — Profile / Identity Surface                       │
│  profiles · vport · professional                            │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layers 0–3)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4 — Management / Dashboard                           │
│  dashboard · settings · ads                                 │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layers 0–4)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5 — Discovery / Navigation Surface                   │
│  explore · shell                                            │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (consumes from Layers 0–5)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 6 — App Init / Onboarding                            │
│  initiation · invite · join · wanders · wanderex            │
└─────────────────────────────────────────────────────────────┘
                              ↑
                    (terminal — nothing imports from here)
┌─────────────────────────────────────────────────────────────┐
│  LAYER 7 — Standalone / Isolated                            │
│  vgrid · void · debug · hydration · portfolio · reviews     │
│  ui · analytics                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Intended DAG

Each arrow below represents an allowed import direction. An import in the reverse direction is a violation.

### Platform Primitives (Layer 0)

```
auth      → legal               (registration requires consent)
legal     → auth                (BIDIR — LEGITIMATE, both through adapters)
identity  → [nothing]           (terminal — consumed, never imports features)
actors    → [nothing]           (terminal stub)
media     → [nothing]           (engine adapter — terminal)
```

### Core Infrastructure (Layer 1)

```
notifications → [nothing in Layer 1]
              → auth             (verify session for notification delivery)
              → identity         (resolve actor for notification target)

social        → notifications    (follow/unfollow fire notifications)
              → identity
              → auth

block         → feed             (block invalidates feed cache — BIDIR SAFE)
              → identity
              → social           (block affects social privacy)

moderation    → identity
              → auth

upload        → media
              → identity

booking       → notifications    (booking lifecycle fires notifications)
              → identity
              → media

chat          → identity
              → moderation
              → media
              → block
              → social
```

### Content System (Layer 2)

```
post          → notifications    (comment/reaction/rose fire notifications)
              → media
              → identity
              → moderation
              → upload
              → social

feed          → post             (feed renders post cards — BIDIR SAFE)
              → social           (feed surfaces follow buttons — BIDIR SAFE)
              → block            (block gates feed entries — BIDIR SAFE)
              → notifications    (feed can surface notification indicators)
              → identity

public        → dashboard        (public views use qrcode adapter — BIDIR SAFE)
              → identity
```

### Profile / Identity Surface (Layer 3)

```
profiles      → social           (profile gate, subscriber list — BIDIR SAFE)
              → notifications    (vport reviews fire notifications — BIDIR SAFE)
              → post             (actor profile tab shows posts — BIDIR SAFE)
              → booking          (vport profile booking flow)
              → media
              → identity
              → block
              → upload
              → moderation
              → dashboard        (gas prices — BLOCKED on ARCH-DASH-001)

vport         → settings         (restore vport, creation flow — BIDIR SAFE)
              → identity
              → auth

professional  → settings         (uses settings Card.adapter — VIOLATION)
              → identity
```

### Management / Dashboard (Layer 4)

```
dashboard     → profiles         (BIDIR — violations present, see RISK_REGISTER)
              → settings         (BIDIR — SAFE through adapters + 3 missing adapters)
              → public           (BIDIR — shared model leak, see RISK_REGISTER)
              → media
              → identity
              → upload
              → booking
              → social
              → notifications

settings      → vport            (BIDIR SAFE — both through adapters)
              → social           (DAL violations — see RISK_REGISTER)
              → public           (model import — see RISK_REGISTER)
              → auth
              → identity
              → upload
              → media

ads           → settings         (CSS import violation — see RISK_REGISTER)
              → identity
```

### Discovery / Navigation (Layer 5)

```
explore       → identity
              → social

shell         → profiles         (canonical slug — through adapter — SAFE)
              → identity
              → auth
```

### App Init / Onboarding (Layer 6)

```
initiation    → auth
              → identity
              → social
              → vport

invite        → auth
              → identity

join          → auth
              → identity
              → legal
              → social
              → vport
              → upload

wanders       → public           (VIOLATIONS — controller + model direct access)
              → identity
              → media
              → social
              → upload

wanderex      → booking
              → identity
              → auth
```

---

## Violations — Current DAG Defects

These are confirmed imports that flow against the intended direction or bypass adapter boundaries.

| From | To | Nature | Severity | Ticket |
|---|---|---|---|---|
| `dashboard` | `profiles` (internals) | 11 DAL/controller direct imports | CRITICAL | ARCH-BIDIR-PROFILES-001 |
| `profiles` | `dashboard` (internals) | 7 gas-prices adapter pointing to dashboard internals | HIGH | ARCH-BIDIR-GASPRICES-001 (blocked on ARCH-DASH-001) |
| `profiles` | `booking` (model) | 10 direct model imports bypassing adapter | HIGH | ARCH-BIDIR-MODEL-001 (booking models to shared/) |
| `profiles` | `social` (DAL) | 2 direct DAL imports in controller + test | MEDIUM | ARCH-BIDIR-SOCIAL-001 |
| `dashboard` | `settings` (hooks) | 3 hooks imported without adapter | MEDIUM | ARCH-BIDIR-SETTINGS-001 |
| `settings` | `social` (DAL) | 2 DAL direct imports in controller | MEDIUM | ARCH-BIDIR-SOCIAL-001 |
| `dashboard` | `public` (model) | 1 model import bypassing adapter | LOW | ARCH-BIDIR-MODEL-001 |
| `wanders` | `public` (controller + model) | 2 direct imports into public internals | MEDIUM | Open |
| `ads` | `settings` (CSS) | CSS stylesheet import from settings | LOW | ARCH-BIDIR-CSS-001 |
| `notifications` | `profiles` (CSS) | CSS stylesheet import from profiles | LOW | ARCH-BIDIR-CSS-001 |
| `post` | `profiles` (CSS) | 2 CSS stylesheet imports from profiles | LOW | ARCH-BIDIR-CSS-001 |
| `professional` | `settings` (ui adapter) | Uses Card.adapter from settings — misclassified | LOW | Open |

---

## Intended Cycles (LEGITIMATE bidirectional pairs)

These bidirectional imports are classified as legitimate and must remain at adapter boundaries:

| Pair | Why |
|---|---|
| `auth` ↔ `legal` | Platform primitives — auth requires consent, legal gates on auth |
| `block` ↔ `feed` | Block fires cache invalidation on feed; feed surfaces block action |
| `booking` ↔ `notifications` | Booking lifecycle events dispatch notifications; notifications inbox aggregates bookings |
| `feed` ↔ `post` | Feed is the post container; post has its own feed view |
| `feed` ↔ `social` | Feed surfaces follow buttons; social follow/unfollow invalidates feed cache |
| `notifications` ↔ `post` | Post controllers fire notifications; notifications screen shows post detail |
| `notifications` ↔ `social` | Social follow actions fire notifications; follow request item has action buttons |
| `settings` ↔ `vport` | Settings manages vport ops; vport restore navigates to settings |
| `dashboard` ↔ `settings` | Settings card in dashboard uses settings hooks (adapter additions pending) |
