# Runtime Feature Index: professional

## Metadata
| Field | Value |
|---|---|
| Feature | professional |
| CURRENT Folder | CURRENT/features/professional |
| Source Folder | apps/VCSM/src/features/professional |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 1 | `listProfessionalBriefings.controller.js` |
| DALs | 1 | `professionalBriefings.read.dal.js` |
| Hooks | 2 | `useProfessionalBriefings.js`, `useEnterpriseWorkspace.js` |
| Models | 2 | `professionalBriefing.model.js`, `buildEnterpriseView.model.js` |
| Screens | 6 | `ProfessionalAccessScreen.jsx`, `ProfessionalBriefingsScreen.jsx`, `NurseHomeScreen.jsx`, `NurseHomeScreenView.jsx`, `FacilityInsightsTabView.jsx`, `HousingTabView.jsx` |
| Components | 10 | `BriefingsFilters.jsx`, `BriefingsList.jsx`, `BriefingsSummaryCards.jsx`, `EnterpriseWorkspace.jsx`, `enterprisePanels.jsx`, `enterpriseRows.jsx`, `AddForm.jsx`, `AddHousingExperienceForm.jsx`, `AddFacilityInsightForm.jsx`, `HousingNoteCard.jsx`, `HousingNotesList.jsx`, `HousingEmptyState.jsx`, `HousingCategoryBadge.jsx`, `CitySelector.jsx`, `NurseAddMenu.jsx`, `NurseWorkspaceTabs.jsx` |
| Config | 2 | `professionCatalog.config.js`, `housingCategories.config.js` |
| Storage | 1 | `professionalAccess.storage.js` (localStorage adapter) |
| Data | 1 | `enterpriseSeed.data.js` (hardcoded seed — no DB) |
| Routes | 2 | `/professional-access`, `/professional/briefings` |
| Tests | 0 | None found |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/professional-access` | `screens/ProfessionalAccessScreen.jsx` | Auth (release flag only) | No identity guard at screen level; relies solely on `releaseFlags.professionalWorkspace` in router |
| `/professional/briefings` | `briefings/screen/ProfessionalBriefingsScreen.jsx` | Auth | Redirects to `/feed` if `!actorId`; identity check present via `useIdentity` |
| `NurseHomeScreen` (embedded) | `professional-nurse/screens/NurseHomeScreen.jsx` | Auth (prop-only gate) | Only checks `profession !== 'nurse'` prop; no identity-level gate |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| Mark briefings seen | `briefings/dal/professionalBriefings.read.dal.js` — `dalMarkProfessionalBriefingsSeen` | UPDATE `vc.notifications` set `is_seen: true` | PARTIAL — scoped by `recipient_actor_id` + `notificationIds` array from client | MEDIUM — `notificationIds` is client-supplied; RLS must enforce cross-actor notification isolation |
| Add housing note | `professional-nurse/housing/ui/AddForm.jsx` → `AddHousingExperienceForm.jsx` | React state only — no DB write | NO — in-memory prototype | LOW (no persistence, no attack surface currently) |
| Add facility note | `professional-nurse/facility/ui/AddFacilityInsightForm.jsx` | React state only — no DB write | NO — in-memory prototype | LOW (no persistence, no attack surface currently) |
| Workspace prefs | `core/storage/professionalAccess.storage.js` | localStorage write | NO — localStorage keyed by professionKey only | LOW (client-only storage) |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `ProfessionalAccessScreen` | `screens/ProfessionalAccessScreen.jsx` | MEDIUM — no identity guard at screen level | Route gated by `releaseFlags.professionalWorkspace` only; no `useIdentity` check |
| `dalMarkProfessionalBriefingsSeen` | `briefings/dal/professionalBriefings.read.dal.js` | MEDIUM — client-supplied notification ID array applied to UPDATE | `notificationIds` from client; RLS on `vc.notifications` must enforce actor scope — not verified by source scan |
| `dalListProfessionalBriefings` | `briefings/dal/professionalBriefings.read.dal.js` | LOW-MEDIUM — reads all notifications for `recipient_actor_id` | Supabase `.eq('recipient_actor_id', recipientActorId)` present; relies on RLS for enforcement |
| `briefings` `linkPath` navigation | `briefings/view/ProfessionalBriefingsScreenView.jsx` | LOW — `item.linkPath` comes from `vc.notifications.link_path` | Client navigates to DB-supplied path; not sanitised before `navigate(item.linkPath)` — open redirect risk if link_path is attacker-controlled |
