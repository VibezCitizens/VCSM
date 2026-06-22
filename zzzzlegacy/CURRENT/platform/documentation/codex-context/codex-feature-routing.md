# Codex Feature Routing

## Source

Built from:

- `CURRENT/CATEGORY_REGISTRY.md`
- `CURRENT/FEATURE_STATUS.md`
- `CURRENT/FEATURE_DOCUMENTATION_INDEX.md`

## Routing Table

| Category Key | Area | CURRENT Path | Source Path | Status |
|---|---|---|---|---|
| actors | Actors | `CURRENT/features/actors` | `apps/VCSM/src/features/actors` | ACTIVE |
| auth | Auth | `CURRENT/features/auth` | `apps/VCSM/src/features/auth` | ACTIVE |
| block | Block | `CURRENT/features/block` | `apps/VCSM/src/features/block` | ACTIVE |
| booking | Booking | `CURRENT/features/booking` | `apps/VCSM/src/features/booking` | ACTIVE |
| chat | Chat | `CURRENT/features/chat` | `apps/VCSM/src/features/chat` | ACTIVE |
| dashboard | Dashboard | `CURRENT/features/dashboard` | `apps/VCSM/src/features/dashboard` | ACTIVE |
| feed | Feed | `CURRENT/features/feed` | `apps/VCSM/src/features/feed` | ACTIVE |
| identity | Identity | `CURRENT/features/identity` | `apps/VCSM/src/features/identity` | ACTIVE |
| invite | Invite | `CURRENT/features/invite` | `apps/VCSM/src/features/invite` | ACTIVE |
| join | Join | `CURRENT/features/join` | `apps/VCSM/src/features/join` | ACTIVE |
| legal | Legal | `CURRENT/features/legal` | `apps/VCSM/src/features/legal` | ACTIVE |
| media | Media | `CURRENT/features/media` | `apps/VCSM/src/features/media` | ACTIVE |
| moderation | Moderation | `CURRENT/features/moderation` | `apps/VCSM/src/features/moderation` | ACTIVE |
| notifications | Notifications | `CURRENT/features/notifications` | `apps/VCSM/src/features/notifications` | ACTIVE |
| onboarding | Onboarding | `CURRENT/features/onboarding` | `apps/VCSM/src/features/onboarding` | ACTIVE |
| portfolio | Portfolio | `CURRENT/features/portfolio` | `apps/VCSM/src/features/portfolio` | PLANNED |
| post | Post | `CURRENT/features/post` | `apps/VCSM/src/features/post` | ACTIVE |
| profiles | Profiles | `CURRENT/features/profiles` | `apps/VCSM/src/features/profiles` | ACTIVE |
| public | Public | `CURRENT/features/public` | `apps/VCSM/src/features/public` | ACTIVE |
| reviews | Reviews | `CURRENT/features/reviews` | `apps/VCSM/src/features/reviews` | PLANNED |
| settings | Settings | `CURRENT/features/settings` | `apps/VCSM/src/features/settings` | ACTIVE |
| social | Social | `CURRENT/features/social` | `apps/VCSM/src/features/social` | ACTIVE |
| upload | Upload | `CURRENT/features/upload` | `apps/VCSM/src/features/upload` | ACTIVE |
| vport | VPort | `CURRENT/features/vport` | `apps/VCSM/src/features/vport` | ACTIVE |
| ads | Ads | no CURRENT feature folder listed | `apps/VCSM/src/features/ads` | ACTIVE |
| explore | Explore | no CURRENT feature folder listed | `apps/VCSM/src/features/explore` | ACTIVE |
| hydration | Hydration | no CURRENT feature folder listed | `apps/VCSM/src/features/hydration` | ACTIVE |
| professional | Professional | no CURRENT feature folder listed | `apps/VCSM/src/features/professional` | ACTIVE |
| void | Void Realm | no CURRENT feature folder listed | `apps/VCSM/src/features/void` | ACTIVE |
| frozen-learning | Frozen Learning | `CURRENT/frozen/learning` | `apps/VCSM/src/learning` | FROZEN |
| frozen-vgrid | Frozen VGrid | `CURRENT/frozen/vgrid` | `apps/VCSM/src/features/vgrid` | FROZEN |
| frozen-wanderex | Frozen Wanderex | `CURRENT/frozen/wanderex` | `apps/VCSM/src/features/wanderex` | FROZEN |
| frozen-wanders | Frozen Wanders | `CURRENT/frozen/wanders` | `apps/VCSM/src/features/wanders` | FROZEN |
| platform-change-intent | Platform Change Intent | `CURRENT/platform/change-intent` | n/a | PLATFORM |
| platform-documentation | Platform Documentation | `CURRENT/platform/documentation` | n/a | PLATFORM |
| platform-native | Platform Native | `CURRENT/platform/native` | n/a | PLATFORM |
| platform-security | Platform Security | `CURRENT/platform/security` | n/a | PLATFORM |
| shared | Shared | `CURRENT/shared` | `engines/` | SHARED |
| service-vport | VPort External Services | `CURRENT/services` | n/a | SERVICE |
| state-store | State Store | `CURRENT/state` | n/a | STATE |
| style-theme | Theme and Design Tokens | `CURRENT/styles` | n/a | STYLE |
| needs-triage | Needs Triage | `CURRENT/NEEDS_TRIAGE` | n/a | TRIAGE |
| needs-triage-alt | Needs Triage Alt | `CURRENT/_NEEDS_TRIAGE` | n/a | TRIAGE |

## Dashboard Category Pattern

Dashboard modules use `dashboard-[module]`, dashboard tabs use `dashboard-tab-[tab]`, and dashboard governance files use `dashboard-gov-[command-or-area]`. Route these to `CURRENT/features/dashboard/modules`, `CURRENT/features/dashboard/tabs`, or `CURRENT/features/dashboard/governance`.

## DR. STRANGE Entry Rule

For active features, DR. STRANGE should read the feature folder entry file listed in `CATEGORY_REGISTRY.md`, usually `CURRENT_STATUS.md` or `README.md`. For frozen features, read `CURRENT/frozen/[feature]/README.md` and `STATUS.md`.

