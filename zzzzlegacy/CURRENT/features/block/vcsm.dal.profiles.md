# VCSM DAL — `profiles`

_Generated:_ 2026-05-11  
_Updated:_ 2026-05-11 (ARCHITECT live audit — dead DAL files, stub DALs, re-export shim layer, bypassed review write path, layer violations; pipeline trace — model/controller/hook/screen per domain)  
_Source:_ ARCHITECT static scan + manual verification · `apps/VCSM/src/features/profiles/`  
_Confidence:_ STATICALLY\_TRACED + MANUALLY\_VERIFIED

---

## Summary

| Item | Detail |
|---|---|
| DAL files | 81 (static count — includes dead/stub/shim files) |
| Exported functions | 127 |
| Tables accessed | 36 |
| RPCs called | 9 |
| Risk findings | 12 (6 original + 6 new from live audit) |
| Release flag | None — always active |
| Feature status | LIVE — profiles, vport dashboards, gas, menu, content, reviews, services, friends, locksmith |
| Dead code | 7 confirmed dead or stub DAL files (see ARCHITECT audit below) |
| Screen-nested shims | 8 re-export shims + 1 misplaced utility — all consumed only by dev/diagnostics |

## DAL Files

### `actorOwners.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalReadActorOwnerRow` | `read` | `actor_owners` |

### `blockedActorSet.read.dal.js`

**Path:** `features/profiles/dal/friends/blockedActorSet.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listBlockedActorRowsForCandidatesDAL` | `read` | `blocks` |

### `checkActorOwnership.dal.js`

**Path:** `features/profiles/dal/checkActorOwnership.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `checkActorOwnershipDAL` | `read` | `actor_owners` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

### `createVportActorMenuCategory.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/createVportActorMenuCategory.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createVportActorMenuCategoryDAL` | `read` · `insert` | `menu_categories`, `profiles` |

### `createVportActorMenuItem.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/createVportActorMenuItem.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createVportActorMenuItemDAL` | `read` · `insert` | `profiles`, `menu_items` |

### `createVportContentPage.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/createVportContentPage.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createVportContentPageDAL` | `read` · `insert` | `profiles`, `content_pages` |
| `readContentPageSlugsByPrefixDAL` | `read` · `insert` | `profiles`, `content_pages` |

### `createVportMenuItemMedia.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/createVportMenuItemMedia.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createVportMenuItemMediaDAL` | `read` · `insert` | `profiles`, `menu_item_media` |

### `deleteVportActorMenuCategory.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/deleteVportActorMenuCategory.dal.js`  
**Operations:** `delete`  

**Exported functions:**

| `deleteVportActorMenuCategoryDAL` | `delete` | `menu_categories` |

### `deleteVportActorMenuItem.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/deleteVportActorMenuItem.dal.js`  
**Operations:** `delete`  

**Exported functions:**

| `deleteVportActorMenuItemDAL` | `delete` | `menu_items` |

### `deleteVportContentPage.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/deleteVportContentPage.dal.js`  
**Operations:** `delete`  

**Exported functions:**

| `deleteVportContentPageDAL` | `delete` | `content_pages` |

### `fetchPostsForActor.dal.js`

**Path:** `features/profiles/dal/post/fetchPostsForActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchPostsForActorDAL` | `read` | `post_media`, `profiles`, `posts`, `actors`, `post_mentions` |

> **🔴 CRITICAL** — Imports UI, hooks, or components — DALs must be pure data-access layer.

### `fetchPostsForActor.dal.js`

**Path:** `features/profiles/screens/views/tabs/post/dal/fetchPostsForActor.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `fetchPostsForActor` | `unknown` | — |

### `friendRanks.reconcile.dal.js`

**Path:** `features/profiles/dal/friends/friendRanks.reconcile.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `reconcileFriendRanks` | `rpc` | —`save_friend_ranks`, `get_friend_ranks` |

### `friendRanks.reconcile.dal.js`

**Path:** `features/profiles/screens/views/tabs/friends/dal/friendRanks.reconcile.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `friendRanks.reconcile` | `unknown` | — |

### `friendRanks.write.dal.js`

**Path:** `features/profiles/dal/friends/friendRanks.write.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `saveFriendRanks` | `rpc` | —`save_friend_ranks` |

### `friendRanks.write.dal.js`

**Path:** `features/profiles/screens/views/tabs/friends/dal/friendRanks.write.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `friendRanks.write` | `unknown` | — |

### `friends.read.dal.js`

**Path:** `features/profiles/dal/friends/friends.read.dal.js`  
**Operations:** `read` · `rpc`  

**Exported functions:**

| `fetchFollowGraph` | `read` · `rpc` | —`actors`, `actor_follows`, `get_friend_ranks` |
| `readActiveFollowRows` | `read` · `rpc` | —`actors`, `actor_follows`, `get_friend_ranks` |
| `readActorRows` | `read` · `rpc` | —`actors`, `actor_follows`, `get_friend_ranks` |
| `readFriendRankRows` | `read` · `rpc` | —`actors`, `actor_follows`, `get_friend_ranks` |

### `friends.read.dal.js`

**Path:** `features/profiles/screens/views/tabs/friends/dal/friends.read.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `friends.read` | `unknown` | — |

### `listPostCommentsCount.dal.js`

**Path:** `features/profiles/dal/photos/listPostCommentsCount.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listPostCommentsCount` | `read` | `post_comments` |

### `listPostCommentsCount.dal.js`

**Path:** `features/profiles/screens/views/tabs/photos/dal/listPostCommentsCount.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `listPostCommentsCount` | `unknown` | — |

### `listPostReactions.dal.js`

**Path:** `features/profiles/dal/photos/listPostReactions.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listPostReactions` | `read` | `post_reactions` |

### `listPostReactions.dal.js`

**Path:** `features/profiles/screens/views/tabs/photos/dal/listPostReactions.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `listPostReactions` | `unknown` | — |

### `listPostRoseCount.dal.js`

**Path:** `features/profiles/dal/photos/listPostRoseCount.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listPostRoseCount` | `read` | `post_rose_gifts` |

### `listPostRoseCount.dal.js`

**Path:** `features/profiles/screens/views/tabs/photos/dal/listPostRoseCount.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `listPostRoseCount` | `unknown` | — |

### `listVportActorMenuCategories.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/listVportActorMenuCategories.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportActorMenuCategoriesDAL` | `read` | `menu_categories`, `profiles` |

### `listVportActorMenuItems.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/listVportActorMenuItems.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportActorMenuItemsDAL` | `read` | `profiles`, `menu_items` |

### `listVportContentPages.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/listVportContentPages.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `listVportContentPagesDAL` | `read` | `content_pages` |

### `listVportPublicContentPages.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/listVportPublicContentPages.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateVportPublicContentCache` | `read` | `content_pages` |
| `listVportPublicContentPagesDAL` | `read` | `content_pages` |

### `locksmithPortfolioDetails.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/locksmithPortfolioDetails.write.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `dalUpsertLocksmithPortfolioDetail` | `read` · `upsert` | `locksmith_portfolio_details` |

### `locksmithServiceAreas.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalListLocksmithServiceAreas` | `read` | `locksmith_service_areas` |

### `locksmithServiceAreas.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceAreas.write.dal.js`  
**Operations:** `read` · `insert` · `update` · `delete` · `upsert`  

**Exported functions:**

| `dalDeleteLocksmithServiceArea` | `read` · `insert` · `update` · `delete` · `upsert` | `locksmith_service_areas` |
| `dalInsertLocksmithServiceArea` | `read` · `insert` · `update` · `delete` · `upsert` | `locksmith_service_areas` |
| `dalUpdateLocksmithServiceArea` | `read` · `insert` · `update` · `delete` · `upsert` | `locksmith_service_areas` |
| `dalUpsertLocksmithServiceArea` | `read` · `insert` · `update` · `delete` · `upsert` | `locksmith_service_areas` |

### `locksmithServiceDetails.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalGetLocksmithServiceDetail` | `read` | `locksmith_service_details` |
| `dalListLocksmithServiceDetails` | `read` | `locksmith_service_details` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

### `locksmithServiceDetails.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js`  
**Operations:** `read` · `delete` · `upsert`  

**Exported functions:**

| `dalDeleteLocksmithServiceDetail` | `read` · `delete` · `upsert` | `locksmith_service_details` |
| `dalInsertLocksmithServiceDetailDefaults` | `read` · `delete` · `upsert` | `locksmith_service_details` |
| `dalUpsertLocksmithServiceDetail` | `read` · `delete` · `upsert` | `locksmith_service_details` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

### `readActorIdByUsername.dal.js`

**Path:** `features/profiles/dal/readActorIdByUsername.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorIdByUsername` | `read` | `actor_directory` |

### `readActorKind.dal.js`

**Path:** `features/profiles/dal/readActorKind.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `readActorKindDAL` | `unknown` | — |

### `readActorPosts.dal.js`

**Path:** `features/profiles/dal/readActorPosts.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readActorPostsDAL` | `read` | `posts` |

### `readActorProfile.dal.js`

**Path:** `features/profiles/dal/readActorProfile.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateActorProfileCache` | `read` | `actors`, `profiles` |
| `readActorProfileDAL` | `read` | `actors`, `profiles` |

> **🟡 MEDIUM** — Imports from another feature's DAL — cross-feature access must go through adapters.

### `readActorSeoData.dal.js`

**Path:** `features/profiles/dal/readActorSeoData.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateActorDirectoryCache` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `invalidateActorSeoViewCache` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `invalidateVportCategoryCache` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `invalidateVportProfileSeoCache` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `invalidateVportPublicDetailsSeoCache` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `readActorDirectoryRowDAL` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `readActorSeoViewDAL` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `readVportPrimaryCategoryDAL` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `readVportProfileByActorDAL` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |
| `readVportPublicDetailsForSeoDAL` | `read` | `profile_public_details`, `public_actor_seo_v`, `profiles`, `actors`, `profile_categories` |

### `readActorType.dal.js`

**Path:** `features/profiles/dal/readActorType.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateActorTypeCache` | `read` | `actors`, `profile_categories` |
| `readActorTypeDAL` | `read` | `actors`, `profile_categories` |

### `readActorVibeTags.dal.js`

**Path:** `features/profiles/dal/tags/readActorVibeTags.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateActorTagsCache` | `read` | `vibe_tags`, `vibe_actor_tags` |
| `readActorSelectedVibeTagKeysDAL` | `read` | `vibe_tags`, `vibe_actor_tags` |
| `readVibeTagCatalogByKeysDAL` | `read` | `vibe_tags`, `vibe_actor_tags` |

### `readActorVibeTags.dal.js`

**Path:** `features/profiles/screens/views/tabs/tags/dal/readActorVibeTags.dal.js`  
**Operations:** `unknown`  
**Note:** Duplicate — same logic exists in `features/profiles/dal/` (screen-nested copy)  

**Exported functions:**

| `readActorVibeTags` | `unknown` | — |

### `readFollowState.dal.js`

**Path:** `features/profiles/dal/readFollowState.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readFollowStateDAL` | `read` | `actor_follows` |

### `readPostMediaByPostIds.dal.js`

**Path:** `features/profiles/dal/readPostMediaByPostIds.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readPostMediaByPostIdsDAL` | `read` | `post_media` |

### `readPostReactions.dal.js`

**Path:** `features/profiles/dal/readPostReactions.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `readPostReactionsDAL` | `unknown` | — |

### `readPostRoseCounts.dal.js`

**Path:** `features/profiles/dal/readPostRoseCounts.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `readPostRoseCountsDAL` | `unknown` | — |

### `readVportActorIdByVportId.dal.js`

**Path:** `features/profiles/kinds/vport/dal/readVportActorIdByVportId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportActorIdByVportIdDAL` | `read` | `actors` |

### `readVportActorMenuCategories.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/readVportActorMenuCategories.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportActorMenuCategoriesDAL` | `read` | `menu_categories` |
| `readVportActorMenuCategoryDAL` | `read` | `menu_categories` |

### `readVportActorMenuItems.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/readVportActorMenuItems.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportActorMenuItemDAL` | `read` | `menu_items` |

### `readVportContentPage.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/readVportContentPage.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportContentPageDAL` | `read` | `content_pages` |

> **🟠 HIGH** — Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

### `readVportPublicContentPage.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/readVportPublicContentPage.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportPublicContentPageDAL` | `read` | `content_pages` |

### `readVportRatesByActor.dal.js`

**Path:** `features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateRatesCache` | `read` | `rates`, `profiles` |
| `readVportRatesByActorDal` | `read` | `rates`, `profiles` |

### `readVportServiceAddonsByActor.dal.js`

**Path:** `features/profiles/kinds/vport/dal/services/readVportServiceAddonsByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportServiceAddonsByActor` | `read` | `service_addons`, `profiles` |

### `readVportServiceCatalogByType.dal.js`

**Path:** `features/profiles/kinds/vport/dal/services/readVportServiceCatalogByType.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportServiceCatalogByType` | `read` | `service_catalog` |

### `readVportServicesByActor.dal.js`

**Path:** `features/profiles/kinds/vport/dal/services/readVportServicesByActor.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportServicesByActor` | `read` | `services`, `profiles` |

### `readVportType.dal.js`

**Path:** `features/profiles/dal/readVportType.dal.js`  
**Operations:** `unknown`  

**Exported functions:**

| `readVportTypeDAL` | `unknown` | — |

### `readVportTypeByActorId.dal.js`

**Path:** `features/profiles/kinds/vport/dal/services/readVportTypeByActorId.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `readVportTypeByActorId` | `read` | `actors`, `profile_categories` |

### `resolveActorSlug.dal.js`

**Path:** `features/profiles/dal/resolveActorSlug.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `invalidateSlugResolutionCache` | `read` | `actors`, `profiles`, `actor_directory` |
| `resolveActorBySlugOrUsernameDAL` | `read` | `actors`, `profiles`, `actor_directory` |

### `reviewTarget.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/review/reviewTarget.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `dalReadReviewTargetActor` | `read` | `actors` |

### `subscribersCount.dal.js`

**Path:** `features/profiles/kinds/vport/dal/subscribersCount.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `dalCountSubscribers` | `rpc` | —`count_subscribers` |
| `invalidateSubscriberCount` | `rpc` | —`count_subscribers` |

### `subscribersList.dal.js`

**Path:** `features/profiles/kinds/vport/dal/subscribersList.dal.js`  
**Operations:** `rpc`  

**Exported functions:**

| `dalListSubscribers` | `rpc` | —`list_subscribers` |

### `toggleVportContentPagePublish.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/toggleVportContentPagePublish.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `toggleVportContentPagePublishDAL` | `read` · `update` | `content_pages` |

### `updateVportActorMenuCategory.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/updateVportActorMenuCategory.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateVportActorMenuCategoryDAL` | `read` · `update` | `menu_categories` |

### `updateVportActorMenuItem.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/updateVportActorMenuItem.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateVportActorMenuItemDAL` | `read` · `update` | `menu_items` |

### `updateVportContentPage.dal.js`

**Path:** `features/profiles/kinds/vport/dal/content/updateVportContentPage.dal.js`  
**Operations:** `read` · `update`  

**Exported functions:**

| `updateVportContentPageDAL` | `read` · `update` | `content_pages` |

### `upsertVportRate.dal.js`

**Path:** `features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertVportRateDal` | `read` · `upsert` | `rates`, `profiles` |

### `upsertVportServicesByActor.dal.js`

**Path:** `features/profiles/kinds/vport/dal/services/upsertVportServicesByActor.dal.js`  
**Operations:** `read` · `upsert`  

**Exported functions:**

| `upsertVportServicesByActorDal` | `read` · `upsert` | `services`, `profiles` |

### `vportBarbershopPost.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `hasRecentBarbershopHoursPostDAL` | `read` | `profiles`, `posts` |
| `hasRecentBarbershopPortfolioPostDAL` | `read` | `profiles`, `posts` |
| `resolveVportBarbershopNameDAL` | `read` | `profiles`, `posts` |

### `vportExchangeRatePost.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/exchange/vportExchangeRatePost.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `hasRecentExchangeRatePostDAL` | `read` | `profiles`, `posts` |
| `resolveVportExchangeNameDAL` | `read` | `profiles`, `posts` |

### `vportFuelPriceHistory.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPriceHistory.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createVportFuelPriceHistoryDAL` | `read` · `insert` | `fuel_price_history`, `profiles` |

### `vportFuelPricePost.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPricePost.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `hasRecentFuelPricePostDAL` | `read` | `profiles`, `posts` |
| `resolveVportStationNameDAL` | `read` | `profiles`, `posts` |

### `vportFuelPriceReviews.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPriceReviews.write.dal.js`  
**Operations:** `read` · `insert` · `update`  

**Exported functions:**

| `createFuelPriceSubmissionReviewDAL` | `read` · `insert` · `update` | `fuel_price_submissions`, `fuel_price_submission_reviews` |
| `markFuelPriceSubmissionReviewAppliedDAL` | `read` · `insert` · `update` | `fuel_price_submissions`, `fuel_price_submission_reviews` |
| `updateFuelPriceSubmissionStatusDAL` | `read` · `insert` · `update` | `fuel_price_submissions`, `fuel_price_submission_reviews` |

### `vportFuelPriceSubmissions.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchFuelPriceSubmissionByIdDAL` | `read` | `profiles`, `fuel_price_submissions` |
| `fetchPendingFuelPriceSubmissionsDAL` | `read` | `profiles`, `fuel_price_submissions` |

### `vportFuelPriceSubmissions.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPriceSubmissions.write.dal.js`  
**Operations:** `read` · `insert`  

**Exported functions:**

| `createFuelPriceSubmissionDAL` | `read` · `insert` | `profiles`, `fuel_price_submissions` |

### `vportFuelPrices.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPrices.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchVportFuelPricesDAL` | `read` | `fuel_prices`, `profiles` |
| `invalidateFuelPriceCache` | `read` | `fuel_prices`, `profiles` |

### `vportFuelPrices.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportFuelPrices.write.dal.js`  
**Operations:** `read` · `update` · `upsert`  

**Exported functions:**

| `resolveActorIdFromProfileId` | `read` · `update` · `upsert` | `fuel_prices`, `profiles` |
| `updateFuelPriceUnitForActorDAL` | `read` · `update` · `upsert` | `fuel_prices`, `profiles` |
| `upsertVportFuelPriceDAL` | `read` · `update` · `upsert` | `fuel_prices`, `profiles` |

### `vportLocksmithPost.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/locksmith/vportLocksmithPost.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `hasRecentLocksmithHoursPostDAL` | `read` | `profiles`, `posts` |
| `hasRecentLocksmithPortfolioPostDAL` | `read` | `profiles`, `posts` |
| `hasRecentLocksmithServiceAreaPostDAL` | `read` | `profiles`, `posts` |
| `resolveVportLocksmithNameDAL` | `read` | `profiles`, `posts` |

### `vportMenuPost.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/menu/vportMenuPost.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `hasRecentMenuUpdatePostDAL` | `read` | `profiles`, `posts` |
| `resolveVportRestaurantNameDAL` | `read` | `profiles`, `posts` |

### `vportPublicDetails.read.dal.js`

**Path:** `features/profiles/dal/vportPublicDetails.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchVportPublicDetailsByActorId` | `read` | `profiles` |

### `vportReviewAuthors.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/review/vportReviewAuthors.read.dal.js`  
**Operations:** `read` · `rpc`  

**Exported functions:**

| `dalGetReviewAuthorCards` | `read` · `rpc` | —`actors`, `profiles`, `actor_directory`, `get_review_author_card` |
| `dalListActorCardsByActorIds` | `read` · `rpc` | —`actors`, `profiles`, `actor_directory`, `get_review_author_card` |

### `vportReviews.write.dal.js`

**Path:** `features/profiles/kinds/vport/dal/review/vportReviews.write.dal.js`  
**Operations:** `read` · `insert` · `update` · `upsert`  

**Exported functions:**

| `dalInsertVportReviewRow` | `read` · `insert` · `update` · `upsert` | `review_dimension_ratings`, `reviews`, `review_dimensions` |
| `dalSoftDeleteVportReview` | `read` · `insert` · `update` · `upsert` | `review_dimension_ratings`, `reviews`, `review_dimensions` |
| `dalUpdateVportReviewBody` | `read` · `insert` · `update` · `upsert` | `review_dimension_ratings`, `reviews`, `review_dimensions` |
| `dalUpsertVportReviewRatings` | `read` · `insert` · `update` · `upsert` | `review_dimension_ratings`, `reviews`, `review_dimensions` |

### `vportStationPriceSettings.read.dal.js`

**Path:** `features/profiles/kinds/vport/dal/gas/vportStationPriceSettings.read.dal.js`  
**Operations:** `read`  

**Exported functions:**

| `fetchVportStationPriceSettingsDAL` | `read` | `profiles`, `station_price_settings` |

---

## Tables Accessed

| Table | Operations | Via Functions |
|---|---|---|
| `actor_directory` | READ | `invalidateSlugResolutionCache`, `readActorIdByUsername`, `resolveActorBySlugOrUsernameDAL` |
| `actor_follows` | READ | `readFollowStateDAL` |
| `actor_owners` | READ | `checkActorOwnershipDAL`, `dalReadActorOwnerRow` |
| `actors` | READ | `dalReadReviewTargetActor`, `fetchPostsForActorDAL`, `invalidateActorDirectoryCache`, `invalidateActorProfileCache`, `invalidateActorSeoViewCache`, `invalidateActorTypeCache`, `invalidateSlugResolutionCache`, `invalidateVportCategoryCache`, `invalidateVportProfileSeoCache`, `invalidateVportPublicDetailsSeoCache`, `readActorDirectoryRowDAL`, `readActorProfileDAL`, `readActorSeoViewDAL`, `readActorTypeDAL`, `readVportActorIdByVportIdDAL`, `readVportPrimaryCategoryDAL`, `readVportProfileByActorDAL`, `readVportPublicDetailsForSeoDAL`, `readVportTypeByActorId`, `resolveActorBySlugOrUsernameDAL` |
| `blocks` | READ | `listBlockedActorRowsForCandidatesDAL` |
| `content_pages` | DELETE, INSERT, READ, UPDATE | `createVportContentPageDAL`, `deleteVportContentPageDAL`, `invalidateVportPublicContentCache`, `listVportContentPagesDAL`, `listVportPublicContentPagesDAL`, `readContentPageSlugsByPrefixDAL`, `readVportContentPageDAL`, `readVportPublicContentPageDAL`, `toggleVportContentPagePublishDAL`, `updateVportContentPageDAL` |
| `fuel_price_history` | INSERT | `createVportFuelPriceHistoryDAL` |
| `fuel_price_submission_reviews` | UPDATE | `createFuelPriceSubmissionReviewDAL`, `markFuelPriceSubmissionReviewAppliedDAL`, `updateFuelPriceSubmissionStatusDAL` |
| `fuel_price_submissions` | INSERT, READ, UPDATE | `createFuelPriceSubmissionDAL`, `createFuelPriceSubmissionReviewDAL`, `fetchFuelPriceSubmissionByIdDAL`, `fetchPendingFuelPriceSubmissionsDAL`, `markFuelPriceSubmissionReviewAppliedDAL`, `updateFuelPriceSubmissionStatusDAL` |
| `fuel_prices` | READ, UPSERT | `fetchVportFuelPricesDAL`, `invalidateFuelPriceCache`, `resolveActorIdFromProfileId`, `updateFuelPriceUnitForActorDAL`, `upsertVportFuelPriceDAL` |
| `locksmith_portfolio_details` | UPSERT | `dalUpsertLocksmithPortfolioDetail` |
| `locksmith_service_areas` | DELETE, READ | `dalDeleteLocksmithServiceArea`, `dalInsertLocksmithServiceArea`, `dalListLocksmithServiceAreas`, `dalUpdateLocksmithServiceArea`, `dalUpsertLocksmithServiceArea` |
| `locksmith_service_details` | DELETE, READ | `dalDeleteLocksmithServiceDetail`, `dalGetLocksmithServiceDetail`, `dalInsertLocksmithServiceDetailDefaults`, `dalListLocksmithServiceDetails`, `dalUpsertLocksmithServiceDetail` |
| `menu_categories` | DELETE, INSERT, READ, UPDATE | `createVportActorMenuCategoryDAL`, `deleteVportActorMenuCategoryDAL`, `listVportActorMenuCategoriesDAL`, `readVportActorMenuCategoriesDAL`, `readVportActorMenuCategoryDAL`, `updateVportActorMenuCategoryDAL` |
| `menu_item_media` | INSERT | `createVportMenuItemMediaDAL` |
| `menu_items` | DELETE, INSERT, READ, UPDATE | `createVportActorMenuItemDAL`, `deleteVportActorMenuItemDAL`, `listVportActorMenuItemsDAL`, `readVportActorMenuItemDAL`, `updateVportActorMenuItemDAL` |
| `post_comments` | READ | `listPostCommentsCount` |
| `post_media` | READ | `fetchPostsForActorDAL`, `readPostMediaByPostIdsDAL` |
| `post_mentions` | READ | `fetchPostsForActorDAL` |
| `post_reactions` | READ | `listPostReactions` |
| `post_rose_gifts` | READ | `listPostRoseCount` |
| `posts` | READ | `fetchPostsForActorDAL`, `hasRecentBarbershopHoursPostDAL`, `hasRecentBarbershopPortfolioPostDAL`, `hasRecentExchangeRatePostDAL`, `hasRecentFuelPricePostDAL`, `hasRecentLocksmithHoursPostDAL`, `hasRecentLocksmithPortfolioPostDAL`, `hasRecentLocksmithServiceAreaPostDAL`, `hasRecentMenuUpdatePostDAL`, `readActorPostsDAL`, `resolveVportBarbershopNameDAL`, `resolveVportExchangeNameDAL`, `resolveVportLocksmithNameDAL`, `resolveVportRestaurantNameDAL`, `resolveVportStationNameDAL` |
| `profile_categories` | READ | `invalidateActorDirectoryCache`, `invalidateActorSeoViewCache`, `invalidateActorTypeCache`, `invalidateVportCategoryCache`, `invalidateVportProfileSeoCache`, `invalidateVportPublicDetailsSeoCache`, `readActorDirectoryRowDAL`, `readActorSeoViewDAL`, `readActorTypeDAL`, `readVportPrimaryCategoryDAL`, `readVportProfileByActorDAL`, `readVportPublicDetailsForSeoDAL`, `readVportTypeByActorId` |
| `profile_public_details` | READ | `invalidateActorDirectoryCache`, `invalidateActorSeoViewCache`, `invalidateVportCategoryCache`, `invalidateVportProfileSeoCache`, `invalidateVportPublicDetailsSeoCache`, `readActorDirectoryRowDAL`, `readActorSeoViewDAL`, `readVportPrimaryCategoryDAL`, `readVportProfileByActorDAL`, `readVportPublicDetailsForSeoDAL` |
| `profiles` | INSERT, READ, UPSERT | `createFuelPriceSubmissionDAL`, `createVportActorMenuCategoryDAL`, `createVportActorMenuItemDAL`, `createVportContentPageDAL`, `createVportFuelPriceHistoryDAL`, `createVportMenuItemMediaDAL`, `fetchFuelPriceSubmissionByIdDAL`, `fetchPendingFuelPriceSubmissionsDAL`, `fetchPostsForActorDAL`, `fetchVportFuelPricesDAL`, `fetchVportPublicDetailsByActorId`, `fetchVportStationPriceSettingsDAL`, `hasRecentBarbershopHoursPostDAL`, `hasRecentBarbershopPortfolioPostDAL`, `hasRecentExchangeRatePostDAL`, `hasRecentFuelPricePostDAL`, `hasRecentLocksmithHoursPostDAL`, `hasRecentLocksmithPortfolioPostDAL`, `hasRecentLocksmithServiceAreaPostDAL`, `hasRecentMenuUpdatePostDAL`, `invalidateActorDirectoryCache`, `invalidateActorProfileCache`, `invalidateActorSeoViewCache`, `invalidateFuelPriceCache`, `invalidateRatesCache`, `invalidateSlugResolutionCache`, `invalidateVportCategoryCache`, `invalidateVportProfileSeoCache`, `invalidateVportPublicDetailsSeoCache`, `listVportActorMenuCategoriesDAL`, `listVportActorMenuItemsDAL`, `readActorDirectoryRowDAL`, `readActorProfileDAL`, `readActorSeoViewDAL`, `readContentPageSlugsByPrefixDAL`, `readVportPrimaryCategoryDAL`, `readVportProfileByActorDAL`, `readVportPublicDetailsForSeoDAL`, `readVportRatesByActorDal`, `readVportServiceAddonsByActor`, `readVportServicesByActor`, `resolveActorBySlugOrUsernameDAL`, `resolveActorIdFromProfileId`, `resolveVportBarbershopNameDAL`, `resolveVportExchangeNameDAL`, `resolveVportLocksmithNameDAL`, `resolveVportRestaurantNameDAL`, `resolveVportStationNameDAL`, `updateFuelPriceUnitForActorDAL`, `upsertVportFuelPriceDAL`, `upsertVportRateDal`, `upsertVportServicesByActorDal` |
| `public_actor_seo_v` | READ | `invalidateActorDirectoryCache`, `invalidateActorSeoViewCache`, `invalidateVportCategoryCache`, `invalidateVportProfileSeoCache`, `invalidateVportPublicDetailsSeoCache`, `readActorDirectoryRowDAL`, `readActorSeoViewDAL`, `readVportPrimaryCategoryDAL`, `readVportProfileByActorDAL`, `readVportPublicDetailsForSeoDAL` |
| `rates` | READ, UPSERT | `invalidateRatesCache`, `readVportRatesByActorDal`, `upsertVportRateDal` |
| `review_dimension_ratings` | UPSERT | `dalInsertVportReviewRow`, `dalSoftDeleteVportReview`, `dalUpdateVportReviewBody`, `dalUpsertVportReviewRatings` |
| `review_dimensions` | UPSERT | `dalInsertVportReviewRow`, `dalSoftDeleteVportReview`, `dalUpdateVportReviewBody`, `dalUpsertVportReviewRatings` |
| `reviews` | UPSERT | `dalInsertVportReviewRow`, `dalSoftDeleteVportReview`, `dalUpdateVportReviewBody`, `dalUpsertVportReviewRatings` |
| `service_addons` | READ | `readVportServiceAddonsByActor` |
| `service_catalog` | READ | `readVportServiceCatalogByType` |
| `services` | READ, UPSERT | `readVportServicesByActor`, `upsertVportServicesByActorDal` |
| `station_price_settings` | READ | `fetchVportStationPriceSettingsDAL` |
| `vibe_actor_tags` | READ | `invalidateActorTagsCache`, `readActorSelectedVibeTagKeysDAL`, `readVibeTagCatalogByKeysDAL` |
| `vibe_tags` | READ | `invalidateActorTagsCache`, `readActorSelectedVibeTagKeysDAL`, `readVibeTagCatalogByKeysDAL` |

## RPCs Called

| RPC | Via Functions |
|---|---|
| `actor_directory` | `dalGetReviewAuthorCards`, `dalListActorCardsByActorIds` |
| `actor_follows` | `fetchFollowGraph`, `readActiveFollowRows`, `readActorRows`, `readFriendRankRows` |
| `actors` | `dalGetReviewAuthorCards`, `dalListActorCardsByActorIds`, `fetchFollowGraph`, `readActiveFollowRows`, `readActorRows`, `readFriendRankRows` |
| `count_subscribers` | `dalCountSubscribers`, `invalidateSubscriberCount` |
| `get_friend_ranks` | `fetchFollowGraph`, `readActiveFollowRows`, `readActorRows`, `readFriendRankRows`, `reconcileFriendRanks` |
| `get_review_author_card` | `dalGetReviewAuthorCards`, `dalListActorCardsByActorIds` |
| `list_subscribers` | `dalListSubscribers` |
| `profiles` | `dalGetReviewAuthorCards`, `dalListActorCardsByActorIds` |
| `save_friend_ranks` | `reconcileFriendRanks`, `saveFriendRanks` |

---

## Risk Findings

### 🟠 HIGH — `checkActorOwnership.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/profiles/dal/checkActorOwnership.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🔴 CRITICAL — `fetchPostsForActor.dal.js`

**Risk:** `ui_or_hook_import`  
**File:** `features/profiles/dal/post/fetchPostsForActor.dal.js`  
**Detail:** Imports UI, hooks, or components — DALs must be pure data-access layer.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🟠 HIGH — `locksmithServiceDetails.read.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.read.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🟠 HIGH — `locksmithServiceDetails.write.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/profiles/kinds/vport/dal/locksmith/locksmithServiceDetails.write.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🟡 MEDIUM — `readActorProfile.dal.js`

**Risk:** `cross_feature_dal_import`  
**File:** `features/profiles/dal/readActorProfile.dal.js`  
**Detail:** Imports from another feature's DAL — cross-feature access must go through adapters.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

### 🟠 HIGH — `readVportContentPage.dal.js`

**Risk:** `possible_business_logic`  
**File:** `features/profiles/kinds/vport/dal/content/readVportContentPage.dal.js`  
**Detail:** Contains ownership/role/status checks — business logic should live in a Controller, not a DAL.

**Recommended action:** Route this logic to the Controller layer. DAL must be pure data access.

---

## Pending Reviews

| Command | Reason | Status |
|---|---|---|
| SENTRY | DAL risk findings require architecture boundary review | PENDING |
| VENOM  | Risk findings may affect trust boundaries | PENDING |
| IRONMAN | Confirm ownership of risk-flagged files | PENDING |

---

## Call Chains

Who calls each DAL file — traced from DAL up to Screen.

### `checkActorOwnership.dal.js`

**Direct callers:**

- `checkActorOwnership.controller.js` _Controller_

**Full call chain to screen:**

```
`checkActorOwnership.dal.js` → `checkActorOwnership.controller.js` → `useIsActorOwner.js` → `VportProfileViewScreen.jsx`
```

### `blockedActorSet.read.dal.js`

**Direct callers:**

- `getFriendLists.controller.js` _Controller_

**Full call chain to screen:**

```
`blockedActorSet.read.dal.js` → `getFriendLists.controller.js` → `getFriendLists.controller.js`
```
```
`blockedActorSet.read.dal.js` → `getFriendLists.controller.js` → `useFriendLists.js`
```
```
`blockedActorSet.read.dal.js` → `getFriendLists.controller.js` → `useFriendLists.js` → `FriendsList.jsx`
```
```
`blockedActorSet.read.dal.js` → `getFriendLists.controller.js` → `useFriendLists.js` → `FriendsList.jsx` → `ActorProfileFriendsView.jsx`
```

### `friendRanks.reconcile.dal.js`

**Direct callers:**

- `getTopFriendActorIds.controller.js` _Controller_
- `friendRanks.reconcile.dal.js` _DAL_

**Full call chain to screen:**

```
`friendRanks.reconcile.dal.js` → `friendRanks.reconcile.dal.js`
```
```
`friendRanks.reconcile.dal.js` → `getTopFriendActorIds.controller.js` → `getTopFriendActorIds.controller.js`
```
```
`friendRanks.reconcile.dal.js` → `getTopFriendActorIds.controller.js` → `useTopFriendActorIds.js`
```
```
`friendRanks.reconcile.dal.js` → `getTopFriendActorIds.controller.js` → `useTopFriendActorIds.js` → `ActorProfileFriendsView.jsx`
```

### `friendRanks.write.dal.js`

**Direct callers:**

- `saveTopFriendRanks.controller.js` _Controller_
- `friendRanks.write.dal.js` _DAL_

**Full call chain to screen:**

```
`friendRanks.write.dal.js` → `friendRanks.write.dal.js`
```
```
`friendRanks.write.dal.js` → `saveTopFriendRanks.controller.js` → `saveTopFriendRanks.controller.js`
```
```
`friendRanks.write.dal.js` → `saveTopFriendRanks.controller.js` → `useSaveTopFriendRanks.js`
```
```
`friendRanks.write.dal.js` → `saveTopFriendRanks.controller.js` → `useSaveTopFriendRanks.js` → `TopFriendsRankEditor.jsx`
```

### `friends.read.dal.js`

**Direct callers:**

- `getFriendLists.controller.js` _Controller_
- `getTopFriendActorIds.controller.js` _Controller_
- `getTopFriendCandidates.controller.js` _Controller_
- `friends.read.dal.js` _DAL_

**Full call chain to screen:**

```
`friends.read.dal.js` → `friends.read.dal.js`
```
```
`friends.read.dal.js` → `getFriendLists.controller.js` → `getFriendLists.controller.js`
```
```
`friends.read.dal.js` → `getFriendLists.controller.js` → `useFriendLists.js`
```
```
`friends.read.dal.js` → `getTopFriendActorIds.controller.js` → `getTopFriendActorIds.controller.js`
```

### `listPostCommentsCount.dal.js`

**Direct callers:**

- `photoReactions.controller.js` _Controller_
- `listPostCommentsCount.dal.js` _DAL_

**Full call chain to screen:**

```
`listPostCommentsCount.dal.js` → `listPostCommentsCount.dal.js`
```
```
`listPostCommentsCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js`
```
```
`listPostCommentsCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx`
```
```
`listPostCommentsCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx` → `ActorProfilePhotosView.jsx`
```

### `listPostReactions.dal.js`

**Direct callers:**

- `photoReactions.controller.js` _Controller_
- `listPostReactions.dal.js` _DAL_

**Full call chain to screen:**

```
`listPostReactions.dal.js` → `listPostReactions.dal.js`
```
```
`listPostReactions.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js`
```
```
`listPostReactions.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx`
```
```
`listPostReactions.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx` → `ActorProfilePhotosView.jsx`
```

### `listPostRoseCount.dal.js`

**Direct callers:**

- `photoReactions.controller.js` _Controller_
- `listPostRoseCount.dal.js` _DAL_

**Full call chain to screen:**

```
`listPostRoseCount.dal.js` → `listPostRoseCount.dal.js`
```
```
`listPostRoseCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js`
```
```
`listPostRoseCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx`
```
```
`listPostRoseCount.dal.js` → `photoReactions.controller.js` → `usePhotoReactions.js` → `PhotoGrid.jsx` → `ActorProfilePhotosView.jsx`
```

### `fetchPostsForActor.dal.js`

**Direct callers:**

- `getActorPosts.controller.js` _Controller_
- `fetchPostsForActor.dal.js` _DAL_

**Full call chain to screen:**

```
`fetchPostsForActor.dal.js` → `fetchPostsForActor.dal.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `getActorPosts.controller.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `useActorPosts.js`
```
```
`fetchPostsForActor.dal.js` → `getActorPosts.controller.js` → `useActorPosts.js` → `ActorProfilePhotosView.jsx`
```

### `readActorIdByUsername.dal.js`

**Direct callers:**

- `resolveUsernameToActor.controller.js` _Controller_

**Full call chain to screen:**

```
`readActorIdByUsername.dal.js` → `resolveUsernameToActor.controller.js` → `useUsernameProfileRedirect.js` → `UsernameProfileRedirect.jsx`
```

### `readActorKind.dal.js`

**Direct callers:**

- `getActorKind.controller.js` _Controller_

**Full call chain to screen:**

```
`readActorKind.dal.js` → `getActorKind.controller.js` → `useActorKind.js` → `ActorProfileScreen.jsx`
```

### `readActorPosts.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readActorProfile.dal.js`

**Direct callers:**

- `getProfileView.controller.js` _Controller_
- `profileCache.controller.js` _Controller_

**Full call chain to screen:**

```
`readActorProfile.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `VportProfileViewScreen.jsx`
```
```
`readActorProfile.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `ActorProfileViewScreen.jsx`
```
```
`readActorProfile.dal.js` → `profileCache.controller.js` → `useProfilesOps.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`readActorProfile.dal.js` → `profileCache.controller.js` → `useProfilesOps.js` → `profiles.adapter.js` → `VportDashboardLocksmithScreen.jsx`
```

### `readActorSeoData.dal.js`

**Direct callers:**

- `buildActorCanonicalSlug.controller.js` _Controller_

**Full call chain to screen:**

```
`readActorSeoData.dal.js` → `buildActorCanonicalSlug.controller.js` → `useActorCanonicalSlug.js` → `VportActorMenuManageHeader.jsx`
```
```
`readActorSeoData.dal.js` → `buildActorCanonicalSlug.controller.js` → `useActorCanonicalSlug.js` → `ActorProfileScreen.jsx`
```
```
`readActorSeoData.dal.js` → `buildActorCanonicalSlug.controller.js` → `useVportProfileBySlug.js` → `VportProfileViewScreen.jsx`
```
```
`readActorSeoData.dal.js` → `buildActorCanonicalSlug.controller.js` → `useActorCanonicalSlug.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `readActorType.dal.js`

**Direct callers:**

- `readActorKind.dal.js` _DAL_
- `readVportType.dal.js` _DAL_

**Full call chain to screen:**

```
`readActorType.dal.js` → `readActorKind.dal.js` → `getActorKind.controller.js` → `useActorKind.js` → `ActorProfileScreen.jsx`
```
```
`readActorType.dal.js` → `readVportType.dal.js` → `getVportType.controller.js` → `useVportType.js` → `VportProfileKindScreen.jsx`
```
```
`readActorType.dal.js` → `readVportType.dal.js` → `getVportPublicDetails.controller.js` → `useVportProfileBySlug.js` → `VportProfileViewScreen.jsx`
```
```
`readActorType.dal.js` → `readVportType.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportActorMenuPublicView.jsx`
```

### `readFollowState.dal.js`

**Direct callers:**

- `getProfileView.controller.js` _Controller_

**Full call chain to screen:**

```
`readFollowState.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `VportProfileViewScreen.jsx`
```
```
`readFollowState.dal.js` → `getProfileView.controller.js` → `useProfileView.js` → `ActorProfileViewScreen.jsx`
```

### `readPostMediaByPostIds.dal.js`

**Direct callers:**

- `readActorPosts.dal.js` _DAL_

**Partial chain (no screen reached):  **

```
`readPostMediaByPostIds.dal.js` → `readActorPosts.dal.js`
```

### `readPostReactions.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readPostRoseCounts.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readVportType.dal.js`

**Direct callers:**

- `getVportType.controller.js` _Controller_
- `getVportPublicDetails.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportType.dal.js` → `getVportType.controller.js` → `useVportType.js` → `VportProfileKindScreen.jsx`
```
```
`readVportType.dal.js` → `getVportType.controller.js` → `useVportType.js` → `ActorProfileScreen.jsx`
```
```
`readVportType.dal.js` → `getVportPublicDetails.controller.js` → `useVportProfileBySlug.js` → `VportProfileViewScreen.jsx`
```
```
`readVportType.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportActorMenuPublicView.jsx`
```

### `resolveActorSlug.dal.js`

**Direct callers:**

- `resolveActorBySlug.controller.js` _Controller_

**Full call chain to screen:**

```
`resolveActorSlug.dal.js` → `resolveActorBySlug.controller.js` → `useResolveActorBySlug.js` → `ActorProfileScreen.jsx`
```
```
`resolveActorSlug.dal.js` → `resolveActorBySlug.controller.js` → `useVportProfileBySlug.js` → `VportProfileViewScreen.jsx`
```

### `readActorVibeTags.dal.js`

**Direct callers:**

- `getActorVibeTags.controller.js` _Controller_
- `readActorVibeTags.dal.js` _DAL_

**Full call chain to screen:**

```
`readActorVibeTags.dal.js` → `readActorVibeTags.dal.js`
```
```
`readActorVibeTags.dal.js` → `getActorVibeTags.controller.js` → `getActorVibeTags.controller.js`
```
```
`readActorVibeTags.dal.js` → `getActorVibeTags.controller.js` → `useActorVibeTags.js`
```
```
`readActorVibeTags.dal.js` → `getActorVibeTags.controller.js` → `useActorVibeTags.js` → `ActorProfileTagsView.jsx`
```

### `vportPublicDetails.read.dal.js`

**Direct callers:**

- `getVportPublicDetails.controller.js` _Controller_

**Full call chain to screen:**

```
`vportPublicDetails.read.dal.js` → `getVportPublicDetails.controller.js` → `useVportProfileBySlug.js` → `VportProfileViewScreen.jsx`
```
```
`vportPublicDetails.read.dal.js` → `getVportPublicDetails.controller.js` → `useVportProfileBySlug.js` → `ActorProfileScreen.jsx`
```
```
`vportPublicDetails.read.dal.js` → `getVportPublicDetails.controller.js` → `useVportPublicDetails.js` → `VportActorMenuPublicView.jsx`
```
```
`vportPublicDetails.read.dal.js` → `getVportPublicDetails.controller.js` → `useProfilesOps.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `vportBarbershopPost.read.dal.js`

**Direct callers:**

- `publishBarbershopHoursUpdateAsPost.controller.js` _Controller_
- `publishBarbershopPortfolioUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportBarbershopPost.read.dal.js` → `publishBarbershopHoursUpdateAsPost.controller.js` → `usePublishBarbershopHoursPost.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportBarbershopPost.read.dal.js` → `publishBarbershopPortfolioUpdateAsPost.controller.js` → `usePublishBarbershopPortfolioPost.js` → `VportDashboardPortfolioScreen.jsx`
```

### `createVportContentPage.dal.js`

**Direct callers:**

- `createVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`createVportContentPage.dal.js` → `createVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `deleteVportContentPage.dal.js`

**Direct callers:**

- `deleteVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`deleteVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `listVportContentPages.dal.js`

**Direct callers:**

- `listVportContentPages.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js`
```
```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`listVportContentPages.dal.js` → `listVportContentPages.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `listVportPublicContentPages.dal.js`

**Direct callers:**

- `listVportPublicContentPages.controller.js` _Controller_
- `toggleVportContentPagePublish.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportPublicContentPages.dal.js` → `listVportPublicContentPages.controller.js` → `useVportPublicContent.js`
```
```
`listVportPublicContentPages.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js`
```
```
`listVportPublicContentPages.dal.js` → `listVportPublicContentPages.controller.js` → `useVportPublicContent.js` → `VportContentPublicView.jsx`
```
```
`listVportPublicContentPages.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```

### `readVportContentPage.dal.js`

**Direct callers:**

- `deleteVportContentPage.controller.js` _Controller_
- `toggleVportContentPagePublish.controller.js` _Controller_
- `updateVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`readVportContentPage.dal.js` → `deleteVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `readVportPublicContentPage.dal.js`

**Direct callers:**

- `readVportPublicContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportPublicContentPage.dal.js` → `readVportPublicContentPage.controller.js` → `useVportPublicContentPage.js` → `VportContentPageViewer.jsx`
```
```
`readVportPublicContentPage.dal.js` → `readVportPublicContentPage.controller.js` → `useVportPublicContentPage.js` → `VportContentPageViewer.jsx` → `VportContentPublicView.jsx`
```

### `toggleVportContentPagePublish.dal.js`

**Direct callers:**

- `toggleVportContentPagePublish.controller.js` _Controller_

**Full call chain to screen:**

```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js`
```
```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`toggleVportContentPagePublish.dal.js` → `toggleVportContentPagePublish.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `updateVportContentPage.dal.js`

**Direct callers:**

- `updateVportContentPage.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js`
```
```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx`
```
```
`updateVportContentPage.dal.js` → `updateVportContentPage.controller.js` → `useVportContentPages.js` → `VportContentManageView.jsx` → `VportContentView.jsx`
```

### `vportExchangeRatePost.read.dal.js`

**Direct callers:**

- `publishExchangeRateUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportExchangeRatePost.read.dal.js` → `publishExchangeRateUpdateAsPost.controller.js` → `usePublishExchangeRatePost.js` → `VportDashboardExchangeScreen.jsx`
```

### `vportFuelPriceHistory.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `reviewFuelPriceSuggestion.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceHistory.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPricePost.read.dal.js`

**Direct callers:**

- `publishFuelPriceUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `useSubmitFuelPriceSuggestion.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPricePost.read.dal.js` → `publishFuelPriceUpdateAsPost.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPriceReviews.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceReviews.write.dal.js` → `reviewFuelPriceSuggestion.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```

### `vportFuelPriceSubmissions.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `reviewFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceSubmissions.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPriceSubmissions.write.dal.js`

**Direct callers:**

- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `useSubmitFuelPriceSuggestion.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPriceSubmissions.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPrices.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_
- `updateStationFuelUnit.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPrices.read.dal.js` → `updateStationFuelUnit.controller.js` → `useUpdateStationFuelUnit.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPrices.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportFuelPrices.write.dal.js`

**Direct callers:**

- `reviewFuelPriceSuggestion.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_
- `updateStationFuelUnit.controller.js` _Controller_

**Full call chain to screen:**

```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx`
```
```
`vportFuelPrices.write.dal.js` → `updateStationFuelUnit.controller.js` → `useUpdateStationFuelUnit.js` → `VportDashboardGasScreen.jsx`
```
```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportFuelPrices.write.dal.js` → `submitFuelPriceSuggestion.controller.js` → `useSubmitFuelPriceSuggestion.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `vportStationPriceSettings.read.dal.js`

**Direct callers:**

- `getVportGasPrices.controller.js` _Controller_
- `submitFuelPriceSuggestion.controller.js` _Controller_

**Full call chain to screen:**

```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useOwnerPendingSuggestions.js` → `useOwnerPendingSuggestions.adapter.js` → `VportDashboardGasScreen.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportProfileTabContent.jsx`
```
```
`vportStationPriceSettings.read.dal.js` → `getVportGasPrices.controller.js` → `useVportGasPrices.js` → `VportGasPricesView.jsx` → `VportGasPricesScreen.jsx`
```

### `locksmithPortfolioDetails.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```
```
`locksmithPortfolioDetails.write.dal.js` → `locksmithOwner.controller.js` → `useLocksmithOwner.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `locksmithServiceAreas.read.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`locksmithServiceAreas.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportDashboardLocksmithScreen.jsx`
```

### `locksmithServiceAreas.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```
```
`locksmithServiceAreas.write.dal.js` → `locksmithOwner.controller.js` → `useLocksmithOwner.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```

### `locksmithServiceDetails.read.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportActorMenuFlyerView.jsx`
```
```
`locksmithServiceDetails.read.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `profiles.adapter.js` → `VportDashboardLocksmithScreen.jsx`
```

### `locksmithServiceDetails.write.dal.js`

**Direct callers:**

- `locksmithOwner.controller.js` _Controller_
- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js`
```
```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```
```
`locksmithServiceDetails.write.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx`
```
```
`locksmithServiceDetails.write.dal.js` → `locksmithOwner.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx` → `VportDashboardPortfolioScreen.jsx`
```

### `vportLocksmithPost.read.dal.js`

**Direct callers:**

- `publishLocksmithHoursUpdateAsPost.controller.js` _Controller_
- `publishLocksmithPortfolioUpdateAsPost.controller.js` _Controller_
- `publishLocksmithServiceAreaUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportLocksmithPost.read.dal.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithHoursUpdateAsPost.controller.js` → `usePublishLocksmithPost.js` → `VportDashboardCalendarScreen.jsx`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithHoursUpdateAsPost.controller.js` → `usePublishLocksmithPost.js` → `VportDashboardLocksmithScreen.jsx`
```
```
`vportLocksmithPost.read.dal.js` → `publishLocksmithPortfolioUpdateAsPost.controller.js` → `usePortfolioItemSubmit.js` → `PortfolioItemForm.jsx`
```

### `createVportActorMenuCategory.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `createVportActorMenuItem.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `createVportMenuItemMedia.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`createVportMenuItemMedia.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `deleteVportActorMenuCategory.dal.js`

**Direct callers:**

- `deleteVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`deleteVportActorMenuCategory.dal.js` → `deleteVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `deleteVportActorMenuItem.dal.js`

**Direct callers:**

- `deleteVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`deleteVportActorMenuItem.dal.js` → `deleteVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `listVportActorMenuCategories.dal.js`

**Direct callers:**

- `getVportActorMenu.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuPublicPanel.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`listVportActorMenuCategories.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `listVportActorMenuItems.dal.js`

**Direct callers:**

- `getVportActorMenu.controller.js` _Controller_

**Full call chain to screen:**

```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuPublicPanel.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`listVportActorMenuItems.dal.js` → `getVportActorMenu.controller.js` → `useVportActorMenu.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `readVportActorMenuCategories.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_
- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`readVportActorMenuCategories.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `readVportActorMenuItems.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`readVportActorMenuItems.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `updateVportActorMenuCategory.dal.js`

**Direct callers:**

- `saveVportActorMenuCategory.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`updateVportActorMenuCategory.dal.js` → `saveVportActorMenuCategory.controller.js` → `useVportActorMenuCategoriesMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `updateVportActorMenuItem.dal.js`

**Direct callers:**

- `saveVportActorMenuItem.controller.js` _Controller_

**Full call chain to screen:**

```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx`
```
```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`updateVportActorMenuItem.dal.js` → `saveVportActorMenuItem.controller.js` → `useVportActorMenuItemsMutations.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `vportMenuPost.read.dal.js`

**Direct callers:**

- `publishMenuUpdateAsPost.controller.js` _Controller_

**Full call chain to screen:**

```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx`
```
```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx` → `VportMenuManageView.jsx`
```
```
`vportMenuPost.read.dal.js` → `publishMenuUpdateAsPost.controller.js` → `usePublishMenuPost.js` → `VportActorMenuManagePanel.jsx` → `VportActorMenuSection.jsx`
```

### `actorOwners.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readVportRatesByActor.dal.js`

**Direct callers:**

- `getVportRates.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx`
```
```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx` → `VportRatesView.jsx.adapter.js`
```
```
`readVportRatesByActor.dal.js` → `getVportRates.controller.js` → `useVportRates.js` → `VportRatesView.jsx` → `VportProfileTabContent.jsx`
```

### `upsertVportRate.dal.js`

**Direct callers:**

- `upsertVportRate.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertVportRate.dal.js` → `upsertVportRate.controller.js` → `useUpsertVportRate.js` → `useUpsertVportRate.js.adapter.js` → `VportDashboardExchangeScreen.jsx`
```

### `readVportActorIdByVportId.dal.js`

**Direct callers:**

- `getVportActorIdByVportId.controller.js` _Controller_

**Partial chain (no screen reached):  **

```
`readVportActorIdByVportId.dal.js` → `getVportActorIdByVportId.controller.js`
```
```
`readVportActorIdByVportId.dal.js` → `getVportActorIdByVportId.controller.js` → `useVportActorIdByVportId.js`
```

### `reviewTarget.read.dal.js`

**Direct callers:**

- `VportReviews.controller.js` _Controller_

**Full call chain to screen:**

```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx`
```
```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx` → `VportReviewsView.adapter.js`
```
```
`reviewTarget.read.dal.js` → `VportReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx` → `VportReviewsView.jsx`
```

### `vportReviewAuthors.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `vportReviews.write.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readVportServiceAddonsByActor.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportServiceAddonsByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `readVportServiceCatalogByType.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_
- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportServiceCatalogByType.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `readVportServicesByActor.dal.js`

**Direct callers:**

- `getLocksmithProfile.controller.js` _Controller_
- `VportServiceReviews.controller.js` _Controller_
- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportServicesByActor.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportServicesView.jsx`
```
```
`readVportServicesByActor.dal.js` → `getLocksmithProfile.controller.js` → `useLocksmithProfile.js` → `VportAboutView.jsx`
```
```
`readVportServicesByActor.dal.js` → `VportServiceReviews.controller.js` → `useVportReviews.js` → `VportReviewsView.jsx`
```
```
`readVportServicesByActor.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```

### `readVportTypeByActorId.dal.js`

**Direct callers:**

- `getVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `PortfolioTab.jsx`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`readVportTypeByActorId.dal.js` → `getVportServices.controller.js` → `useVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `upsertVportServicesByActor.dal.js`

**Direct callers:**

- `upsertVportServices.controller.js` _Controller_

**Full call chain to screen:**

```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx`
```
```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx` → `VportServicesView.adapter.js`
```
```
`upsertVportServicesByActor.dal.js` → `upsertVportServices.controller.js` → `useUpsertVportServices.js` → `VportServicesView.jsx` → `VportProfileTabContent.jsx`
```

### `subscribersCount.dal.js`

**Direct callers:**

- `getSubscribers.controller.js` _Controller_

**Full call chain to screen:**

```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js` → `VportBookingView.jsx`
```
```
`subscribersCount.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx` → `VportProfileTabContent.jsx`
```

### `subscribersList.dal.js`

**Direct callers:**

- `getSubscribers.controller.js` _Controller_

**Full call chain to screen:**

```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `useVportBookingView.js` → `VportBookingView.jsx`
```
```
`subscribersList.dal.js` → `getSubscribers.controller.js` → `useSubscribers.js` → `VportSubscribersView.jsx` → `VportProfileTabContent.jsx`
```

### `friendGraph.utils.js`

> No callers detected — possibly dead code or dynamically invoked.

### `friendRanks.reconcile.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `friendRanks.write.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `friends.read.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `listPostCommentsCount.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `listPostReactions.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `listPostRoseCount.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `fetchPostsForActor.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

### `readActorVibeTags.dal.js`

> No callers detected — possibly dead code or dynamically invoked.

---

## Architecture Pipeline

Full build order for this feature — `DAL → Model → Controller → Hook → Components → View Screen → Final Screen`

| Layer | Status | Files |
|---|---|---|
| **DAL** | ✓ PRESENT | _(documented above)_ |
| **Model** | ✓ PRESENT | `VportContentPage.model.js`, `getVportTabsByType.model.js`, `vportFuelPrice.model.js`, `vportFuelPriceSubmission.model.js`, `vportStationPriceSettings.model.js`, `getVportTabsByType.model.js` +36 more |
| **Controller** | ✓ PRESENT | `buildActorCanonicalSlug.controller.js`, `checkActorOwnership.controller.js`, `getFriendLists.controller.js`, `getTopFriendActorIds.controller.js`, `getTopFriendCandidates.controller.js`, `hydrateActorsIntoStore.controller.js` +55 more |
| **Adapter** | ✓ PRESENT | `vportTypes.config.adapter.js`, `useOwnerPendingSuggestions.adapter.js`, `useSubmitFuelPriceSuggestion.adapter.js`, `useVportGasPrices.adapter.js`, `useUpsertVportRate.js.adapter.js`, `useUpsertVportServices.adapter.js` +14 more |
| **Service** | ✗ MISSING | — |
| **Hook** | ✓ PRESENT | `useProfileHeaderMessaging.js`, `useActorCanonicalSlug.js`, `useActorKind.js`, `useActorProfileActions.js`, `useActorSeoMeta.js`, `useActorSlugRedirect.js` +60 more |
| **Component** | ✗ MISSING | — |
| **View Screen** | ✓ PRESENT | `VportProfileViewScreen.jsx`, `VportBarberShopBookingView.jsx`, `VportBarberShopTeamView.jsx`, `VportBookingView.jsx`, `VportContentManageView.jsx`, `VportContentPublicView.jsx` +25 more |
| **Final Screen** | ✓ PRESENT | `VportProfileKindScreen.jsx`, `VportGasPricesScreen.jsx`, `VportActorMenuPublicScreen.jsx`, `ActorProfileScreen.jsx` |

### Model

_Pure transforms — no side effects, no DB access_

- `features/profiles/kinds/vport/model/content/VportContentPage.model.js`
- `features/profiles/kinds/vport/model/gas/getVportTabsByType.model.js`
- `features/profiles/kinds/vport/model/gas/vportFuelPrice.model.js`
- `features/profiles/kinds/vport/model/gas/vportFuelPriceSubmission.model.js`
- `features/profiles/kinds/vport/model/gas/vportStationPriceSettings.model.js`
- `features/profiles/kinds/vport/model/getVportTabsByType.model.js`
- `features/profiles/kinds/vport/model/locksmith/locksmithServiceDefaults.model.js`
- `features/profiles/kinds/vport/model/mapVportPublicDetails.model.js`
- `features/profiles/kinds/vport/model/menu/VportActorMenu.model.js`
- `features/profiles/kinds/vport/model/menu/VportActorMenuCategory.model.js`
- `features/profiles/kinds/vport/model/menu/VportActorMenuItem.model.js`
- `features/profiles/kinds/vport/model/rates/vportRates.model.js`
- `features/profiles/kinds/vport/model/review/VportReview.model.js`
- `features/profiles/kinds/vport/model/services/vportService.model.js`
- `features/profiles/kinds/vport/model/services/vportServiceCatalogFallback.model.js`
- `features/profiles/kinds/vport/screens/booking/model/bookingCalendar.model.js`
- `features/profiles/kinds/vport/screens/booking/model/bookingCalendarAvailability.model.js`
- `features/profiles/kinds/vport/screens/booking/model/bookingCalendarDate.model.js`
- `features/profiles/kinds/vport/screens/booking/model/buildAgenda.model.js`
- `features/profiles/kinds/vport/screens/booking/model/buildBookingPayload.model.js`
- `features/profiles/kinds/vport/screens/booking/model/buildBookings.model.js`
- `features/profiles/kinds/vport/screens/booking/model/buildSlots.model.js`
- `features/profiles/kinds/vport/screens/content/model/contentPageTemplates.model.js`
- `features/profiles/kinds/vport/screens/gas/components/gasPrices.model.js`
- `features/profiles/kinds/vport/screens/menu/components/vportActorMenuCategory.model.js`
- `features/profiles/kinds/vport/screens/menu/model/vportActorMenuPublicPanel.model.js`
- `features/profiles/kinds/vport/screens/menu/vportActorMenuPublic.model.js`
- `features/profiles/kinds/vport/screens/portfolio/vportPortfolio.model.js`
- `features/profiles/kinds/vport/screens/portfolio/vportPortfolioServiceMatch.model.js`
- `features/profiles/kinds/vport/screens/portfolio/vportPortfolioUtils.model.js`
- `features/profiles/kinds/vport/screens/services/model/vportServicesEnabledMap.model.js`
- `features/profiles/kinds/vport/screens/views/tabs/vportAboutView.model.js`
- `features/profiles/model/actorSeo.model.js`
- `features/profiles/model/friends/friendGraph.model.js`
- `features/profiles/model/isDeletedProfileActor.model.js`
- `features/profiles/model/photos/enrichPhotoPosts.model.js`
- `features/profiles/model/post.model.js`
- `features/profiles/model/postCanonical.model.js`
- `features/profiles/model/profile.model.js`
- `features/profiles/model/vportType.model.js`
- `features/profiles/screens/views/tabs/post/models/post.model.js`
- `features/profiles/screens/views/tabs/tags/model/actorVibeTags.model.js`

### Controller

_Business rules, ownership, permissions — no React_

- `features/profiles/controller/buildActorCanonicalSlug.controller.js`
- `features/profiles/controller/checkActorOwnership.controller.js`
- `features/profiles/controller/friends/getFriendLists.controller.js`
- `features/profiles/controller/friends/getTopFriendActorIds.controller.js`
- `features/profiles/controller/friends/getTopFriendCandidates.controller.js`
- `features/profiles/controller/friends/hydrateActorsIntoStore.controller.js`
- `features/profiles/controller/friends/saveTopFriendRanks.controller.js`
- `features/profiles/controller/getActorKind.controller.js`
- `features/profiles/controller/getProfileView.controller.js`
- `features/profiles/controller/getVportType.controller.js`
- `features/profiles/controller/photos/photoReactions.controller.js`
- `features/profiles/controller/post/getActorPosts.controller.js`
- `features/profiles/controller/profileCache.controller.js`
- `features/profiles/controller/resolveActorBySlug.controller.js`
- `features/profiles/controller/resolveUsernameToActor.controller.js`
- `features/profiles/controller/tags/getActorVibeTags.controller.js`
- `features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/content/createVportContentPage.controller.js`
- `features/profiles/kinds/vport/controller/content/deleteVportContentPage.controller.js`
- `features/profiles/kinds/vport/controller/content/listVportContentPages.controller.js`
- `features/profiles/kinds/vport/controller/content/listVportPublicContentPages.controller.js`
- `features/profiles/kinds/vport/controller/content/readVportPublicContentPage.controller.js`
- `features/profiles/kinds/vport/controller/content/toggleVportContentPagePublish.controller.js`
- `features/profiles/kinds/vport/controller/content/updateVportContentPage.controller.js`
- `features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/gas/getVportGasPrices.controller.js`
- `features/profiles/kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js`
- `features/profiles/kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js`
- `features/profiles/kinds/vport/controller/gas/updateStationFuelUnit.controller.js`
- `features/profiles/kinds/vport/controller/getVportActorIdByVportId.controller.js`
- `features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js`
- `features/profiles/kinds/vport/controller/locksmith/getLocksmithProfile.controller.js`
- `features/profiles/kinds/vport/controller/locksmith/locksmithOwner.controller.js`
- `features/profiles/kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js`
- `features/profiles/kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js`
- `features/profiles/kinds/vport/controller/menu/getVportActorMenu.controller.js`
- `features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js`
- `features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js`
- `features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js`
- `features/profiles/kinds/vport/controller/portfolio/VportPortfolio.controller.js`
- `features/profiles/kinds/vport/controller/rates/getVportRates.controller.js`
- `features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`
- `features/profiles/kinds/vport/controller/review/VportReviews.controller.js`
- `features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js`
- `features/profiles/kinds/vport/controller/services/createOrUpdateVportServiceAddon.controller.js`
- `features/profiles/kinds/vport/controller/services/deleteVportServiceAddon.controller.js`
- `features/profiles/kinds/vport/controller/services/getVportServices.controller.js`
- `features/profiles/kinds/vport/controller/services/reorderVportServiceAddon.controller.js`
- `features/profiles/kinds/vport/controller/services/upsertVportServices.controller.js`
- `features/profiles/kinds/vport/controller/subscribers/getSubscribers.controller.js`
- `features/profiles/screens/views/tabs/friends/controller/getFriendLists.controller.js`
- `features/profiles/screens/views/tabs/friends/controller/getTopFriendActorIds.controller.js`
- `features/profiles/screens/views/tabs/friends/controller/getTopFriendCandidates.controller.js`
- `features/profiles/screens/views/tabs/friends/controller/saveTopFriendRanks.controller.js`
- `features/profiles/screens/views/tabs/post/controllers/getActorPosts.controller.js`
- `features/profiles/screens/views/tabs/tags/controller/getActorVibeTags.controller.js`

### Adapter

_Cross-feature boundary — only approved cross-feature access point_

- `features/profiles/adapters/kinds/vport/config/vportTypes.config.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter.js`
- `features/profiles/adapters/kinds/vport/hooks/useVportPublicDetails.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/GasPricesPanel.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/GasStates.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/gas/components/OwnerPendingSuggestionsList.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/rates/components/VportRateEditorCard.jsx.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/rates/view/VportRatesView.jsx.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/review/VportReviewsView.adapter.js`
- `features/profiles/adapters/kinds/vport/screens/services/view/VportServicesView.adapter.js`
- `features/profiles/adapters/photos/photoReactions.adapter.js`
- `features/profiles/adapters/profiles.adapter.js`
- `features/profiles/adapters/tags/tagsData.adapter.js`
- `features/profiles/adapters/ui/PrivateProfileGate.adapter.js`
- `features/profiles/adapters/ui/UnavailableProfileGate.adapter.js`
- `features/profiles/adapters/ui/actorProfileScreenDependencies.adapter.js`

### Hook

_Lifecycle / timing / state wiring — no business rules_

- `features/profiles/hooks/header/useProfileHeaderMessaging.js`
- `features/profiles/hooks/useActorCanonicalSlug.js`
- `features/profiles/hooks/useActorKind.js`
- `features/profiles/hooks/useActorProfileActions.js`
- `features/profiles/hooks/useActorSeoMeta.js`
- `features/profiles/hooks/useActorSlugRedirect.js`
- `features/profiles/hooks/useIsActorOwner.js`
- `features/profiles/hooks/useProfileGate.js`
- `features/profiles/hooks/useProfileView.js`
- `features/profiles/hooks/useProfilesOps.js`
- `features/profiles/hooks/useResolveActorBySlug.js`
- `features/profiles/hooks/useUsernameProfileRedirect.js`
- `features/profiles/hooks/useVportType.js`
- `features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js`
- `features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js`
- `features/profiles/kinds/vport/hooks/content/useVportPublicContentPage.js`
- `features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js`
- `features/profiles/kinds/vport/hooks/gas/useOwnerPendingSuggestions.js`
- `features/profiles/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.js`
- `features/profiles/kinds/vport/hooks/gas/useUpdateStationFuelUnit.js`
- `features/profiles/kinds/vport/hooks/gas/useVportGasPrices.js`
- `features/profiles/kinds/vport/hooks/locksmith/useLocksmithOwner.js`
- `features/profiles/kinds/vport/hooks/locksmith/useLocksmithProfile.js`
- `features/profiles/kinds/vport/hooks/locksmith/usePublishLocksmithPost.js`
- `features/profiles/kinds/vport/hooks/menu/usePublishMenuPost.js`
- `features/profiles/kinds/vport/hooks/menu/useVportActorMenu.js`
- `features/profiles/kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js`
- `features/profiles/kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js`
- `features/profiles/kinds/vport/hooks/portfolio/useVportPortfolio.js`
- `features/profiles/kinds/vport/hooks/rates/useUpsertVportRate.js`
- `features/profiles/kinds/vport/hooks/rates/useVportRates.js`
- `features/profiles/kinds/vport/hooks/review/useVportReviewList.js`
- `features/profiles/kinds/vport/hooks/review/useVportReviewMine.js`
- `features/profiles/kinds/vport/hooks/review/useVportReviews.helpers.js`
- `features/profiles/kinds/vport/hooks/review/useVportReviews.js`
- `features/profiles/kinds/vport/hooks/services/useCreateOrUpdateVportServiceAddon.js`
- `features/profiles/kinds/vport/hooks/services/useDeleteVportServiceAddon.js`
- `features/profiles/kinds/vport/hooks/services/useReorderVportServiceAddon.js`
- `features/profiles/kinds/vport/hooks/services/useUpsertVportServices.js`
- `features/profiles/kinds/vport/hooks/services/useVportServices.js`
- `features/profiles/kinds/vport/hooks/subscribers/useSubscribers.js`
- `features/profiles/kinds/vport/hooks/useVportActorIdByVportId.js`
- `features/profiles/kinds/vport/hooks/useVportOwnerQuickStats.js`
- `features/profiles/kinds/vport/hooks/useVportProfileActions.js`
- `features/profiles/kinds/vport/hooks/useVportProfileBySlug.js`
- `features/profiles/kinds/vport/hooks/useVportPublicDetails.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useAgendaCalendarValues.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useAvailabilityData.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useOwnerFollowerSelector.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.helpers.js`
- `features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js`
- `features/profiles/kinds/vport/screens/content/hooks/useVportContentPages.js`
- `features/profiles/kinds/vport/screens/content/hooks/useVportPublicContent.js`
- `features/profiles/kinds/vport/screens/menu/hooks/useMenuItemForm.js`
- `features/profiles/kinds/vport/screens/menu/hooks/useMenuItemPhotoUpload.js`
- `features/profiles/kinds/vport/screens/menu/hooks/useVportActorMenuManageState.js`
- `features/profiles/screens/hooks/useProfileRouteTelemetry.js`
- `features/profiles/screens/views/tabs/friends/hooks/useFriendLists.js`
- `features/profiles/screens/views/tabs/friends/hooks/useSaveTopFriendRanks.js`
- `features/profiles/screens/views/tabs/friends/hooks/useTopFriendActorIds.js`
- `features/profiles/screens/views/tabs/friends/hooks/useTopFriendCandidates.js`
- `features/profiles/screens/views/tabs/photos/hooks/usePhotoReactions.js`
- `features/profiles/screens/views/tabs/post/hooks/useActorPosts.js`
- `features/profiles/screens/views/tabs/tags/hooks/useActorVibeTags.js`

### View Screen

_Hooks + component composition — no business logic_

- `features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx`
- `features/profiles/kinds/vport/screens/barbershop/VportBarberShopBookingView.jsx`
- `features/profiles/kinds/vport/screens/barbershop/VportBarberShopTeamView.jsx`
- `features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx`
- `features/profiles/kinds/vport/screens/content/VportContentManageView.jsx`
- `features/profiles/kinds/vport/screens/content/VportContentPublicView.jsx`
- `features/profiles/kinds/vport/screens/content/VportContentView.jsx`
- `features/profiles/kinds/vport/screens/content/components/VportContentPageViewer.jsx`
- `features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx`
- `features/profiles/kinds/vport/screens/menu/VportActorMenuPublicView.jsx`
- `features/profiles/kinds/vport/screens/menu/VportMenuManageView.jsx`
- `features/profiles/kinds/vport/screens/menu/VportMenuView.jsx`
- `features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx`
- `features/profiles/kinds/vport/screens/portfolio/view/VportPortfolioView.jsx`
- `features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx`
- `features/profiles/kinds/vport/screens/review/VportReviewsView.jsx`
- `features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportBookingView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportContentView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportPortfolioView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx`
- `features/profiles/kinds/vport/screens/views/tabs/components/VportAboutViewComponents.jsx`
- `features/profiles/screens/views/ActorProfileFriendsView.jsx`
- `features/profiles/screens/views/ActorProfilePhotosView.jsx`
- `features/profiles/screens/views/ActorProfilePostsView.jsx`
- `features/profiles/screens/views/ActorProfileTagsView.jsx`
- `features/profiles/screens/views/ActorProfileViewScreen.jsx`
- `features/profiles/screens/views/tabs/photos/components/ImageViewerModal.jsx`

### Final Screen

_Route entry + identity gate only — no computation_

- `features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx`
- `features/profiles/kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx`
- `features/profiles/kinds/vport/screens/menu/VportActorMenuPublicScreen.jsx`
- `features/profiles/screens/ActorProfileScreen.jsx`

### Missing Layers

- 🟡 **Service** — not detected in static scan; delegation to engines covers this gap
- 🟡 **Component** — not detected by static scan naming patterns; components exist inside `screens/` subdirs

---

## ARCHITECT Live Audit Findings

_Appended:_ 2026-05-11 · ARCHITECT manual verification  
_Scope:_ Dead DAL detection, stub DAL identification, screen-nested shim layer, review write bypass, layer violations, partial chain resolution

---

## Doc Corrections from Original Static Scan

| Field | Original (Wrong) | Corrected |
|---|---|---|
| Risk findings | 6 | 12 |
| Dead code | None listed | 7 confirmed dead/stub DAL files |
| Screen-nested duplicates | Listed as "Duplicate DAL files" | All are 1-line re-export shims; consumed only by dev/diagnostics |
| `friendGraph.utils.js` | Listed as DAL — "No callers detected" | Misclassified — it's a utility (pure function, no DB access) inside a `dal/` folder; duplicates `friendGraph.model.js` |
| `vportReviews.write.dal.js` | "No callers detected" | Bypassed by `@reviews` engine — `VportReviews.controller.js` uses `review_created` event path, not this DAL |
| `readActorPosts.dal.js` chain | "No callers detected" | Confirmed dead — `getActorPosts.controller.js` uses `fetchPostsForActorDAL` (different DAL) |
| `readPostMediaByPostIds.dal.js` | "Partial chain (no screen reached)" | Cascaded dead — only caller is `readActorPosts.dal.js` which is dead |
| `readVportActorIdByVportId.dal.js` | "Partial chain (no screen reached)" | Chain ends at hook — `useVportActorIdByVportId.js` exists but has zero screen consumers confirmed |

---

## Screen-Nested Re-Export Shim Layer

The static scan flagged 8+ files as "duplicate" DAL/controller files because they live in `screens/views/tabs/*/dal/` or `screens/views/tabs/*/controller/`. Manual verification confirms:

**All screen-nested DAL files are 1-line re-export shims** pointing to the canonical `features/profiles/dal/` files. They add zero logic. Their only consumer is `dev/diagnostics/groups/profilesFeature.group.js` — a dev-only diagnostics file, not a production code path.

| Screen-nested shim | Canonical target | Production consumers |
|---|---|---|
| `screens/views/tabs/friends/dal/friends.read.dal.js` | `dal/friends/friends.read.dal.js` | None (dev diagnostics only) |
| `screens/views/tabs/friends/dal/friendRanks.reconcile.dal.js` | `dal/friends/friendRanks.reconcile.dal.js` | None |
| `screens/views/tabs/friends/dal/friendRanks.write.dal.js` | `dal/friends/friendRanks.write.dal.js` | None |
| `screens/views/tabs/photos/dal/listPostCommentsCount.dal.js` | `dal/photos/listPostCommentsCount.dal.js` | None |
| `screens/views/tabs/photos/dal/listPostReactions.dal.js` | `dal/photos/listPostReactions.dal.js` | None |
| `screens/views/tabs/photos/dal/listPostRoseCount.dal.js` | `dal/photos/listPostRoseCount.dal.js` | None |
| `screens/views/tabs/post/dal/fetchPostsForActor.dal.js` | `dal/post/fetchPostsForActor.dal.js` | None |
| `screens/views/tabs/tags/dal/readActorVibeTags.dal.js` | `dal/tags/readActorVibeTags.dal.js` | None |

Screen-nested controller shims follow the same pattern — 1-line re-exports consumed only by `profilesFeature.group.js`.

**Recommended action:** Remove all screen-nested shims. The diagnostics group file can import directly from the canonical `controller/` and `dal/` paths.

---

## Dead and Stub DAL File Summary

| File | Status | Reason |
|---|---|---|
| `dal/readActorPosts.dal.js` | CONFIRMED DEAD | No controller imports it — `getActorPosts.controller.js` uses `fetchPostsForActorDAL` instead |
| `dal/readPostMediaByPostIds.dal.js` | DEAD (cascaded) | Only caller is `readActorPosts.dal.js` which is itself dead |
| `dal/readPostReactions.dal.js` | STUB — DISABLED | Returns `[]` unconditionally — Phase 1 reactions disabled; no live callers |
| `dal/readPostRoseCounts.dal.js` | STUB — DISABLED | Returns `[]` unconditionally — Phase 1 roses disabled; no live callers |
| `kinds/vport/dal/rates/actorOwners.read.dal.js` | CONFIRMED DEAD | No callers. Other features have their own copies of `dalReadActorOwnerRow` (settings, dashboard, wanders) — this one is unreferenced |
| `kinds/vport/dal/review/vportReviewAuthors.read.dal.js` | CONFIRMED DEAD | No callers. Review author hydration is handled by the `@reviews` engine |
| `kinds/vport/dal/review/vportReviews.write.dal.js` | BYPASSED — EFFECTIVELY DEAD | `VportReviews.controller.js` uses `@reviews` engine (`review_created` event kind) — this DAL is never called |

**Total: 7 DAL files are dead, stub, or bypassed.**

---

## Risk Findings (New)

### RISK-7 — `readActorPosts.dal.js` and `readPostMediaByPostIds.dal.js` Are Dead
**Severity:** HIGH  
**Classification:** CONFIRMED DEAD  
**Detail:** `readActorPosts.dal.js` has no callers. The active controller (`getActorPosts.controller.js`) imports `fetchPostsForActorDAL` from a different DAL file (`dal/post/fetchPostsForActor.dal.js`). `readActorPosts.dal.js` was either replaced or never wired to the live chain.

`readPostMediaByPostIds.dal.js` is a cascaded dead file — its only reference is inside `readActorPosts.dal.js`, which itself has no callers.

**Recommended action:** Delete both `dal/readActorPosts.dal.js` and `dal/readPostMediaByPostIds.dal.js`. Verify no dynamic import references first.

---

### RISK-8 — `readPostReactions.dal.js` and `readPostRoseCounts.dal.js` Are Phase 1 Stubs
**Severity:** MEDIUM  
**Classification:** STUB — DISABLED  
**Detail:** Both files contain stubs that always return `[]`. File comments explicitly say "Phase 1: REACTIONS DISABLED" and "Phase 1: ROSES DISABLED." Neither has any live callers.

**Recommended action:** Decide the fate of each feature. If reactions and roses are planned, replace these stubs with real implementations. If abandoned, delete the files and remove the dead imports from any callers that reference them.

---

### RISK-9 — `actorOwners.read.dal.js` in `profiles/kinds/vport/dal/rates/` Is Dead + Has `console.log`
**Severity:** MEDIUM  
**Classification:** CONFIRMED DEAD + POLICY VIOLATION  
**Detail:** This file defines `dalReadActorOwnerRow` but has zero callers from outside itself. Other features (settings, dashboard, wanders) have their own separate `actorOwners.read.dal.js` files with distinct function names — they do not import from this one.

The file also contains an unguarded `console.log("[dalReadActorOwnerRow] actorId=", actorId, "userId=", userId)` — policy violation (no console.log, no guarding by `import.meta.env.DEV`).

**Recommended action:** Delete this file. The `console.log` cannot be cleaned up if the file is dead — deletion is the correct action.

---

### RISK-10 — `vportReviews.write.dal.js` Is Bypassed by `@reviews` Engine
**Severity:** MEDIUM  
**Classification:** BYPASSED — ENGINE TAKEOVER  
**Detail:** `vportReviews.write.dal.js` exports `dalInsertVportReviewRow`, `dalSoftDeleteVportReview`, `dalUpdateVportReviewBody`, and `dalUpsertVportReviewRatings`. None of these are imported anywhere outside the DAL file itself.

`VportReviews.controller.js` handles all review creation/update via the `@reviews` engine using a `review_created` event kind — the feature-level DAL write path was replaced by the engine and never removed.

Similarly, `vportReviewAuthors.read.dal.js` is dead — author hydration is handled engine-side.

**Recommended action:** Delete `vportReviews.write.dal.js` and `vportReviewAuthors.read.dal.js`. Confirm the engine write path handles all review CRUD before deletion.

---

### RISK-11 — `fetchPostsForActor.dal.js` Imports Zustand Store (Layer Violation)
**Severity:** HIGH  
**Classification:** LAYER VIOLATION (extends existing CRITICAL finding)  
**Detail:** The original scan flagged this DAL as CRITICAL for "importing UI or hooks." Manual verification confirms: `fetchPostsForActor.dal.js` imports `useActorStore` from `@/state/actors/actorStore` (a Zustand store). DALs must be pure Supabase access — they must never read React-bound or Zustand state.

Additionally, `getActorPosts.controller.js` (the controller that calls this DAL) also imports `useActorStore.getState()` — the store-access violation is in both the DAL and its calling controller.

**Recommended action:** Refactor `fetchPostsForActor.dal.js` to accept actor data as a parameter (passed from the controller). The controller should read `useActorStore.getState()` and pass necessary values down to the DAL function, removing the store import from the DAL entirely.

---

### RISK-12 — Screen-Nested Re-Export Shims Are Unused Indirection
**Severity:** LOW  
**Classification:** DEAD INDIRECTION  
**Detail:** 8 DAL re-export shims and 2+ controller re-export shims exist inside `screens/views/tabs/*/dal/` and `screens/views/tabs/*/controller/`. All are 1-line re-exports that add zero behavior. The only consumer of these shims is `dev/diagnostics/groups/profilesFeature.group.js` — a dev-only file that is not part of the production build.

This means the canonical `dal/` and `controller/` files are reached directly by the hooks, not via these shims. The shims exist as a structural artifact and serve no function.

**Recommended action:** Delete all screen-nested shims. Update `profilesFeature.group.js` to import directly from canonical `@/features/profiles/dal/...` and `@/features/profiles/controller/...` paths. Remove the `dal/` subfolder from `screens/views/tabs/*/` directories.

---

### RISK-13 (additional note) — `friendGraph.utils.js` Is Misplaced and Duplicates the Model
**Severity:** LOW  
**Classification:** MISCLASSIFIED FILE + DUPLICATE LOGIC  
**Detail:** `screens/views/tabs/friends/dal/friendGraph.utils.js` is not a DAL — it contains `deriveFriendLists()`, a pure function with no DB access. It is misplaced inside a `dal/` folder. The same function also exists in `features/profiles/model/friends/friendGraph.model.js`, which is the version actually used by the controller. The utils version has zero callers outside itself.

**Recommended action:** Delete `friendGraph.utils.js`. The canonical implementation in `friendGraph.model.js` is active.

---

## Pending Reviews

| Review | Command | Priority |
|---|---|---|
| Delete `readActorPosts.dal.js` + `readPostMediaByPostIds.dal.js` | LOKI (verify no dynamic refs) + SENTRY | HIGH |
| Decide fate of `readPostReactions.dal.js` + `readPostRoseCounts.dal.js` stubs | IRONMAN | MEDIUM |
| Delete `actorOwners.read.dal.js` in profiles/kinds/vport/dal/rates (dead + console.log) | SENTRY | MEDIUM |
| Delete `vportReviews.write.dal.js` + `vportReviewAuthors.read.dal.js` (engine bypass) | SENTRY | MEDIUM |
| Refactor `fetchPostsForActor.dal.js` to remove Zustand store import | SENTRY | HIGH |
| Remove `useActorStore.getState()` from `getActorPosts.controller.js` — pass data via params | SENTRY | HIGH |
| Delete all 8 screen-nested DAL shims + controller shims | SENTRY | LOW |
| Delete `friendGraph.utils.js` — duplicate of `friendGraph.model.js` | SENTRY | LOW |
| Determine `readVportActorIdByVportId.dal.js` fate — hook exists, no screen consumer found | IRONMAN | LOW |
| Original SENTRY, VENOM, IRONMAN reviews from original scan — still pending | SENTRY / VENOM / IRONMAN | MEDIUM |

---

## ARCHITECT Pipeline Trace

_Appended:_ 2026-05-11 · ARCHITECT manual verification  
_Scope:_ Full architecture pipeline per domain — which Model, Controller, Hook, and Screen files touch each DAL group  
_Method:_ Source read of all 81 DAL files + controllers + models — grouped by domain (not per-file) because most DAL groups share a single controller/model/hook/screen path.

---

### Domain 1 — Core Profile Identity

**DALs:** `readActorProfile.dal.js`, `readFollowState.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/profile.model.js` — `ProfileModel(row)` | User-only transform. Maps raw profile row to domain shape. Vport shape is built inline in the controller (not model — see new RISK-14). |
| **Controller** | `controller/getProfileView.controller.js` — `getProfileView()` | Calls both DALs in parallel. Applies `ProfileModel` for user actors. Builds inline vport shape. Also calls `useActorStore.getState().upsertActors()` — Zustand store access in a controller (see RISK-14). |
| **Controller** | `controller/profileCache.controller.js` | Calls `readActorProfileDAL` for cache warm path. Exposes result via `useProfilesOps` + `profiles.adapter.js`. |
| **Hook** | `hooks/useProfileView.js` | Primary consumer of `getProfileView()`. Drives both profile screen types. |
| **Hook** | `hooks/useProfilesOps.js` | Calls `profileCache.controller.js`. Consumed by `profiles.adapter.js` cross-feature surface. |
| **Adapter** | `adapters/profiles.adapter.js` | Cross-feature boundary. Exposes `profileCache.controller.js` result to `VportActorMenuFlyerView`, `VportDashboardLocksmithScreen`, and other consumers. |
| **View Screen** | — | No dedicated view; `useProfileView` used directly in Final Screens. |
| **Final Screen** | `kinds/vport/screens/VportProfileViewScreen.jsx` | vport actor path |
| **Final Screen** | `screens/views/ActorProfileViewScreen.jsx` | user actor path |

**Model gap:** Vport profile shape is built inline inside `getProfileView.controller.js` rather than via a dedicated model. The inline block constructs `{actorId, kind, vportId, displayName, ...}` without a model function — this is business-level transform in the controller.

---

### Domain 2 — Slug / SEO

**DALs:** `readActorSeoData.dal.js`, `resolveActorSlug.dal.js`, `readActorIdByUsername.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/actorSeo.model.js` — `ActorSeoModel()`, `buildActorPageTitle()`, `buildActorMetaDescription()` | Pure transform. Receives shaped DAL rows, produces `{canonicalSlug, slugParts, actorId, name, category, city, state}`. |
| **Controller** | `controller/buildActorCanonicalSlug.controller.js` — `buildActorCanonicalSlugController()` | Calls `readActorSeoViewDAL`, reshapes row, passes to `ActorSeoModel`. Has 10-minute controller-level TTL cache. |
| **Controller** | `controller/resolveActorBySlug.controller.js` | Calls `resolveActorBySlugOrUsernameDAL`. No model — returns raw resolved actor. |
| **Controller** | `controller/resolveUsernameToActor.controller.js` | Calls `readActorIdByUsername`. No model. |
| **Hook** | `hooks/useActorCanonicalSlug.js` | Calls `buildActorCanonicalSlugController`. |
| **Hook** | `hooks/useActorSeoMeta.js` | Calls `ActorSeoModel` helpers directly from hook — `buildActorPageTitle`, `buildActorMetaDescription`. Model consumed at hook layer (acceptable — pure helpers). |
| **Hook** | `hooks/useResolveActorBySlug.js` | Calls `resolveActorBySlug.controller.js`. |
| **Hook** | `kinds/vport/hooks/useVportProfileBySlug.js` | Calls `resolveActorBySlug.controller.js` + `getVportPublicDetails.controller.js`. |
| **Hook** | `hooks/useUsernameProfileRedirect.js` | Calls `resolveUsernameToActor.controller.js`. |
| **Final Screen** | `screens/ActorProfileScreen.jsx` | consumes `useActorCanonicalSlug`, `useResolveActorBySlug` |
| **Final Screen** | `kinds/vport/screens/VportProfileViewScreen.jsx` | consumes `useVportProfileBySlug`, `useActorCanonicalSlug` |
| **Component** | `kinds/vport/screens/menu/components/VportActorMenuManageHeader.jsx` | consumes `useActorCanonicalSlug` |

---

### Domain 3 — Vport Type

**DALs:** `readActorType.dal.js`, `readActorKind.dal.js`, `readVportType.dal.js`

**Architecture note:** `readActorKind.dal.js` and `readVportType.dal.js` are thin wrapper DALs — both delegate internally to `readActorTypeDAL` which carries a 600s TTL cache.

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/vportType.model.js` — `toVportType(row)` | Pure transform. Validates vport type against config, returns normalized type string or `"other"`. |
| **Model** | `model/isDeletedProfileActor.model.js` — `isDeletedProfileActor()` | Pure utility consumed in `VportProfileViewScreen` for deleted actor gating. No DAL call — consumes already-fetched `publicDetails` shape. |
| **Controller** | `controller/getActorKind.controller.js` | Calls `readActorKindDAL` → (delegates to `readActorTypeDAL`). Returns raw `kind` string. No model. |
| **Controller** | `controller/getVportType.controller.js` | Calls `readVportTypeDAL` → (delegates to `readActorTypeDAL`). Applies `toVportType()` model. |
| **Controller** | `kinds/vport/controller/getVportPublicDetails.controller.js` | Calls `readVportTypeDAL` (alongside `fetchVportPublicDetailsByActorId`). Applies `mapVportPublicDetailsModel`. |
| **Hook** | `hooks/useActorKind.js` | Calls `getActorKind.controller.js`. |
| **Hook** | `hooks/useVportType.js` | Calls `getVportType.controller.js`. |
| **Hook** | `kinds/vport/hooks/useVportProfileBySlug.js` | Calls `getVportPublicDetails.controller.js`. |
| **Hook** | `kinds/vport/hooks/useVportPublicDetails.js` | Calls `getVportPublicDetails.controller.js`. |
| **Final Screen** | `screens/ActorProfileScreen.jsx` | consumes `useActorKind`, `useVportType` |
| **Final Screen** | `kinds/vport/screens/VportProfileKindScreen.jsx` | consumes `useVportType` |
| **Final Screen** | `kinds/vport/screens/VportProfileViewScreen.jsx` | consumes `useVportProfileBySlug` |
| **View Screen** | `kinds/vport/screens/menu/VportActorMenuPublicView.jsx` | consumes `useVportPublicDetails` |

---

### Domain 4 — Vport Public Details

**DALs:** `vportPublicDetails.read.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/mapVportPublicDetails.model.js` — `mapVportPublicDetailsModel(raw, vportTypeRow)` | Joins public details row + vport type row into a unified domain object. |
| **Controller** | `kinds/vport/controller/getVportPublicDetails.controller.js` | Calls both `fetchVportPublicDetailsByActorId` + `readVportTypeDAL` in parallel, then applies `mapVportPublicDetailsModel`. 60s TTL cache. |
| **Hook** | `kinds/vport/hooks/useVportProfileBySlug.js` | Calls controller. |
| **Hook** | `kinds/vport/hooks/useVportPublicDetails.js` | Calls controller. |
| **Hook** | `hooks/useProfilesOps.js` | Calls controller via `profileCache.controller.js`. |
| **Adapter** | `adapters/profiles.adapter.js` | Exposes `useProfilesOps` result cross-feature. |
| **Adapter** | `adapters/kinds/vport/hooks/useVportPublicDetails.adapter.js` | Adapter-layer wrapper for cross-feature consumers. |
| **Final Screen** | `kinds/vport/screens/VportProfileViewScreen.jsx` | |
| **Final Screen** | `screens/ActorProfileScreen.jsx` | (via `useVportProfileBySlug`) |
| **View Screen** | `kinds/vport/screens/menu/VportActorMenuPublicView.jsx` | |

---

### Domain 5 — Actor Ownership

**DALs:** `checkActorOwnership.dal.js`, `actorOwners.read.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | None | No model transforms on ownership rows. |
| **Controller** | `controller/checkActorOwnership.controller.js` | Calls `checkActorOwnershipDAL`. Contains ownership/role/status checks — business logic correctly in controller (flags in original scan misidentified the DAL as containing it, not this controller). |
| **Hook** | `hooks/useIsActorOwner.js` | Calls `checkActorOwnership.controller.js`. |
| **Final Screen** | `kinds/vport/screens/VportProfileViewScreen.jsx` | |
| **`actorOwners.read.dal.js`** | **DEAD** — zero callers in profiles feature. Other features have their own separate copies. | See RISK-9 |

---

### Domain 6 — Friends / Social Graph

**DALs:** `friends.read.dal.js`, `blockedActorSet.read.dal.js`, `friendRanks.reconcile.dal.js`, `friendRanks.write.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/friends/friendGraph.model.js` — `deriveFriendLists(graph)` | Pure transform. Consumes follow graph from `fetchFollowGraph()`, derives `{mutual, iAmFan, myFans}` ID sets. |
| **Controller** | `controller/friends/getFriendLists.controller.js` | Calls `fetchFollowGraph` + `deriveFriendLists` (model) + `listBlockedActorRowsForCandidatesDAL` for block filtering. |
| **Controller** | `controller/friends/getTopFriendActorIds.controller.js` | Calls `reconcileFriendRanks` + `readFriendRankRows` + `readActiveFollowRows` + `readActorRows` from `friends.read.dal.js`. Also calls `ctrlGetBlockedActorSet` from `@block` feature (cross-feature via adapter). Contains unguarded `console.warn` (see RISK-14). |
| **Controller** | `controller/friends/getTopFriendCandidates.controller.js` | Calls `friends.read.dal.js` for candidate resolution. |
| **Controller** | `controller/friends/saveTopFriendRanks.controller.js` | Calls `saveFriendRanks` from `friendRanks.write.dal.js`. No model. |
| **Hook** | `screens/views/tabs/friends/hooks/useFriendLists.js` | Calls `getFriendLists.controller.js`. |
| **Hook** | `screens/views/tabs/friends/hooks/useTopFriendActorIds.js` | Calls `getTopFriendActorIds.controller.js`. |
| **Hook** | `screens/views/tabs/friends/hooks/useTopFriendCandidates.js` | Calls `getTopFriendCandidates.controller.js`. |
| **Hook** | `screens/views/tabs/friends/hooks/useSaveTopFriendRanks.js` | Calls `saveTopFriendRanks.controller.js`. |
| **View Screen** | `screens/views/ActorProfileFriendsView.jsx` | Consumes `useFriendLists`, `useTopFriendActorIds`. |
| **Component** | `TopFriendsRankEditor.jsx` | Consumes `useSaveTopFriendRanks`. |

---

### Domain 7 — Posts

**DALs:** `fetchPostsForActor.dal.js`, `readActorPosts.dal.js` (DEAD), `readPostMediaByPostIds.dal.js` (DEAD)

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/post.model.js` → `model/postCanonical.model.js` — `PostModel(row)` | `post.model.js` is a thin wrapper calling `buildCanonicalProfilePostModel` from `postCanonical.model.js`. Full canonical post shape. |
| **Model** | `screens/views/tabs/post/models/post.model.js` | Screen-nested model — the version actually used by `getActorPosts.controller.js`. Separate file from `model/post.model.js`. Likely same implementation (not verified). |
| **Controller** | `controller/post/getActorPosts.controller.js` — `getActorPostsController()` | Calls `fetchPostsForActorDAL`. Applies `PostModel`. Also calls `hydrateActorsFromRows` and reads `useActorStore.getState()` — Zustand store access in a controller (see RISK-11). |
| **Hook** | `screens/views/tabs/post/hooks/useActorPosts.js` | Calls `getActorPostsController`. |
| **View Screen** | `screens/views/ActorProfilePhotosView.jsx` | Consumes `useActorPosts`. Also renders `PhotoGrid` which runs photo reactions path. |

**Dead DALs:** `readActorPosts.dal.js` and `readPostMediaByPostIds.dal.js` — zero callers (see RISK-7).

**Duplicate model note:** Two `post.model.js` files exist — `model/post.model.js` (canonical folder) and `screens/views/tabs/post/models/post.model.js` (screen-nested). Controller uses the screen-nested version. The canonical one has no confirmed callers. This is a model layer fragmentation issue (see new RISK-14).

---

### Domain 8 — Photo Reactions

**DALs:** `listPostReactions.dal.js`, `listPostCommentsCount.dal.js`, `listPostRoseCount.dal.js`, `readPostReactions.dal.js` (STUB), `readPostRoseCounts.dal.js` (STUB)

| Layer | Files | Notes |
|---|---|---|
| **Model** | `model/photos/enrichPhotoPosts.model.js` — `enrichPhotoPostsModel({posts, reactions, commentCounts, roseCounts, viewerActorId})` | Joins photo posts with reaction metadata. Pure transform. |
| **Controller** | `controller/photos/photoReactions.controller.js` — `enrichPhotoPostsController()` | Calls all 3 live DALs in parallel (reactions, comments, roses), then applies `enrichPhotoPostsModel`. |
| **Hook** | `screens/views/tabs/photos/hooks/usePhotoReactions.js` | Calls `enrichPhotoPostsController`. |
| **Component** | `PhotoGrid.jsx` | Consumes `usePhotoReactions`. |
| **View Screen** | `screens/views/ActorProfilePhotosView.jsx` | Renders `PhotoGrid`. |

**Stub DALs:** `readPostReactions.dal.js` and `readPostRoseCounts.dal.js` return `[]` — Phase 1 stubs (see RISK-8).

---

### Domain 9 — Vibe Tags

**DALs:** `readActorVibeTags.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `screens/views/tabs/tags/model/actorVibeTags.model.js` — `buildActorVibeTagsModel({selectedRows, tagRows})` | Screen-nested model. Joins selected keys + catalog rows into tag domain objects. |
| **Controller** | `controller/tags/getActorVibeTags.controller.js` | Calls `readActorSelectedVibeTagKeysDAL` then `readVibeTagCatalogByKeysDAL` (sequential — second call depends on first). Applies `buildActorVibeTagsModel`. |
| **Hook** | `screens/views/tabs/tags/hooks/useActorVibeTags.js` | Calls `getActorVibeTags.controller.js`. |
| **View Screen** | `screens/views/ActorProfileTagsView.jsx` | Consumes `useActorVibeTags`. |

---

### Domain 10 — Vport Menu

**DALs (read):** `listVportActorMenuCategories.dal.js`, `listVportActorMenuItems.dal.js`, `readVportActorMenuCategories.dal.js`, `readVportActorMenuItems.dal.js`  
**DALs (write):** `createVportActorMenuCategory.dal.js`, `updateVportActorMenuCategory.dal.js`, `deleteVportActorMenuCategory.dal.js`, `createVportActorMenuItem.dal.js`, `updateVportActorMenuItem.dal.js`, `deleteVportActorMenuItem.dal.js`, `createVportMenuItemMedia.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/menu/VportActorMenuCategory.model.js` — `VportActorMenuCategoryModel.fromRows()` | |
| **Model** | `kinds/vport/model/menu/VportActorMenuItem.model.js` — `VportActorMenuItemModel.fromRows()` | |
| **Model** | `kinds/vport/model/menu/VportActorMenu.model.js` — `VportActorMenuModel.compose()` | Joins categories + items into structured menu. |
| **Controller (read)** | `kinds/vport/controller/menu/getVportActorMenu.controller.js` | Calls `listVportActorMenuCategoriesDAL` + `listVportActorMenuItemsDAL`. Applies all 3 menu models. Has in-memory menu cache. |
| **Controller (write)** | `kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js` | Calls create/update/readVportActorMenuCategory DALs. |
| **Controller (write)** | `kinds/vport/controller/menu/saveVportActorMenuItem.controller.js` | Calls create/update/readVportActorMenuItem DALs. |
| **Controller (write)** | `kinds/vport/controller/menu/deleteVportActorMenuCategory.controller.js` | |
| **Controller (write)** | `kinds/vport/controller/menu/deleteVportActorMenuItem.controller.js` | |
| **Controller (write)** | `kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` | Calls `vportMenuPost.read.dal.js` for prerequisite check before publishing. |
| **Hook** | `kinds/vport/hooks/menu/useVportActorMenu.js` | Calls `getVportActorMenu.controller.js`. |
| **Hook** | `kinds/vport/hooks/menu/useVportActorMenuCategoriesMutations.js` | Calls save/delete category controllers. |
| **Hook** | `kinds/vport/hooks/menu/useVportActorMenuItemsMutations.js` | Calls save/delete item controllers. |
| **Hook** | `kinds/vport/hooks/menu/usePublishMenuPost.js` | Calls `publishMenuUpdateAsPost.controller.js`. |
| **View Screen** | `kinds/vport/screens/menu/VportMenuManageView.jsx` | Owner management view — consumes mutation hooks. |
| **View Screen** | `kinds/vport/screens/menu/VportActorMenuPublicView.jsx` | Public view — consumes `useVportActorMenu`. |

---

### Domain 11 — Content Pages

**DALs:** `createVportContentPage.dal.js`, `readVportContentPage.dal.js`, `updateVportContentPage.dal.js`, `deleteVportContentPage.dal.js`, `toggleVportContentPagePublish.dal.js`, `listVportContentPages.dal.js`, `listVportPublicContentPages.dal.js`, `readVportPublicContentPage.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/content/VportContentPage.model.js` | Content page domain shape. Used by content controllers. |
| **Controller** | `kinds/vport/controller/content/listVportContentPages.controller.js` | Read — owner list. |
| **Controller** | `kinds/vport/controller/content/listVportPublicContentPages.controller.js` | Read — public list. |
| **Controller** | `kinds/vport/controller/content/createVportContentPage.controller.js` | Write + cache invalidation. |
| **Controller** | `kinds/vport/controller/content/updateVportContentPage.controller.js` | Write — calls `readVportContentPage.dal.js` for ownership check before update. |
| **Controller** | `kinds/vport/controller/content/deleteVportContentPage.controller.js` | Write — calls `readVportContentPage.dal.js` for ownership check before delete. |
| **Controller** | `kinds/vport/controller/content/toggleVportContentPagePublish.controller.js` | Write — calls `readVportContentPage.dal.js` + `listVportPublicContentPages.dal.js` + `toggleVportContentPagePublish.dal.js`. |
| **Controller** | `kinds/vport/controller/content/readVportPublicContentPage.controller.js` | Read — single public page. |
| **Hook** | `kinds/vport/screens/content/hooks/useVportContentPages.js` | Calls all owner-mode controllers. |
| **Hook** | `kinds/vport/screens/content/hooks/useVportPublicContent.js` | Calls `listVportPublicContentPages.controller.js`. |
| **Hook** | `kinds/vport/hooks/content/useVportPublicContentPage.js` | Calls `readVportPublicContentPage.controller.js`. |
| **View Screen** | `kinds/vport/screens/content/VportContentManageView.jsx` | Owner view. Nested inside `VportContentView.jsx`. |
| **View Screen** | `kinds/vport/screens/content/VportContentPublicView.jsx` | Public list view. |
| **Component** | `kinds/vport/screens/content/VportContentPageViewer.jsx` | Public single page — consumes `useVportPublicContentPage`. |

---

### Domain 12 — Rates

**DALs:** `readVportRatesByActor.dal.js`, `upsertVportRate.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/rates/vportRates.model.js` — `mapVportRateRows()`, `computeLastUpdated()` | Transforms raw rate rows into domain objects, computes last-updated timestamp. |
| **Controller** | `kinds/vport/controller/rates/getVportRates.controller.js` | Calls `readVportRatesByActorDal`, applies `mapVportRateRows` + `computeLastUpdated`. |
| **Controller** | `kinds/vport/controller/rates/upsertVportRate.controller.js` | Calls `upsertVportRateDal`. No model. |
| **Hook** | `kinds/vport/hooks/rates/useVportRates.js` | Calls `getVportRates.controller.js`. |
| **Hook** | `kinds/vport/hooks/rates/useUpsertVportRate.js` | Calls `upsertVportRate.controller.js`. |
| **Adapter** | `adapters/kinds/vport/hooks/rates/useUpsertVportRate.js.adapter.js` | Cross-feature adapter wrapper. |
| **View Screen** | `kinds/vport/screens/rates/view/VportRatesView.jsx` | Consumes both hooks. |

---

### Domain 13 — Services

**DALs:** `readVportServicesByActor.dal.js`, `readVportServiceCatalogByType.dal.js`, `readVportServiceAddonsByActor.dal.js`, `readVportTypeByActorId.dal.js`, `upsertVportServicesByActor.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/services/vportService.model.js` — `resolveVportServicesFromCatalog()`, `groupVportServiceAddonsByParent()` | Merges actor services with service catalog fallbacks. Groups addons by parent service. |
| **Model** | `kinds/vport/model/services/vportServiceCatalogFallback.model.js` — `getFallbackServiceCatalogRows()` | Provides hardcoded fallback catalog rows when DB catalog is empty. |
| **Controller** | `kinds/vport/controller/services/getVportServices.controller.js` | Calls `readVportTypeByActorId` (if type not passed), `readVportServiceCatalogByType`, `readVportServicesByActor`, `readVportServiceAddonsByActor`. Applies both service models. 60s TTL cache. |
| **Controller** | `kinds/vport/controller/services/upsertVportServices.controller.js` | Calls `upsertVportServicesByActorDal`. |
| **Controller** | Various addon controllers (`createOrUpdateVportServiceAddon`, `deleteVportServiceAddon`, `reorderVportServiceAddon`) | No DALs from this feature — use booking/vport DALs |
| **Hook** | `kinds/vport/hooks/services/useVportServices.js` | Calls `getVportServices.controller.js`. |
| **Hook** | `kinds/vport/hooks/services/useUpsertVportServices.js` | Calls `upsertVportServices.controller.js`. |
| **Adapter** | `adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter.js` | |
| **View Screen** | `kinds/vport/screens/services/view/VportServicesView.jsx` | |

---

### Domain 14 — Gas / Fuel Prices

**DALs (read):** `vportFuelPrices.read.dal.js`, `vportFuelPriceSubmissions.read.dal.js`, `vportStationPriceSettings.read.dal.js`, `vportFuelPricePost.read.dal.js`  
**DALs (write):** `vportFuelPrices.write.dal.js`, `vportFuelPriceSubmissions.write.dal.js`, `vportFuelPriceHistory.write.dal.js`, `vportFuelPriceReviews.write.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/gas/vportFuelPrice.model.js` — `mapVportFuelPriceRows()` | |
| **Model** | `kinds/vport/model/gas/vportFuelPriceSubmission.model.js` — `mapFuelPriceSubmissionRows()` | |
| **Model** | `kinds/vport/model/gas/vportStationPriceSettings.model.js` — `mapVportStationPriceSettingsRow()` | |
| **Model** | `kinds/vport/model/gas/getVportTabsByType.model.js` | Tab visibility config by vport type — consumed by gas view. |
| **Controller (read)** | `kinds/vport/controller/gas/getVportGasPrices.controller.js` | Orchestrates all 3 read DALs + applies all 3 models. Computes `latestPendingByFuelKey`. |
| **Controller (write)** | `kinds/vport/controller/gas/submitFuelPriceSuggestion.controller.js` | Calls `vportFuelPriceSubmissions.write.dal.js`. |
| **Controller (write)** | `kinds/vport/controller/gas/reviewFuelPriceSuggestion.controller.js` | Calls `vportFuelPriceReviews.write.dal.js` + `vportFuelPriceHistory.write.dal.js`. |
| **Controller (write)** | `kinds/vport/controller/gas/updateStationFuelUnit.controller.js` | Calls `vportFuelPrices.write.dal.js`. |
| **Controller (write)** | `kinds/vport/controller/gas/publishFuelPriceUpdateAsPost.controller.js` | Calls `vportFuelPricePost.read.dal.js` (prerequisite check) + `vportFuelPrices.write.dal.js` + `vportFuelPriceHistory.write.dal.js`. |
| **Hook** | `kinds/vport/hooks/gas/useVportGasPrices.js` | Calls `getVportGasPrices.controller.js`. |
| **Hook** | `kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.js` | Calls submit controller. |
| **Hook** | `kinds/vport/hooks/gas/useOwnerPendingSuggestions.js` | Calls review controller. |
| **Hook** | `kinds/vport/hooks/gas/useUpdateStationFuelUnit.js` | Calls unit update controller. |
| **Adapter** | `adapters/kinds/vport/hooks/gas/useVportGasPrices.adapter.js` | |
| **Adapter** | `adapters/kinds/vport/hooks/gas/useOwnerPendingSuggestions.adapter.js` | |
| **Adapter** | `adapters/kinds/vport/hooks/gas/useSubmitFuelPriceSuggestion.adapter.js` | |
| **View Screen** | `kinds/vport/screens/gas/view/VportGasPricesView.jsx` | Public gas prices view — consumes `useVportGasPrices`. |
| **Final Screen** | `kinds/vport/screens/gas/screens/VportGasPricesScreen.jsx` | |

---

### Domain 15 — Locksmith

**DALs (read):** `locksmithServiceAreas.read.dal.js`, `locksmithServiceDetails.read.dal.js`, `readVportServicesByActor.dal.js` (also in services domain)  
**DALs (write):** `locksmithServiceAreas.write.dal.js`, `locksmithServiceDetails.write.dal.js`, `locksmithPortfolioDetails.write.dal.js`, `vportLocksmithPost.read.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/locksmith/locksmithServiceDefaults.model.js` | Locksmith-specific domain model. |
| **Inline transforms** | `kinds/vport/controller/locksmith/getLocksmithProfile.controller.js` contains `mapServiceArea()` and `mapServiceDetail()` inline | These are domain row-to-object transforms defined inside the controller — should be in a locksmith model file (see new RISK-14). |
| **Controller (read)** | `kinds/vport/controller/locksmith/getLocksmithProfile.controller.js` | Calls `dalListLocksmithServiceAreas` + `dalListLocksmithServiceDetails` + `readVportServicesByActor`. Applies inline transforms. |
| **Controller (write)** | `kinds/vport/controller/locksmith/locksmithOwner.controller.js` | Calls locksmith write DALs. |
| **Controller (write)** | `kinds/vport/controller/locksmith/publishLocksmithHoursUpdateAsPost.controller.js` | Calls `vportLocksmithPost.read.dal.js`. |
| **Controller (write)** | `kinds/vport/controller/locksmith/publishLocksmithPortfolioUpdateAsPost.controller.js` | Calls `vportLocksmithPost.read.dal.js`. |
| **Controller (write)** | `kinds/vport/controller/locksmith/publishLocksmithServiceAreaUpdateAsPost.controller.js` | Calls `vportLocksmithPost.read.dal.js`. |
| **Hook** | `kinds/vport/hooks/locksmith/useLocksmithProfile.js` | Calls `getLocksmithProfile.controller.js`. |
| **Hook** | `kinds/vport/hooks/locksmith/useLocksmithOwner.js` | Calls `locksmithOwner.controller.js`. |
| **Hook** | `kinds/vport/hooks/locksmith/usePublishLocksmithPost.js` | Calls the publish-as-post controllers. |

---

### Domain 16 — Reviews

**DALs:** `reviewTarget.read.dal.js`, `vportReviewAuthors.read.dal.js` (DEAD), `vportReviews.write.dal.js` (DEAD)

| Layer | Files | Notes |
|---|---|---|
| **Model** | `kinds/vport/model/review/VportReview.model.js` | Review domain shape. |
| **Controller** | `kinds/vport/controller/review/VportReviews.controller.js` | Calls `dalReadReviewTargetActor` (from `reviewTarget.read.dal.js`) to resolve subtype. Delegates all DB operations to `@reviews` engine (`getReviewFormConfig`, `listReviews`, `submitReview`, `deleteReview`, `getMyActiveReview`). Contains internal mapping helpers in a separate `vportReviews.mappers` file. |
| **Controller** | `kinds/vport/controller/review/VportServiceReviews.controller.js` | Engine-backed read path. |
| **Hook** | `kinds/vport/hooks/review/useVportReviews.js` | Calls `VportReviews.controller.js`. |
| **Hook** | `kinds/vport/hooks/review/useVportReviewList.js` | Calls service reviews controller. |
| **Hook** | `kinds/vport/hooks/review/useVportReviewMine.js` | Calls `getMyActiveReview` path. |
| **View Screen** | `kinds/vport/screens/review/VportReviewsView.jsx` | |

**Dead DALs:** `vportReviewAuthors.read.dal.js` and `vportReviews.write.dal.js` — engine takeover (see RISK-10).

---

### Domain 17 — Subscribers

**DALs:** `subscribersCount.dal.js`, `subscribersList.dal.js`

| Layer | Files | Notes |
|---|---|---|
| **Model** | None | Raw rows returned directly — no domain transform. |
| **Controller** | `kinds/vport/controller/subscribers/getSubscribers.controller.js` | Calls both DALs in parallel. Returns `{count, rows}`. |
| **Hook** | `kinds/vport/hooks/subscribers/useSubscribers.js` | Calls `getSubscribers.controller.js`. |
| **View Screen** | `kinds/vport/screens/views/tabs/VportSubscribersView.jsx` | Consumes `useSubscribers`. |

---

### Domain 18 — Barbershop / Exchange Post Guards

**DALs:** `vportBarbershopPost.read.dal.js`, `vportExchangeRatePost.read.dal.js`

These DALs are **prerequisite-check** reads — they verify whether a qualifying post already exists before allowing a new one to be published. No model transforms involved.

| Layer | Files | Notes |
|---|---|---|
| **Model** | None | Raw boolean check — no transform. |
| **Controller** | `kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js` | Calls `hasRecentBarbershopHoursPostDAL` + `resolveVportBarbershopNameDAL` as prerequisites. |
| **Controller** | `kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js` | Calls `hasRecentBarbershopPortfolioPostDAL`. |
| **Controller** | `kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` | Calls `hasRecentExchangeRatePostDAL`. |
| **Hook** | `kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js` | |
| **Hook** | `kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js` | |
| **Hook** | `kinds/vport/hooks/exchange/usePublishExchangeRatePost.js` | |
| **Final Screen** | `VportDashboardCalendarScreen.jsx`, `VportDashboardPortfolioScreen.jsx`, `VportDashboardExchangeScreen.jsx` | |

---

## New Risk Findings from Pipeline Trace

### RISK-14 — Multiple Layer Violations Identified During Pipeline Trace
**Severity:** MEDIUM  
**Classification:** LAYER VIOLATIONS (consolidated)  

The following new violations were confirmed during source read:

| Location | Violation | Detail |
|---|---|---|
| `controller/getProfileView.controller.js` | Zustand store access in controller | Calls `useActorStore.getState().upsertActors()` — Zustand is UI-layer state, not controller concern. |
| `controller/getProfileView.controller.js` | Vport profile shape built inline | Domain row → object transform for vport actors built inline in controller. Should be a model function alongside `ProfileModel`. |
| `controller/friends/getTopFriendActorIds.controller.js` | Unguarded `console.warn` | `console.warn("[getTopFriendActorIdsController] reconcile fallback..."`) — no `import.meta.env.DEV` guard. Policy violation. |
| `kinds/vport/controller/locksmith/getLocksmithProfile.controller.js` | Domain transforms inline in controller | `mapServiceArea()` and `mapServiceDetail()` are domain row-to-object transforms defined inside the controller. Should be in `locksmith/` model files. |
| `screens/views/tabs/post/models/post.model.js` | Screen-nested model file | `post.model.js` inside `screens/views/tabs/post/models/` is the version actually used by the controller — while `model/post.model.js` in the canonical folder has no confirmed callers. Two post models exist; the canonical location is unused. |

**Recommended actions (separate per item):**
1. Move vport profile inline transform from `getProfileView.controller.js` to a new `model/vportProfileView.model.js`.
2. Move `mapServiceArea` and `mapServiceDetail` from `getLocksmithProfile.controller.js` to `kinds/vport/model/locksmith/locksmithServiceDefaults.model.js` (or a new `locksmithProfile.model.js`).
3. Remove `console.warn` from `getTopFriendActorIds.controller.js`.
4. Consolidate the two `post.model.js` files — determine which is authoritative, delete the other, update the controller import.

## Codex Fix Pass — 2026-05-11

### Files Changed
| File | Change |
|---|---|
| `apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js` | Removed direct Zustand actor-store import from the DAL; the DAL now accepts controller-provided cached author data and falls back to DB reads. Also DEV-gated the post media fallback warning. |
| `apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js` | Builds the cached author entry from the actor store and passes it into `fetchPostsForActorDAL`, preserving the previous 0-RTT author cache path while keeping the DAL pure from UI state. |
| `apps/VCSM/src/features/profiles/controller/friends/getTopFriendActorIds.controller.js` | DEV-gated the reconcile fallback warning. |
| `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` | DEV-gated the existing diagnostic `console.log`; file was not deleted under the no-delete instruction. |
| `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md` | Appended this fix-pass record only; no prior audit content was removed. |

### Findings Addressed
| Finding | Status | Notes |
|---|---|---|
| RISK-11: `fetchPostsForActor.dal.js` imports Zustand store | DONE | Verified `useActorStore` no longer appears in `fetchPostsForActor.dal.js`. Controller still owns store access as before, and passes cached author data as a DAL parameter. |
| `fetchPostsForActor.dal.js` post media fallback warning | DONE | Warning remains available in DEV only; fallback behavior unchanged. |
| RISK-14: unguarded `console.warn` in `getTopFriendActorIds.controller.js` | DONE | Reconcile fallback still occurs; warning is DEV-only. |
| RISK-9: dead `actorOwners.read.dal.js` contains `console.log` | PARTIAL | Log is DEV-gated. File deletion is deferred because this pass is append-only/no-delete and SENTRY confirmation is required. |
| RISK-7: `readActorPosts.dal.js` and `readPostMediaByPostIds.dal.js` dead | DEFERRED | Current search confirms `readPostMediaByPostIdsDAL` is only used by `readActorPosts.dal.js`; no deletion performed. |
| RISK-8: `readPostReactions.dal.js` and `readPostRoseCounts.dal.js` stubs | DEFERRED | Stub files remain; feature fate requires IRONMAN/product ownership. |
| RISK-10: `vportReviews.write.dal.js` and `vportReviewAuthors.read.dal.js` bypassed by reviews engine | DEFERRED | Current search confirms no production callers for the listed exports; deletion requires SENTRY/engine coverage confirmation. |
| RISK-12: screen-nested re-export shims | DEFERRED | Current search confirms diagnostics-only consumers under `dev/diagnostics/groups/profilesFeature.group.js`; no deletion/import churn under no-delete instruction. |
| RISK-13: `friendGraph.utils.js` misplaced duplicate | DEFERRED | Current search confirms canonical model exists and utils file remains diagnostics/dead; no deletion performed. |
| Original scanner flag: `checkActorOwnership.dal.js` business logic | DOCUMENTED FALSE POSITIVE | Existing pipeline trace says ownership/role/status checks are in `checkActorOwnership.controller.js`, not the DAL. No code change needed. |
| Original scanner flags: locksmith/content DAL business logic | DEFERRED | Moving row transforms or ownership checks requires focused SENTRY review; no broad refactor in this pass. |
| RISK-14: controller-level store access and inline transforms/model fragmentation | PARTIAL / DEFERRED | DAL store import was removed. Remaining controller/store and model consolidation items require broader architecture work. |

### Verification
- Commands/searches run:
  - `wc -l zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '1,240p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '241,520p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '521,880p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '881,1240p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '1241,1600p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '1601,1960p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '1961,2320p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '2321,2680p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '2681,3105p' zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `rg -n "RISK-|Recommended action|CONFIRMED DEAD|STUB|BYPASSED|console\\.log|Imports Zustand|cross-feature|business logic|DELETE|Remove|adapter|violat|pending|PENDING|false positive|drift" zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.profiles.md`
  - `sed -n '1,280p' apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
  - `sed -n '280,380p' apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js`
  - `sed -n '1,180p' apps/VCSM/src/features/profiles/controller/post/getActorPosts.controller.js`
  - `sed -n '1,95p' apps/VCSM/src/features/profiles/controller/friends/getTopFriendActorIds.controller.js`
  - `sed -n '1,60p' apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`
  - `rg -n "useActorStore" apps/VCSM/src/features/profiles/dal/post/fetchPostsForActor.dal.js || true`
  - `rg -n "readActorPostsDAL|readPostMediaByPostIdsDAL|readPostReactionsDAL|readPostRoseCountsDAL|dalReadActorOwnerRow|dalGetReviewAuthorCards|dalInsertVportReviewRow|friendGraph\\.utils|fetchPostsForActorDAL|screens/views/tabs/.*/dal|screens/views/tabs/.*/controller" apps/VCSM/src --glob '*.js' --glob '*.jsx'`
  - `npm run build` (first run failed on a local `authorActorEntry` naming collision; fixed)
  - `npm run build` (second run passed)
- Production callers checked:
  - `fetchPostsForActorDAL`: live through `features/profiles/controller/post/getActorPosts.controller.js`.
  - `readActorPostsDAL`: no production caller found; it references `readPostMediaByPostIdsDAL`.
  - `readPostMediaByPostIdsDAL`: only referenced by dead `readActorPosts.dal.js`.
  - `readPostReactionsDAL` / `readPostRoseCountsDAL`: no live callers found.
  - `dalReadActorOwnerRow` in profiles rates DAL: no production caller found; similarly named functions exist in other features but do not import this file.
  - `vportReviews.write.dal.js` / `vportReviewAuthors.read.dal.js`: exports found, no production callers found.
  - Screen-nested DAL/controller shims: diagnostics imports found in `dev/diagnostics/groups/profilesFeature.group.js`.
- Remaining risks:
  - No dead/stub/shim files were deleted due to the no-delete instruction.
  - Controller-level `useActorStore.getState()` remains in `getActorPosts.controller.js` and `getProfileView.controller.js`; deeper ownership belongs to SENTRY architecture review.
  - Inline transforms and duplicate post models remain unresolved.
  - Build passed; existing Vite chunk-size warnings and the pre-existing `VerifyEmailRequiredScreen.jsx` mixed static/dynamic import warning remain.

### Status
PARTIAL
