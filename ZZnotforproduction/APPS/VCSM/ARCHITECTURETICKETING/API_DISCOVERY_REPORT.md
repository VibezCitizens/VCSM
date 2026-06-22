# SCANNER-API-DISCOVERY-001: API Discovery Report
## Generated: 2026-06-07
## App: VCSM

---

## 1. Executive Summary

### Discovery Totals

| Dimension | Count |
|---|---|
| RPCs discovered | 45 (raw match lines; ~22 unique names) |
| Unique tables accessed | 76 |
| Edge functions | 8 |
| HTTP endpoints | 7 |
| Adapters | 97 |
| Controllers | 163 |
| Cross-feature imports (total) | 402 |
| Cross-feature imports (compliant) | 389 |
| Cross-feature violations | 13 |
| Monitoring coverage | 11.11% (4 of 36 features) |

### Security Findings Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 1 |
| MEDIUM | 4 |
| LOW | 2 |
| INFO | 1 |

### Top 3 Architectural Risks

1. **VPORT ownership gap at DAL write layer (HIGH):** `vport.core.dal.js` `updateVport()` has no owner constraint in its UPDATE query. Any authenticated session that knows a target `vportId` can overwrite any other user's VPORT record. This is a full IDOR on a platform-central resource.

2. **Monitoring blind spot — 89% of features have zero error observability:** Only `auth`, `booking`, `identity`, and `debug` emit monitoring signals. All 32 other features including `moderation`, `upload`, `post`, `social`, `settings`, and `notifications` are dark. Production failures in these features are invisible without DB-level logs.

3. **13 cross-feature architecture violations including direct model imports and controller bypasses:** The `profiles` feature imports directly from `booking` internal model files (bypassing adapters) across 9 call sites. One `wanders` hook imports a `public` controller directly. Two `settings` controller imports reach directly into `social` DAL files. These create hidden coupling that breaks the adapter boundary contract.

---

## 2. RPC Inventory

| RPC Name | Feature | File | Layer | Called By | Purpose |
|---|---|---|---|---|---|
| block_actor | settings | settings/privacy/dal/blocks.dal.js | dal | dalInsertBlock | Block an actor via moderation schema RPC |
| unblock_actor | settings | settings/privacy/dal/blocks.dal.js | dal | dalDeleteBlockByTarget | Unblock a previously blocked actor |
| soft_delete_citizen_account | settings | settings/account/dal/account.write.dal.js | dal | dalSoftDeleteCitizenAccount | Soft-delete the authenticated citizen's account |
| soft_delete_vport | settings | settings/account/dal/account.write.dal.js | dal | dalDeleteMyVport | Soft-delete a specific vport by ID |
| restore_vport | settings | settings/account/dal/account.write.dal.js | dal | dalRestoreVport | Restore a soft-deleted vport by ID |
| hard_delete_vport | settings | settings/account/dal/account.write.dal.js | dal | dalHardDeleteVport | Permanently hard-delete a vport by ID |
| set_business_card_publish_state | settings | settings/vports/dal/vports.write.dal.js | dal | setVportBusinessCardPublishStateDAL | Toggle published/unpublished state of a vport business card |
| post_reactors_summary_one | post | post/postcard/dal/postReactions.read.dal.js | dal | UNKNOWN | Read a summary of reactors for a single post |
| provision_vcsm_identity | identity | identity/dal/provision.rpc.dal.js | dal | dalProvisionVcsmIdentity | Provision a full VCSM identity row for a user+actor pair |
| refresh_actor_directory_row | identity | identity/dal/refreshActorDirectory.dal.js | dal | UNKNOWN | Refresh a single actor's row in the identity directory |
| search_actor_directory | chat | chat/setup.js | other | UNKNOWN | Search the actor directory for chat recipient lookup |
| generate_username | auth | auth/dal/onboarding.dal.js | dal | generateUsernameDAL | Generate a unique username during onboarding |
| create_actor_for_user | auth | auth/dal/actorCreate.dal.js | dal | UNKNOWN | Create an actor record for a user profile |
| create_vport | vport | vport/dal/vport.core.dal.js | dal | UNKNOWN | Create a new vport with a generated slug |
| soft_delete_vport | vport | vport/dal/vport.core.dal.js | dal | softDeleteVport | Soft-delete a vport by ID |
| hard_delete_vport | vport | vport/dal/vport.core.dal.js | dal | hardDeleteVport | Permanently hard-delete a vport by ID |
| restore_vport | vport | vport/dal/vport.core.dal.js | dal | restoreVport | Restore a soft-deleted vport by ID |
| search_actor_directory | explore | explore/dal/search.dal.js | dal | UNKNOWN | Search the actor directory for explore/discovery |
| get_follower_count | social | social/friend/subscribe/dal/subscriberCount.dal.js | dal | UNKNOWN | Get follower count for an actor |
| get_actor_social_public_policy | social | social/privacy/dal/actorSocialPublicPolicy.dal.js | dal | UNKNOWN | Fetch an actor's social public policy |
| can_view_actor_signal | social | social/privacy/dal/actorSignalVisibility.dal.js | dal | dalCanViewActorSignal | Check whether viewer can see a signal for a target actor |
| get_business_card_sections | public | public/vportBusinessCard/dal/businessCardSections.read.dal.js | dal | readBusinessCardSectionsDAL | Read the ordered sections of a vport business card |
| submit_business_card_lead | public | public/vportBusinessCard/dal/vportBusinessCardLead.write.dal.js | dal | UNKNOWN | Submit a lead from a public vport business card page |
| read_business_card_public | public | public/vportBusinessCard/dal/vportBusinessCard.read.dal.js | dal | readVportBusinessCardPublicBySlugDAL | Read a vport business card by slug for public display |
| search_actor_directory | actors | actors/dal/searchActors.dal.js | dal | UNKNOWN | Search actor directory with public/all filter |
| list_vport_subscribers | profiles | profiles/kinds/vport/dal/subscribersList.dal.js | dal | dalListVportSubscribers | List paginated subscribers for a vport actor |
| count_vport_subscribers | profiles | profiles/kinds/vport/dal/subscribersCount.dal.js | dal | UNKNOWN | Count subscribers for a vport actor |
| save_friend_ranks | profiles | profiles/dal/friends/friendRanks.write.dal.js | dal | UNKNOWN | Save ordered friend rank list for an actor |
| get_friend_ranks | profiles | profiles/dal/friends/friendRanks.reconcile.dal.js | dal | reconcileFriendRanks | Fetch current friend ranks for reconciliation |
| save_friend_ranks | profiles | profiles/dal/friends/friendRanks.reconcile.dal.js | dal | reconcileFriendRanks | Persist reconciled friend ranks back to DB |
| get_friend_ranks | profiles | profiles/dal/friends/friends.read.dal.js | dal | readFriendRankRows | Read ordered friend rank rows for a profile owner |
| create_event | notifications | notifications/runtime/notificationRuntime.dal.js | dal | insertNotificationEventDAL | Create a notification event record |
| insert_recipients | notifications | notifications/runtime/notificationRuntime.dal.js | dal | insertNotificationRecipientsDAL | Insert recipient rows for a notification event |
| upsert_rendered | notifications | notifications/runtime/notificationRuntime.dal.js | dal | upsertNotificationRenderedDAL | Upsert rendered notification content for a recipient |
| insert_inbox_item | notifications | notifications/runtime/notificationRuntime.dal.js | dal | insertNotificationInboxItemDAL | Insert an inbox item for a notification recipient |
| update_recipient_status | notifications | notifications/runtime/notificationRuntime.dal.js | dal | updateNotificationRecipientStatusDAL | Update delivery status of a notification recipient |
| search_actor_directory | upload | upload/dal/searchMentionSuggestions.dal.js | dal | UNKNOWN | Search actor directory for @mention completions |
| block_actor | block | block/dal/block.write.dal.js | dal | UNKNOWN | Block an actor with self-block guard |
| unblock_actor | block | block/dal/block.write.dal.js | dal | UNKNOWN | Unblock a previously blocked actor |
| is_current_user_moderator | moderation | moderation/dal/assertModerationAccess.dal.js | dal | isModerationAuthorizedDAL | Check whether current auth.uid() is a moderator |
| create_vport | dev | dev/diagnostics/groups/vports.group.js | other | UNKNOWN | Diagnostics: create a test vport for dev seeding |
| save_friend_ranks | dev | dev/diagnostics/groups/blockGroup.helpers.js | other | UNKNOWN | Diagnostics: save friend ranks for block test setup |
| save_friend_ranks | dev | dev/diagnostics/groups/socialGroup.friendRankTest.js | other | UNKNOWN | Diagnostics: test save_friend_ranks RPC directly |
| create_actor_for_user | dev | dev/diagnostics/helpers/ensureActorContext.js | other | createUserActorViaLegacyRpc | Diagnostics: create an actor via legacy RPC path |
| create_vport | dev | dev/diagnostics/helpers/ensureVportSeed.js | other | UNKNOWN | Diagnostics: seed a vport for dev test setup |

---

## 3. Table Access Inventory

| Table | Operation | Feature | File | Layer | Actor Check | Auth UID |
|---|---|---|---|---|---|---|
| profiles | select | settings/profile | settings/profile/dal/profile.read.dal.js | dal | N | N |
| profiles | update | settings/profile | settings/profile/dal/profile.write.dal.js | dal | N | Y |
| profiles | update | settings/profile | settings/profile/dal/profileMediaAsset.write.dal.js | dal | N | Y |
| actors | select | settings/profile | settings/profile/dal/actors.read.dal.js | dal | N | N |
| actors | select | settings/profile | settings/profile/dal/actorIdBySubject.read.dal.js | dal | N | N |
| actor_privacy_settings | select | settings/privacy | settings/privacy/dal/visibility.dal.js | dal | Y | N |
| actor_privacy_settings | upsert | settings/privacy | settings/privacy/dal/visibility.dal.js | dal | Y | N |
| blocks | select | settings/privacy | settings/privacy/dal/blocks.dal.js | dal | Y | N |
| actors | select | settings/privacy | settings/privacy/dal/blocks.dal.js | dal | N | N |
| actors | select | settings/account | settings/account/dal/account.read.dal.js | dal | N | N |
| profile_public_details | select | settings/profile | settings/profile/dal/vportPublicDetails.read.dal.js | dal | N | N |
| actor_owners | select | settings/vports | settings/vports/dal/vports.read.dal.js | dal | N | Y |
| profiles | select | settings/vports | settings/vports/dal/vports.read.dal.js | dal | N | Y |
| profiles | update | settings/vports | settings/vports/dal/vports.write.dal.js | dal | N | Y |
| profile_public_details | update | settings/vports | settings/vports/dal/vports.write.dal.js | dal | N | Y |
| actor_owners | select | settings/vports | settings/vports/dal/actorOwners.read.dal.js | dal | N | N |
| notifications | select | professional/briefings | professional/briefings/dal/professionalBriefings.read.dal.js | dal | Y | N |
| notifications | update | professional/briefings | professional/briefings/dal/professionalBriefings.read.dal.js | dal | Y | N |
| posts | select | post | post/postcard/dal/post.read.dal.js | dal | N | N |
| posts | update | post | post/postcard/dal/post.write.dal.js | dal | Y | N |
| post_mentions | delete | post | post/postcard/dal/post.write.dal.js | dal | Y | N |
| actor_directory | select | post | post/postcard/dal/post.write.dal.js | dal | N | N |
| post_mentions | insert | post | post/postcard/dal/postMentions.write.dal.js | dal | N | N |
| post_rose_gifts | select | post | post/postcard/dal/roseGifts.actor.dal.js | dal | Y | N |
| post_rose_gifts | insert | post | post/postcard/dal/roseGifts.actor.dal.js | dal | Y | N |
| post_reactions | select | post | post/postcard/dal/postReactions.read.dal.js | dal | Y | N |
| post_reactions | insert | post | post/postcard/dal/postReactions.write.dal.js | dal | Y | N |
| post_reactions | update | post | post/postcard/dal/postReactions.write.dal.js | dal | Y | N |
| post_reactions | delete | post | post/postcard/dal/postReactions.write.dal.js | dal | Y | N |
| blocks | select | post | post/postcard/dal/postVisibility.dal.js | dal | Y | N |
| actor_privacy_settings | select | post | post/postcard/dal/postVisibility.dal.js | dal | Y | N |
| actor_follows | select | post | post/postcard/dal/postVisibility.dal.js | dal | Y | N |
| post_comments | insert | post | post/commentcard/dal/comments.dal.js | dal | Y | N |
| post_comments | update | post | post/commentcard/dal/comments.dal.js | dal | Y | N |
| post_comments | select | post | post/commentcard/dal/comments.dal.js | dal | Y | N |
| post_comments | select | post | post/commentcard/dal/postComments.read.dal.js | dal | N | N |
| post_comments | insert | post | post/commentcard/dal/postComments.read.dal.js | dal | N | N |
| post_comments | select | post | post/commentcard/dal/postComments.count.dal.js | dal | N | N |
| comment_likes | select | post | post/commentcard/dal/commentLikes.dal.js | dal | Y | N |
| comment_likes | insert | post | post/commentcard/dal/commentLikes.dal.js | dal | Y | N |
| comment_likes | delete | post | post/commentcard/dal/commentLikes.dal.js | dal | Y | N |
| bookings | insert | booking | booking/dal/insertBooking.dal.js | dal | N | N |
| bookings | update | booking | booking/dal/updateBookingStatus.dal.js | dal | N | N |
| bookings | select | booking | booking/dal/listBookingsByCustomer.dal.js | dal | Y | N |
| bookings | select | booking | booking/dal/listBookingsByResource.dal.js | dal | Y | N |
| bookings | select | booking | booking/dal/listBookingsInRange.dal.js | dal | Y | N |
| availability_rules | upsert | booking | booking/dal/upsertAvailabilityRule.dal.js | dal | N | N |
| availability_rules | select | booking | booking/dal/listAvailabilityRules.dal.js | dal | Y | N |
| availability_exceptions | upsert | booking | booking/dal/upsertAvailabilityException.dal.js | dal | N | N |
| availability_exceptions | select | booking | booking/dal/listAvailabilityExceptionsInRange.dal.js | dal | Y | N |
| resource_services | upsert | booking | booking/dal/upsertBookingResourceServices.dal.js | dal | N | N |
| resource_services | select | booking | booking/dal/readResourceServicesByResource.dal.js | dal | Y | N |
| service_booking_profiles | update | booking | booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js | dal | N | N |
| service_booking_profiles | insert | booking | booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js | dal | N | N |
| service_booking_profiles | select | booking | booking/dal/readBookingServiceProfiles.dal.js | dal | N | N |
| profiles | select | booking | booking/dal/readVportProfileByActorId.dal.js | dal | N | N |
| resources | insert | booking | booking/dal/insertBookingResource.dal.js | dal | N | N |
| resources | select | booking | booking/dal/listResourcesByActor.dal.js | dal | Y | N |
| services | select | booking | booking/dal/readVportServicesByActor.dal.js | dal | Y | N |
| actor_owners | select | booking | booking/dal/readOwnerLinkByActorAndSession.dal.js | dal | Y | Y |
| profiles | select | auth | auth/dal/profile.dal.js | dal | N | N |
| profiles | update | auth | auth/dal/profile.dal.js | dal | N | N |
| profiles | upsert | auth | auth/dal/onboarding.dal.js | dal | N | Y |
| profiles | upsert | auth | auth/dal/register.dal.js | dal | N | N |
| actors | select | auth | auth/dal/actorGetByProfile.dal.js | dal | N | N |
| actor_owners | upsert | auth | auth/dal/actorOwnerCreate.dal.js | dal | N | N |
| vibe_invites | select | initiation | initiation/dal/vibeInvites.dal.js | dal | N | N |
| vibe_invites | update | initiation | initiation/dal/vibeInvites.dal.js | dal | N | N |
| vibe_tags | select | initiation | initiation/dal/vibeTags.dal.js | dal | N | N |
| vibe_actor_tags | select | initiation | initiation/dal/vibeTags.dal.js | dal | Y | N |
| vibe_actor_tags | update | initiation | initiation/dal/vibeTags.dal.js | dal | Y | N |
| vibe_actor_tags | upsert | initiation | initiation/dal/vibeTags.dal.js | dal | Y | N |
| actor_onboarding_steps | select | initiation | initiation/dal/onboardingSteps.dal.js | dal | Y | N |
| actor_onboarding_steps | upsert | initiation | initiation/dal/onboardingSteps.dal.js | dal | Y | N |
| onboarding_steps | select | initiation | initiation/dal/onboardingSteps.dal.js | dal | N | N |
| actors | select | initiation | initiation/dal/profileCompletion.dal.js | dal | Y | N |
| profiles | select | initiation | initiation/dal/profileCompletion.dal.js | dal | N | N |
| actor_follows | upsert | social | social/friend/request/dal/actorFollows.dal.js | dal | Y | N |
| actor_follows | update | social | social/friend/request/dal/actorFollows.dal.js | dal | Y | N |
| actor_follows | select | social | social/friend/request/dal/actorFollows.dal.js | dal | Y | N |
| social_follow_requests | select | social | social/friend/request/dal/followRequests.dal.js | dal | Y | N |
| social_follow_requests | upsert | social | social/friend/request/dal/followRequests.dal.js | dal | Y | N |
| social_follow_requests | update | social | social/friend/request/dal/followRequests.dal.js | dal | Y | N |
| actor_social_settings | select | social | social/privacy/dal/actorSocialSettings.dal.js | dal | Y | N |
| actor_social_settings | update | social | social/privacy/dal/actorSocialSettings.dal.js | dal | Y | N |
| actor_onboarding_steps | select | feed | feed/dal/feedWelcomeCard.dal.js | dal | Y | N |
| actor_onboarding_steps | upsert | feed | feed/dal/feedWelcomeCard.dal.js | dal | Y | N |
| posts | select | explore | explore/dal/search.dal.js | dal | N | N |
| user_app_actor_links | select | identity | identity/resolvers/vcsmIdentity.resolver.js | dal | N | N |
| profile_actor_access | select | hydration | hydration/vcsmActorHydrator.js | other | N | N |
| actors | select | chat | chat/setup.js | other | N | N |
| blocks | select | chat | chat/setup.js | other | N | N |
| inbox_entries | select | chat | chat/inbox/dal/inboxUnread.read.dal.js | dal | Y | N |
| message_attachments | update | chat | chat/conversation/dal/updateAttachmentMediaAsset.write.dal.js | dal | N | N |
| bookings | insert | vportDashboard | vportDashboard/dashboard/cards/bookings/dal/insertVportBooking.write.dal.js | dal | N | N |
| bookings | update | vportDashboard | vportDashboard/dal/write/updateVportBooking.write.dal.js | dal | Y | N |
| business_card_leads | select | vportDashboard | vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal.js | dal | Y | N |
| business_card_leads | update | vportDashboard | vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal.js | dal | Y | N |
| business_card_leads | delete | vportDashboard | vportDashboard/dashboard/cards/leads/dal/vportLeads.write.dal.js | dal | Y | N |
| resources | insert | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js | dal | Y | N |
| resources | update | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js | dal | Y | N |
| resources | delete | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeam.write.dal.js | dal | Y | N |
| resources | insert | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js | dal | N | N |
| resources | update | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js | dal | N | N |
| resources | delete | vportDashboard | vportDashboard/dashboard/cards/team/dal/vportTeamInvite.write.dal.js | dal | Y | N |
| fuel_price_submissions | insert | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceSubmissions.write.dal.js | dal | Y | N |
| fuel_price_submission_reviews | insert | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceReviews.write.dal.js | dal | Y | N |
| fuel_price_submission_reviews | update | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceReviews.write.dal.js | dal | Y | N |
| fuel_prices | update | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal.js | dal | Y | N |
| fuel_prices | upsert | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPrices.write.dal.js | dal | Y | N |
| fuel_price_history | insert | vportDashboard | vportDashboard/dashboard/cards/gasprices/dal/vportFuelPriceHistory.write.dal.js | dal | Y | N |
| portfolio_media | update | vportDashboard | vportDashboard/dashboard/cards/portfolio/dal/portfolioMediaRecord.write.dal.js | dal | Y | N |
| profiles | select | vportDashboard | vportDashboard/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js | dal | Y | N |
| profile_public_details | upsert | vportDashboard | vportDashboard/dashboard/cards/settings/dal/vportPublicDetails.write.dal.js | dal | Y | N |
| booking_service_profiles | select | booking | booking/dal/readBookingServiceProfiles.dal.js | dal | N | N |
| actor_owners | select | portfolio | portfolio/setup.js | other | N | N |
| actor_owners | select | reviews | reviews/setup.js | other | N | N |

*(Additional table ops for profiles/vport feature including content_pages, locksmith tables, menu tables, rates, services, and views omitted for brevity — see allTableOps in api-map.json for complete list.)*

---

## 4. Edge Function Inventory

| Edge Function | Feature | File | Caller Context | Method |
|---|---|---|---|---|
| delete-citizen-account | settings/account | settings/account/dal/account.write.dal.js | Deletes a citizen account — called from account settings write DAL | invoke |
| auth-register-recovery | auth | auth/dal/resetPasswordSecure.dal.js | Registers a recovery token during password reset flow | invoke |
| auth-reset-password-secure | auth | auth/dal/resetPasswordSecure.dal.js | Executes the secure password reset operation | invoke |
| send-citizen-invite | invite | invite/dal/invite.dal.js | Sends a citizen invite | invoke |
| send-lead-confirmation | public/vportBusinessCard | public/vportBusinessCard/dal/sendLeadConfirmationEmail.edge.dal.js | Fire-and-forget lead confirmation email for vport business card lead submissions | invoke |
| monitoring-ingest-error | monitoring | services/monitoring/vcsmMonitoring.js | Ingests error events into the monitoring system | invoke |
| monitoring-ingest-error | monitoring | services/monitoring/monitoringClient.js | Ingests error events from monitoring client | invoke |
| reverse-geocode | shared/location | shared/hooks/useUserLocation.js | Reverse geocodes lat/lon coordinates and search strings | fetch |

---

## 5. HTTP Endpoint Inventory

| Endpoint | Type | Feature | File | HTTP Method |
|---|---|---|---|---|
| https://api.ipify.org?format=json | external | legal | legal/dal/getPublicIp.dal.js | GET |
| ${VITE_SUPABASE_URL}/functions/v1/reverse-geocode?lat={lat}&lon={lon} | internal | shared/location | shared/hooks/useUserLocation.js | GET |
| ${VITE_SUPABASE_URL}/functions/v1/reverse-geocode?search={query} | internal | shared/location | shared/hooks/useUserLocation.js | GET |
| https://upload.vibezcitizens.com | external | cloudflare/media-upload | services/cloudflare/uploadToCloudflare.js | POST |
| ${VITE_SUPABASE_URL} (wanders Supabase client interceptor) | internal | wanders | wanders/services/wandersSupabaseClient.js | UNKNOWN |
| ${VITE_SUPABASE_URL} (debug Supabase client interceptor) | internal | supabase/debug | services/supabase/supabaseClient.debug.js | UNKNOWN |
| same-origin request passthrough | internal | service-worker | sw.js | UNKNOWN |

**External endpoints: 2** (`api.ipify.org`, `upload.vibezcitizens.com`)
Note: `api.ipify.org` fetches the user's public IP for legal consent logging — this is a third-party call without request authentication and its response should be treated as untrusted input.

---

## 6. Adapter Surface Inventory

### Feature: actors
- Adapter file: `apps/VCSM/src/features/actors/adapters/actors.adapter.js`
- Exports: `searchActorsAdapter` (other)

### Feature: ads
- Adapter file: `apps/VCSM/src/features/ads/adapters/hooks/useVportAds.adapter.js`
- Exports: `useVportAds` (hook)
- Adapter file: `apps/VCSM/src/features/ads/adapters/widgets/OnemoredaysAd.adapter.js`
- Exports: `OnemoredaysAd` (component)

### Feature: auth
- Adapter file: `apps/VCSM/src/features/auth/adapters/auth.adapter.js`
- Exports: `useAuthOps` (hook), `useEmailVerified` (hook), `useJoinOnboarding` (hook), `authTheme` (other), `CompleteProfileGate` (component), `VerifyEmailRequiredScreen` (screen), `ConsentCheckbox` (component)

### Feature: block
- Adapter files: `useBlockActorAction.adapter.js`, `useBlockStatus.adapter.js`, `BlockConfirmModal.adapter.js`
- Exports: `useBlockActorAction` (hook), `useBlockStatus` (hook), `BlockConfirmModal` (component)

### Feature: booking
- Adapter file: `apps/VCSM/src/features/booking/adapters/booking.adapter.js`
- Exports: `useBookingAvailability`, `useCreateBooking`, `useManageAvailability`, `useOwnerBookingResources`, `useEnsureOwnerBookingResource`, `useBookingServiceProfiles`, `useOrganizationWorkspace`, `useOrganizationLocations`, `useLocationResources`, `useResourceServiceOverrides`, `useBookingContextResolver`, `useQrLinks`, `useBookingOps`, `useBookingServices`, `useBookingHistory` (all hooks), `assertActorOwnsVportActorController`, `assertSessionOwnsVportActorController` (controllers), `getActorByIdDAL` (other)

### Feature: chat
- Adapter files: `chat.adapter.js`, `useStartConversation.adapter.js`
- Exports: `useChatUnreadOps` (hook), `useStartConversation` (hook)

### Feature: feed
- Adapter files: `feedCache.adapter.js`, `useFeed.adapter.js`
- Exports: `invalidateFeedBlockCache`, `invalidateFeedFollowCache`, `invalidateActorBundleEntry` (others), `useFeed` (hook)

### Feature: flyerBuilder
- Adapter file: `flyerBuilder.adapter.js`
- Exports: `VportActorMenuFlyerEditorScreen`, `VportActorMenuFlyerScreen` (screens)

### Feature: identity
- Adapter files: `identity.adapter.js`, `identityOps.adapter.js`
- Exports: `useIdentityOps` (hook), `ensureVcsmPlatformBootstrap` (other), `refreshVcActorDirectory` (other), `useIdentity` (hook), `IdentityProvider` (component), `useActiveActorState` (hook)

### Feature: initiation
- Adapter files: `initiation.adapter.js`, `onboarding.adapter.js`
- Exports: `acceptCitizenInviteAttribution` (other), `OnboardingCardsView`, `CitizenVibesScreen` (screens)

### Feature: legal
- Adapter file: `legal.adapter.js`
- Exports: `useSignupConsent` (hook), `useLegalConsent` (hook), `ConsentGateScreen` (screen), `recordSignupConsent` (other)

### Feature: media
- Adapter files: `media.adapter.js`, `mediaAppId.adapter.js`
- Exports: `createMediaAssetController` (controller), `resolveVcsmAppId` (other), `softDeleteMediaAssetController` (controller)

### Feature: moderation
- 9 adapter files covering ChatSpamCover, ReportModal, ReportThanksOverlay, ReportedObjectCover, useCommentVisibility, useConversationCover, useHidePostForActor, usePostVisibility, useReportFlow

### Feature: notifications
- Adapter file: `notifications.adapter.js`
- Exports: `publishVcsmNotification`, `publishVcsmNotificationBatch`, `getUnreadNotificationCount` (others)

### Feature: profiles
- 26 adapter files — largest adapter surface in the codebase. Covers vport type config, exchange, gas prices, rates, services, locksmith, ownership, reviews, photos, tags, UI gates.

### Feature: public/vportMenu
- Adapter file: `vportMenu.adapter.js`
- Exports: `VportPublicMenuView`, `VportPublicMenuQrView`, `VportPublicReviewsView`, `VportPublicReviewsQrView` (screens), `useVportPublicMenu`, `useVportPublicDetails`, `useVportPublicReviews`, `useResolveMenuSlug`, `useResolveVportSlug` (hooks)

### Feature: settings
- Adapter files: `useMyBlocks.adapter.js`, `VportAboutDetails.view.adapter.js`, `settings.adapter.js`, `Card.adapter.js`
- Exports: `MyBlocksProvider`, `useMyBlocks`, `VportAboutDetailsView`, `useVportAccountOps`, `useVportDirectoryVisibility`, `useVportBusinessCardSettings`, `useResolvedVportId`, `Card`

### Feature: social
- 13 adapter files covering follow requests, subscribe, privacy adapters, and social ops.

### Feature: vportDashboard
- Adapter file: `vportDashboard.adapter.js`
- Exports: 17 items including `useOwnerQuickStats`, `useVportBookingOps`, `VportDashboardScheduleScreen`, `useVportTeam`, `useVportGasPrices`, `useOwnerPendingSuggestions`, `checkVportOwnershipController`, `useVportOwnership`, and gas price panel components.

### Feature: wanders
- Adapter files: `wandersSupabaseClient.adapter.js`, `wanders.adapter.js`
- Exports: `getWandersSupabase` (other), `useWandersBusinessCardOps` (hook)

### Features without adapters (8)
`debug`, `explore`, `hydration`, `invite`, `join`, `professional`, `reviews`, `wanderex`

---

## 7. Controller Inventory

### searchActors (feature: actors)
- File: `apps/VCSM/src/features/actors/controllers/searchActors.controller.js`
- RPCs: none
- Tables: none
- Imports controllers: none
- Imports adapters: none
- Imports DAL: `searchActors.dal`

### createUserActorForProfile (feature: auth)
- File: `apps/VCSM/src/features/auth/controllers/createUserActor.controller.js`
- RPCs: `create_actor_for_user`
- Imports DAL: `actorCreate.dal`, `actorOwnerCreate.dal`, `actorGetByProfile.dal`

### getOnboardingBootstrapController (feature: auth)
- File: `apps/VCSM/src/features/auth/controllers/onboarding.controller.js`
- RPCs: `generate_username`
- Imports adapters: `initiation.adapter`
- Imports controllers: `createUserActor.controller`
- Imports DAL: `authSession.read.dal`, `onboarding.dal`

### blockActorController / unblockActorController / toggleBlockActorController (feature: block)
- File: `apps/VCSM/src/features/block/controllers/blockActor.controller.js`
- RPCs: `block_actor`, `unblock_actor`
- Imports DAL: `block.dal`, `block.check.dal`

### assertActorOwnsVportActorController (feature: booking)
- File: `apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js`
- Tables: `actor_owners`
- Imports DAL: `getActorById.dal`, `readActorOwnerLinkByActorAndUserProfile.dal`

### createBookingController (feature: booking)
- File: `apps/VCSM/src/features/booking/controller/createBooking.controller.js`
- Tables: `bookings`
- Imports adapters: `notifications.adapter`
- Imports controllers: `assertActorOwnsVportActor.controller`
- Imports DAL: `getBookingResourceById.dal`, `getActorById.dal`, `insertBooking.dal`, `listBookingResourceServicesByResourceId.dal`
- **Security flag:** MISSING_ACTOR_CHECK — `customerActorId` is caller-supplied, not enforced to match `requestActorId`

### cancelBookingController / confirmBookingController (feature: booking)
- Files: `cancelBooking.controller.js`, `confirmBooking.controller.js`
- Tables: `bookings`
- Imports adapters: `notifications.adapter`
- Imports controllers: `assertActorOwnsVportActor.controller`

### ctrlSearchResults / ctrlSearchTabs (feature: explore)
- Files: `searchResults.controller.js`, `searchTabs.controller.js`
- RPCs: `search_actor_directory`

### ensureVcsmPlatformBootstrap (feature: identity)
- File: `identity/controller/ensureVcsmPlatformBootstrap.controller.js`
- RPCs: `provision_vcsm_identity`
- Imports DAL: `provision.rpc.dal`

### refreshVcActorDirectory / refreshActorDirectoryRow (feature: identity)
- File: `identity/controller/refreshActorDirectory.controller.js`
- RPCs: `refresh_actor_directory_row`

### ctrlSendCitizenInvite (feature: invite)
- File: `invite/controller/invite.controller.js`
- Edge functions: `send-citizen-invite`

### assertModerationAccessController (feature: moderation)
- File: `moderation/controllers/assertModerationAccess.controller.js`
- RPCs: `is_current_user_moderator`

### getVportBusinessCardPublicController / submitVportBusinessCardLeadController / getVportBusinessCardSectionsController (feature: public)
- File: `public/vportBusinessCard/controller/vportBusinessCard.controller.js`
- RPCs: `read_business_card_public`, `submit_business_card_lead`, `get_business_card_sections`
- Edge functions: `send-lead-confirmation`
- Imports adapters: `notifications.adapter`

### ctrlDeleteAccount (feature: settings)
- File: `settings/account/controller/account.controller.js`
- RPCs: `soft_delete_citizen_account`, `soft_delete_vport`, `hard_delete_vport`, `restore_vport`
- Edge functions: `delete-citizen-account`
- Imports adapters: `booking.adapter`

### ctrlGetVportSocialSettings / ctrlUpdateVportSocialSettings (feature: settings)
- File: `settings/vports/controller/vportSocialSettings.controller.js`
- RPCs: `get_actor_social_public_policy`
- **Violation:** Directly imports from `social/privacy/dal/actorSocialSettings.dal` and `social/privacy/dal/actorSocialPublicPolicy.dal` (DAL_BYPASS)

### ctrlSubscribe (feature: social)
- File: `social/friend/subscribe/controllers/follow.controller.js`
- Imports adapters: `notifications.adapter`, `feedCache.adapter`, block adapter
- Imports controllers: `getFollowRelationshipState.controller`, `followRequests.controller`

### ctrlGetFollowerCount (feature: social)
- File: `social/friend/subscribe/controllers/getFollowerCount.controller.js`
- RPCs: `get_follower_count`

### createPostController (feature: upload)
- File: `upload/controllers/createPost.controller.js`
- Tables: `posts`, `post_media`, `post_mentions`
- Imports adapters: `notifications.adapter`, block adapter
- Imports DAL: `insertPost.dal`, `insertPostMedia.dal`, `findActorsByHandles.dal`, `insertPostMentions.dal`

### submitCreateVportController (feature: vport)
- File: `vport/controller/submitCreateVport.controller.js`
- RPCs: `create_vport`
- Imports adapters: `media.adapter`, `mediaAppId.adapter`, `vportTypes.config.adapter`

### checkVportOwnershipController (feature: vportDashboard)
- File: `vportDashboard/controller/checkVportOwnership.controller.js`
- Imports adapters: `booking.adapter (assertActorOwnsVportActorController, getActorByIdDAL)`

*(Full 163-controller inventory available in `api-dependency-map.json` controllerDependencies section.)*

---

## 8. Cross-Feature API Matrix

| Source Feature | Target Feature | Import Type | Compliant? | Violation Type | File |
|---|---|---|---|---|---|
| ads | identity | adapter | YES | — | features/ads/screens/VportAdsSettingsScreen.jsx |
| auth | initiation | adapter | YES | — | features/auth/controllers/onboarding.controller.js |
| auth | wanders | adapter | YES | — | features/auth/controllers/register.controller.js |
| auth | identity | adapter | YES | — | features/auth/hooks/useAuthOnboarding.js |
| auth | legal | adapter | YES | — | features/auth/hooks/useRegister.js |
| block | feed | adapter | YES | — | features/block/hooks/useBlockActions.js |
| booking | notifications | adapter | YES | — | features/booking/controllers/bookingCancellation.controller.js |
| booking | identity | adapter | YES | — | features/booking/adapters/booking.adapter.js |
| chat | identity | adapter | YES | — | features/chat/adapters/chatEnrichment.adapter.js |
| feed | identity | adapter | YES | — | features/feed/adapters/feed.adapter.js |
| feed | profiles | adapter | YES | — | features/feed/components/FeedCard.jsx |
| identity | actors | adapter | YES | — | features/identity/adapters/identity.adapter.js |
| profiles | actors | adapter | YES | — | features/profiles/adapters/profiles.adapter.js |
| profiles | booking | adapter | YES | — | features/profiles/adapters/profiles.adapter.js |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/hooks/useAgendaCalendarValues.js |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/hooks/useVportBookingMutations.js |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking.js |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/view/BookingStepConfirm.jsx |
| **profiles** | **booking** | **unknown** | **NO** | **DIRECT_IMPORT** | features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx |
| **settings** | **social** | **dal** | **NO** | **DAL_BYPASS** | features/settings/vports/controller/vportSocialSettings.controller.js |
| **settings** | **social** | **dal** | **NO** | **DAL_BYPASS** | features/settings/vports/controller/vportSocialSettings.controller.js |
| **wanders** | **public** | **controller** | **NO** | **CONTROLLER_BYPASS** | features/wanders/core/hooks/useWandersBusinessCardOps.js |
| social | identity | adapter | YES | — | features/social/adapters/social.adapter.js |
| upload | notifications | adapter | YES | — | features/upload/controllers/createPost.controller.js |

### Violations Only

| Violation | Source | Target | Type | Files |
|---|---|---|---|---|
| DIRECT_IMPORT — model file bypass | profiles | booking | DIRECT_IMPORT | bookingCalendarDate.model (4 files), bookingCalendarAvailability.model (4 files), buildBookingPayload.model (1 file), bookingCalendar.model (1 file) |
| DAL_BYPASS — direct social DAL import in settings controller | settings | social | DAL_BYPASS | vportSocialSettings.controller.js (2 imports: actorSocialSettings.dal, actorSocialPublicPolicy.dal) |
| CONTROLLER_BYPASS — wanders hook imports public controller directly | wanders | public | CONTROLLER_BYPASS | useWandersBusinessCardOps.js |

**Total violations: 13** across 3 patterns.

---

## 9. Monitoring Coverage Matrix

| Feature | Monitoring Present | Call Count | Types Used |
|---|---|---|---|
| actors | NO | 0 | — |
| ads | NO | 0 | — |
| auth | YES | 7 | debugLoginEvent |
| block | NO | 0 | — |
| booking | YES | 15 | captureVcsmError |
| chat | NO | 0 | — |
| debug | YES | 1 | debugLoginEvent |
| explore | NO | 0 | — |
| feed | NO | 0 | — |
| flyerBuilder | NO | 0 | — |
| hydration | NO | 0 | — |
| identity | YES | 9 | captureVcsmError, debugLoginEvent |
| initiation | NO | 0 | — |
| invite | NO | 0 | — |
| join | NO | 0 | — |
| legal | NO | 0 | — |
| media | NO | 0 | — |
| moderation | NO | 0 | — |
| notifications | NO | 0 | — |
| portfolio | NO | 0 | — |
| post | NO | 0 | — |
| professional | NO | 0 | — |
| profiles | NO | 0 | — |
| public | NO | 0 | — |
| qrcode | NO | 0 | — |
| reviews | NO | 0 | — |
| settings | NO | 0 | — |
| shell | NO | 0 | — |
| social | NO | 0 | — |
| upload | NO | 0 | — |
| vgrid | NO | 0 | — |
| void | NO | 0 | — |
| vport | NO | 0 | — |
| vportDashboard | NO | 0 | — |
| wanderex | NO | 0 | — |
| wanders | NO | 0 | — |

**Coverage: 11.11%** (4 of 36 features)
**Uncovered critical paths:** `moderation`, `settings`, `social`, `upload`, `post`, `notifications`, `profiles`, `vportDashboard`, `vport`, `booking` (booking has monitoring but only via captureVcsmError in ownership/booking creation — no coverage for availability, scheduling, or status updates).

---

## 10. Security Findings

### HIGH Severity

#### MISSING_ACTOR_CHECK — HIGH
- File: `apps/VCSM/src/features/vport/dal/vport.core.dal.js`
- Feature: vport
- Description: `updateVport()` calls `requireUser()` to confirm a session exists, but the UPDATE query filters only on `.eq('id', vportId)` with no `.eq('owner_user_id', user.id)` clause. Any authenticated user who knows a target `vportId` can overwrite another user's VPORT name, slug, avatar, bio, or `is_active`. Ownership guard present in read paths and `setVportDirectoryVisibleDAL` but absent in this write path.
- Evidence: `.update(patch).eq('id', vportId).select(SELECT).single()`

---

### MEDIUM Severity

#### MISSING_ACTOR_CHECK — MEDIUM
- File: `apps/VCSM/src/features/booking/controller/createBooking.controller.js`
- Feature: booking
- Description: `createBookingController` accepts `customerActorId` as an independent caller-supplied parameter (default `null`). The controller validates `requestActorId` as the authenticated actor (citizen kind check), but `customer_actor_id` is written as whatever `customerActorId` the caller passes — not enforced to equal `requestActorId`. A caller can supply a `customerActorId` for a different actor, creating a booking attributed to a third party.
- Evidence: `customer_actor_id: customerActorId, // line 122 — caller-supplied, not derived from requestActorId`

#### DAL_BYPASS_WRITE — MEDIUM
- File: `apps/VCSM/src/learning/controller/teachers/gradeSubmission.controller.js`
- Feature: learning
- Description: `gradeSubmission` controller performs direct Supabase table writes against `learning.grades` inside the controller layer, bypassing the DAL tier. The controller performs a membership role check (`canGrade`) before writing, but if RLS is not enforced on `learning.grades` for the web role, the `canGrade` check is the only gate.
- Evidence: `supabase.schema('learning').from('grades').update(payload) / .insert({...}) — lines 61, 84`

#### DAL_BYPASS_WRITE — MEDIUM
- File: `apps/VCSM/src/learning/controller/administration/adminAccess.controller.js`
- Feature: learning
- Description: `saveCourseMembership()` and `saveOrganizationMembership()` perform raw Supabase writes directly inside the `adminAccess` controller file rather than a dedicated DAL. These functions can be called without the permission check if the file is invoked directly.
- Evidence: `.update({role,status}).eq('id',...) / .insert({course_id,...}) — lines 152, 170, 200, 218`

#### DIRECT_TABLE_WRITE — MEDIUM
- File: `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js`
- Feature: notifications
- Description: `markNotificationRecipientsSeenDAL` filters by `recipient_id` (notification inbox_items PK) but not by `recipient_actor_id`. If an attacker can enumerate or brute-force `recipient_id` values, they can mark arbitrary notifications as seen for any user.
- Evidence: `.update({ is_seen: true, seen_at: now }).in('recipient_id', recipientIds) — line 195`

---

### LOW Severity

#### DIRECT_TABLE_WRITE — LOW
- File: `apps/VCSM/src/features/vportDashboard/dal/write/updateVportBooking.write.dal.js`
- Feature: vportDashboard/booking
- Description: `UPDATABLE_COLS` list includes `resource_id`, `service_id`, and `service_label_snapshot` — fields that could allow unauthorized rebooking manipulation if the controller's ownership check (`assertActorOwnsVportActorController`) is bypassed. The controller does properly call the ownership gate, so this is a defense-in-depth concern rather than an active bypass.
- Evidence: `.update(row).eq('id', bookingId).eq('profile_id', profileId) — lines 26-29`

#### MISSING_ACTOR_CHECK — LOW
- File: `apps/VCSM/src/features/professional/briefings/dal/professionalBriefings.read.dal.js`
- Feature: professional/briefings
- Description: `dalMarkProfessionalBriefingsSeen` reads from `vc.notifications` (legacy schema), a different table than the current `notification.inbox_items`. This creates dual-write drift where one path may not reflect the other, potentially causing inconsistent seen states.
- Evidence: `.from('notifications').update({ is_seen: true }).eq('recipient_actor_id', recipientActorId).in('id', notificationIds) — lines 51-54`

---

## 11. Top 20 High-Risk APIs

Ranked by composite risk: write authority + missing ownership enforcement + no monitoring + cross-feature bypass exposure.

| Rank | API / Endpoint | Feature | Risk Factors |
|---|---|---|---|
| 1 | `updateVport()` in `vport.core.dal.js` | vport | Missing owner constraint on UPDATE, authenticated-user-only check, no monitoring, exposes slug/avatar/bio/is_active overwrite |
| 2 | `createBookingController` | booking | `customerActorId` is caller-supplied; customer identity is not derived from session; booking attributed to arbitrary third party |
| 3 | `markNotificationRecipientsSeenDAL` in `notificationRuntime.dal.js` | notifications | No `recipient_actor_id` filter, only `recipient_id`; recipient_id enumeration could mark any user's notifications as seen; no monitoring |
| 4 | `bookings INSERT` at `insertBooking.dal.js` | booking | No actor check, no auth UID constraint in DAL; relies entirely on controller ownership gate for authorization |
| 5 | `bookings INSERT` at `insertVportBooking.write.dal.js` (vportDashboard) | vportDashboard | No actor check, no auth UID; separate insert path from booking feature with duplicate logic, no monitoring |
| 6 | `updateBookingStatus.dal.js` (booking feature) | booking | No actor check, no auth UID; relies on controller ownership gate; status transitions can be forced if gate is bypassed |
| 7 | `settings/vports controller` direct DAL import from `social` feature | settings | DAL_BYPASS: `vportSocialSettings.controller.js` imports `social/privacy/dal/actorSocialSettings.dal` and `social/privacy/dal/actorSocialPublicPolicy.dal` directly, bypassing the social adapter boundary |
| 8 | `wanders/core/hooks/useWandersBusinessCardOps.js` | wanders | CONTROLLER_BYPASS: directly imports `public/vportBusinessCard/controller/vportBusinessCard.controller`, bypassing adapter boundary; wanders is a guest-user feature calling into public VPORT business card controller |
| 9 | `resources INSERT/UPDATE` at `vportTeamInvite.write.dal.js` | vportDashboard | No actor check on INSERT and UPDATE operations; team invite write path has no ownership enforcement at DAL level |
| 10 | `profiles UPDATE` at `auth/dal/profile.dal.js` | auth | No actor check, no auth UID in DAL; write path for auth-owned profile during onboarding relies on caller context only |
| 11 | `availability_rules UPSERT` at `upsertAvailabilityRule.dal.js` | booking | No actor check, no auth UID; any session knowing a resourceId could overwrite scheduling rules |
| 12 | `availability_exceptions UPSERT` at `upsertAvailabilityException.dal.js` | booking | Same pattern as availability_rules — no DAL-level ownership constraint |
| 13 | `resource_services UPSERT` at `upsertBookingResourceServices.dal.js` | booking | No actor check, no auth UID; service configuration rewrite possible if resource ID is known |
| 14 | `service_booking_profiles UPDATE/INSERT` at `saveBookingServiceProfileDurationsByServiceIds.dal.js` | booking | No actor check, no auth UID; duration profile for bookings can be modified |
| 15 | `profiles booking/view direct model imports` — 9 files | profiles | DIRECT_IMPORT violations into `booking` internal model layer; `bookingCalendarDate.model`, `bookingCalendarAvailability.model`, `buildBookingPayload.model`, `bookingCalendar.model` all bypassing adapter boundary |
| 16 | `getPublicIp.dal.js` — `api.ipify.org` | legal | Third-party external HTTP call; IP response is untrusted input used in legal consent logging; no validation or fallback documented |
| 17 | `locksmith_service_details` UPSERT/DELETE at `locksmithServiceDetails.write.dal.js` | profiles/vport | No actor check, no auth UID; locksmith service data can be modified without ownership enforcement at DAL level |
| 18 | `locksmith_service_areas` UPSERT/INSERT/UPDATE/DELETE at `locksmithServiceAreas.write.dal.js` | profiles/vport | No actor check, no auth UID; same pattern as locksmith_service_details |
| 19 | `message_attachments UPDATE` at `updateAttachmentMediaAsset.write.dal.js` | chat | No actor check, no auth UID; attachment media asset record can be overwritten without ownership enforcement |
| 20 | `gradeSubmission.controller.js` in learning | learning | DAL_BYPASS: direct DB write inside controller; if RLS is absent on `learning.grades`, `canGrade` check is the only gate with no DAL isolation |

---

## 12. Recommended Scanner Enhancements

Based on gaps found, the following checks should be added to `apps/scanner/`:

1. **DAL write ownership check scanner:** Flag all `.update()`, `.insert()`, `.delete()`, `.upsert()` calls in DAL files that lack both `.eq('actor_id', ...)` / `.eq('owner_id', ...)` and `.eq('user_id', auth.uid())`. Output as `MISSING_OWNERSHIP_CONSTRAINT` finding.

2. **Controller-direct-DB-write scanner:** Detect Supabase client calls (`.from(...)`, `.schema(...)`) inside `controller.js` files (not `dal.js` files). Flag as `DAL_BYPASS_WRITE`.

3. **Cross-feature direct model import scanner:** Extend the current cross-feature import scanner to detect imports from `model/` subdirectories of sibling features (not via adapter). Currently these are only caught manually.

4. **Monitoring gap detector:** List all features with write controllers (any controller importing a write dal) that have zero monitoring calls. Output as `MONITOR_BLIND_WRITE_PATH`.

5. **customerActorId / caller-supplied actor injection scanner:** Search for controller parameters named `*ActorId`, `*UserId`, `*ProfileId` that are passed directly into DAL insert/update payloads without an `=== requestActorId` guard or equivalent. Flag as `CALLER_SUPPLIED_IDENTITY`.

6. **Unauthenticated table write scanner:** Flag all `.insert()`/`.update()`/`.upsert()`/`.delete()` in DAL files where `hasActorCheck: false` AND `hasAuthUid: false`. These are DAL writes with no session or actor scope in the query.

7. **Duplicate RPC registration scanner:** Detect RPC names called from both production feature DAL files and dev diagnostic files without a `dev-only` guard. Flag as `DEV_RPC_IN_PROD_PATH`.

8. **Notification recipient_id filter audit:** Specifically check `notification` schema queries that filter by `recipient_id` (a UUID PK) without also filtering by `recipient_actor_id`. Flag as `NOTIFICATION_SCOPE_DRIFT`.

9. **External HTTP endpoint trust scanner:** Flag all `fetch()` calls to non-Supabase external domains. For each, require documentation of: response trust level, fallback behavior, and whether the response is used in security decisions.

10. **Adapter export completeness check:** For each feature with controllers that are imported by other features (detected via cross-feature import scan), verify an adapter file exists and re-exports those controllers. Flag features where other features directly import the controller file as `MISSING_ADAPTER_BOUNDARY`.

---

## Appendix: Feature Coverage Map

One-line summary of what was discovered per feature.

| Feature | Controllers | Adapters | RPCs | Tables | Edge Fns | Monitoring | Violations |
|---|---|---|---|---|---|---|---|
| actors | 1 | 1 | 1 (search_actor_directory) | 2 | 0 | none | 0 |
| ads | 0 | 2 | 0 | 0 | 0 | none | 0 |
| auth | 13 | 1 | 2 (generate_username, create_actor_for_user) | 3 | 2 | debugLoginEvent (7) | 0 |
| block | 3 | 3 | 2 (block_actor, unblock_actor) | 1 | 0 | none | 0 |
| booking | 15 | 1 | 0 | 10 | 0 | captureVcsmError (15) | 1 (customerActorId) |
| chat | 2 | 2 | 1 (search_actor_directory) | 4 | 0 | none | 0 |
| debug | 0 | 0 | 0 | 0 | 0 | debugLoginEvent (1) | 0 |
| explore | 2 | 0 | 1 (search_actor_directory) | 1 | 0 | none | 0 |
| feed | 4 | 2 | 0 | 2 | 0 | none | 0 |
| flyerBuilder | 6 | 1 | 0 | 7 | 0 | none | 0 |
| hydration | 0 | 0 | 0 | 1 | 0 | none | 0 |
| identity | 2 | 2 | 2 (provision_vcsm_identity, refresh_actor_directory_row) | 1 | 0 | captureVcsmError + debugLoginEvent (9) | 0 |
| initiation | 3 | 2 | 0 | 7 | 0 | none | 0 |
| invite | 1 | 0 | 0 | 0 | 1 | none | 0 |
| join | 2 | 0 | 0 | 3 | 0 | none | 0 |
| legal | 2 | 1 | 0 | 1 | 0 | none | 0 |
| media | 2 | 2 | 0 | 2 | 0 | none | 0 |
| moderation | 7 | 9 | 1 (is_current_user_moderator) | 6 | 0 | none | 0 |
| monitoring | 0 | 0 | 0 | 0 | 2 | captureVcsmError (1) | 0 |
| notifications | 4 | 1 | 5 (create_event, insert_recipients, upsert_rendered, insert_inbox_item, update_recipient_status) | 5 | 0 | none | 1 (recipient_id scope) |
| portfolio | 1 | 1 | 0 | 1 | 0 | none | 0 |
| post | 13 | 12 | 1 (post_reactors_summary_one) | 10 | 0 | none | 0 |
| professional | 1 | 0 | 0 | 1 | 0 | none | 1 (legacy schema drift) |
| profiles | 47 | 26 | 5 | 26+ | 0 | none | 9 (direct model imports) |
| public | 6 | 1 | 3 (read_business_card_public, submit_business_card_lead, get_business_card_sections) | 0 | 1 | none | 0 |
| qrcode | 0 | 1 | 0 | 0 | 0 | none | 0 |
| reviews | 0 | 0 | 0 | 1 | 0 | none | 0 |
| settings | 15 | 4 | 8 | 6 | 1 | none | 2 (DAL_BYPASS into social) |
| shared/location | 0 | 0 | 0 | 0 | 1 | none | 0 |
| shell | 0 | 1 | 0 | 0 | 0 | none | 0 |
| social | 7 | 13 | 3 (get_follower_count, get_actor_social_public_policy, can_view_actor_signal) | 3 | 0 | none | 0 |
| upload | 3 | 2 | 1 (search_actor_directory) | 3 | 0 | none | 0 |
| vgrid | 0 | 1 | 0 | 0 | 0 | none | 0 |
| void | 0 | 1 | 0 | 0 | 0 | none | 0 |
| vport | 3 | 3 | 4 (create_vport, soft_delete_vport, hard_delete_vport, restore_vport) | 0 | 0 | none | 1 (missing owner constraint in update) |
| vportDashboard | 23 | 1 | 0 | 17 | 0 | none | 1 (resource insert without actor check) |
| wanders | 10 | 2 | 0 | 0 | 0 | none | 1 (CONTROLLER_BYPASS into public) |
| wanderex | 0 | 0 | 0 | 0 | 0 | none | 0 |
