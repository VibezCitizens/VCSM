# Runtime Feature Index: media

## Metadata
| Field | Value |
|---|---|
| Feature | media |
| CURRENT Folder | CURRENT/features/media |
| Source Folder | apps/VCSM/src/features/media + engines/media |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---|---:|---|
| Controllers | 2 | createMediaAsset.controller.js, softDeleteMediaAsset.controller.js |
| DALs | 3 | mediaAssets.write.dal.js, mediaAssets.softDelete.dal.js, resolveAppId.read.dal.js |
| Hooks | 0 | NONE — headless utility layer; useMediaUpload lives in engines/media |
| Models | 1 | mediaAsset.model.js (SCOPE_MAP + mapUploadResultToMediaAsset + mapMediaAssetRow) |
| Screens | 0 | NONE FOUND |
| Components | 0 | NONE FOUND |
| Adapters | 2 | media.adapter.js (primary boundary), mediaAppId.adapter.js (thin app-id wrapper) |
| Setup | 1 | setup.js (engine transport wiring) |
| Routes | 0 | NONE — consumed by 10 callers via adapter |
| Tests | 0 | NONE FOUND |

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| NONE dedicated | — | — | Headless utility — 10 consumer flows call createMediaAssetController via media.adapter.js after engine upload |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| createMediaAsset.controller.js | features/media/controller/ | INSERT platform.media_assets | PARTIAL — SCOPE_MAP enforces caller scope; ownerActorId caller-supplied; DB RLS is sole ownership gate | MEDIUM |
| mediaAssets.write.dal.js | features/media/dal/ | INSERT platform.media_assets | PARTIAL — column projection hardcoded; no caller bypass | MEDIUM |
| softDeleteMediaAsset.controller.js | features/media/controller/ | UPDATE platform.media_assets (soft delete) | PARTIAL — DB RLS WITH CHECK enforces status='deleted'; currently DB-blocked (Carnage Plan B not applied) | MEDIUM |
| mediaAssets.softDelete.dal.js | features/media/dal/ | UPDATE platform.media_assets | PARTIAL — fixed payload (4 columns only); DB-blocked for owners | MEDIUM |

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| platform.media_assets {public} policy | DB | DB_RLS | TICKET-PLATFORM-RLS-001 OPEN — media_assets_vc_owner_update {public} policy cleanup pending (Carnage Plan C) |
| ownerActorId caller-supplied | features/media/controller/ | OWNERSHIP | VENOM-F2 MITIGATED — DB RLS enforces via vc.actor_owners; no session derivation in controller layer |
| SCOPE_MAP governance | features/media/model/ | OWNERSHIP | IRONMAN OPEN — no documented approver for new SCOPE_MAP entries |
| resolveVcsmAppIdDAL cache | features/media/dal/ | OBSERVABILITY | Module-level cache — hit vs miss unobservable at runtime (LOKI finding, non-blocking) |
| IIFE swallow pattern | 4 external callers (flyerEditor, recordPostMedia, wanders, etc.) | SILENT_FAILURE | createMediaAssetController called in fire-and-forget IIFE; write failures swallowed silently in production |

## Consumer Flow Map
| Consumer | Source Path | Scope Used | Import Path |
|---|---|---|---|
| useProfileUploads (settings) | features/settings/profile/hooks/ | user_avatar, user_banner, vport_avatar, vport_banner | @/features/media/adapters/media.adapter |
| recordChatAttachment (chat) | features/chat/conversation/controller/ | chat_attachment | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| submitCreateVport (vport) | features/vport/controller/ | vport_creation_avatar | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| addPortfolioMediaWithRecord (dashboard/vport) | features/dashboard/vport/dashboard/cards/portfolio/controller/ | portfolio_media | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| flyerEditor.controller (flyerBuilder) | features/dashboard/flyerBuilder/controller/ | design_asset | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| designStudio.assetsExports.controller (flyerBuilder) | features/dashboard/flyerBuilder/designStudio/controller/ | design_asset | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| saveVportActorMenuItem (profiles/vport/menu) | features/profiles/kinds/vport/controller/menu/ | menu_item_photo | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| publishWandersFromBuilder (wanders) | features/wanders/core/controllers/ | wanders_card | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| cards.controller (wanders) | features/wanders/core/controllers/ | wanders_card | @/features/media/adapters/media.adapter + mediaAppId.adapter |
| recordPostMedia (upload) | features/upload/controller/ | vibe_post | @/features/media/adapters/media.adapter + mediaAppId.adapter |

## Engine Dependency Map
| Engine | Import | Wired At | Purpose |
|---|---|---|---|
| engines/media (@media) | configureMediaEngine | setup.js (startup) | Injects Cloudflare R2 upload + publicUrl transport functions into engine. External callers use uploadMediaController and useMediaUpload directly from @media. |

## Open Tickets
| Ticket | Status | Severity | Scope |
|---|---|---|---|
| TICKET-PLATFORM-RLS-001 | OPEN | MEDIUM | platform.media_assets {public} policy cleanup (Carnage Plan C) |
| Carnage Plan B | DEFERRED | MEDIUM | Soft-delete enablement migration — schema present, DB blocks owners |
| SCOPE_MAP approver governance | OPEN | LOW | No documented approver for new SCOPE_MAP entries (IRONMAN gap) |
| DF-05 | OPEN | LOW | media.adapter.js undocumented barrel — append to vcsm.dal.media.md |

## Runtime Risk Summary

Media is a MEDIUM-tier headless utility (9 feature files + sealed engine) with no routes or screens. All 10 consumer flows across the platform write through a single `createMediaAssetController` path, making this a high-leverage but well-bounded module. THOR gate cleared RELEASE_READY (2026-05-19). Adapter boundary is fully enforced — 0 direct DAL/controller imports from outside the feature. The SCOPE_MAP governance gap (no documented approver) and TICKET-PLATFORM-RLS-001 ({public} policy) are the primary open risks. Soft-delete is schema-supported but DB-blocked. Zero test coverage is the largest governance gap after the DB migration deferrals.

## Recommended Next Command

CARNAGE — apply Plans B/C for soft-delete enablement and platform.media_assets {public} policy cleanup (TICKET-PLATFORM-RLS-001). After Carnage: re-run VENOM. Also: SPIDER-MAN for test coverage.

## Recommended Next Ticket

TICKET-PLATFORM-RLS-001 — execute platform.media_assets {public} policy cleanup migration (Carnage Plan B+C). Document SCOPE_MAP approver process to close IRONMAN governance gap.
