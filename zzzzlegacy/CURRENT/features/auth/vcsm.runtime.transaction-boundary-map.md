# VCSM Transaction Boundary Map

## Legend

- `Single DB write`: one insert/update/delete/upsert from the client
- `RPC transaction`: DB-owned transaction boundary
- `Client multi-write`: multiple client-orchestrated writes with no shared transaction
- `Remote upload + DB write`: Cloudflare object first, SQL persistence second
- `Hybrid engine + app write`: more than one runtime authority can persist the same business action

## Auth / Identity

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Login + login-state record | Hybrid auth + app write | `public.profiles`, `platform.user_app_state` | Supabase Auth + identity engine | Medium |
| Send reset password email | Auth-owned side effect | `auth` only | Supabase Auth | Low |
| Register / anonymous upgrade | Auth + profile upsert | `auth.users`, `public.profiles` | App controller + Supabase Auth | Medium |
| Complete onboarding | Client multi-write + RPC tail | `public.profiles`, `vc.actors`, `vc.actor_owners`, `platform.user_app_*` | App controller + DB RPC | High |
| Create user actor for profile | Client multi-write | `vc.actors`, `vc.actor_owners` | App controller + DAL | Medium |
| Ensure VCSM platform bootstrap | RPC transaction | `platform.user_app_*`, `vc.actors.user_app_account_id` | `platform.provision_vcsm_identity` | Low |
| Switch active actor | Single DB write | `platform.user_app_preferences` | Identity engine | Low |

## Feed / Post / Comments

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Upload post media batch | Remote upload only | Cloudflare R2 | App upload API | High |
| Create post (upload flow) | Remote upload + client multi-write | `vc.posts`, `vc.post_media`, `vc.post_mentions` | App controller | High |
| Create post (legacy postcard path) | Client multi-write | `vc.posts`, `vc.post_mentions` | App DAL | High |
| Edit post | Client multi-write | `vc.posts`, `vc.post_mentions` | App DAL | Medium |
| Delete post (soft delete) | Single DB write | `vc.posts` | App DAL | Low |
| Toggle post reaction | Toggle write | `vc.post_reactions` | App controller + DAL | Low |
| Send rose gift | Single DB write | `vc.post_rose_gifts` | App controller + DAL | Low |
| Create comment / reply | Single DB write | `vc.post_comments` | App controller + DAL | Low |
| Edit comment | Single DB write | `vc.post_comments` | App controller + DAL | Low |
| Delete comment (soft delete) | Single DB write | `vc.post_comments` | App controller + DAL | Low |
| Toggle comment like | Toggle write | `vc.comment_likes` | App controller + DAL | Low |

## Social

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Follow public actor | Single upsert / reactivate | `vc.actor_follows` | App controller + DAL | Low |
| Unfollow actor | Single state write | `vc.actor_follows` | App controller + DAL | Low |
| Send follow request | Single upsert | `vc.social_follow_requests` | App controller + DAL | Low |
| Accept follow request | Client multi-write | `vc.actor_follows`, `vc.social_follow_requests` | App controller + DAL | High |
| Decline / cancel follow request | Single state write | `vc.social_follow_requests` | App controller + DAL | Low |
| Set actor privacy | Single upsert | `vc.actor_privacy_settings` | App controller + DAL | Low |
| Save friend ranks | RPC transaction with delete+insert fallback | `vc.friend_ranks` | App DAL + DB RPC fallback | Medium |
| Block actor with cleanup | Client multi-write | `moderation.blocks`, `vc.actor_follows`, `vc.friend_ranks` | App controller + helper DALs | High |
| Unblock actor | Single delete | `moderation.blocks` | App controller + DAL | Low |
| Settings privacy block/unblock duplicate path | Single write | `moderation.blocks` | Settings privacy controller + DAL | Medium |

## Chat

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Start direct conversation | Engine RPC (SECURITY DEFINER) | `chat.conversations`, `chat.conversation_members`, `chat.inbox_entries` | Engine RPC `chat.get_or_create_direct_conversation` | Low (atomic) |
| Send message | Engine RPC (SECURITY DEFINER) | `chat.messages`, `chat.conversations`, `chat.inbox_entries`, `chat.outbox_events` | Engine RPC `chat.send_message_atomic` | Low (atomic) |
| Edit message | Engine controller single write | `chat.messages` | Engine controller + DAL | Low |
| Unsend / delete-for-me message | Engine controller | `chat.messages`, `chat.message_receipts` | Engine controller + DAL | Medium |
| Mark conversation read | Engine controller multi-write | `chat.conversation_members`, `chat.inbox_entries` | Engine controller + DAL | Medium |
| Inbox thread actions + spam cover | Engine controller | `chat.inbox_entries`, plus moderation tables | Engine controller + DAL | Medium |
| Typing presence (engine only) | Single upsert / delete | `chat.typing_states` | Engine controller + DAL | Low |

## Notifications

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Mark notification read | Single update | `vc.notifications` | App DAL | Low |
| Mark notifications seen on load | Single update | `vc.notifications` | App controller + DAL | Low |
| Mark all notifications seen | Single update | `vc.notifications` | App DAL | Low |
| Direct notification insert helper (dormant / fallback) | RPC insert with direct fallback | `vc.notifications` | App DAL + DB RPC | Medium |

## Profile / Settings

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Save user profile | Remote upload + DB write | Cloudflare R2 + `public.profiles` | App controller + upload helpers | High |
| Save VPORT profile | Remote upload + DB write | Cloudflare R2 + `vc.vports` | App controller + upload helpers | High |
| Save VPORT public details | Single upsert | `vc.vport_public_details` | App controller + DAL | Low |
| Save flyer public details | Single upsert | `vc.vport_public_details` | App controller + DAL | Low |
| Save onboarding vibe tags | Client multi-write | `vc.vibe_actor_tags` | App controller + DAL | Medium |
| Delete account | RPC transaction (inferred) | RPC-owned cleanup | Database RPC | Low / unknown |
| Delete VPORT | RPC with direct-delete fallback | RPC-owned cleanup or `vc.vports` fallback delete | App controller + DB RPC + fallback DAL | High |

## VPORT

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Create VPORT | RPC transaction | `vc.vports` and inferred related rows | `vc.create_vport` RPC | Low |
| Persist selected services after VPORT create | Single batch upsert after create | `vc.vport_services` | UI + App DAL | High |
| Update VPORT core record | Single update | `vc.vports` | App DAL | Low |
| Upsert VPORT services | Single upsert batch | `vc.vport_services` | App controller + DAL | Low |
| Submit / update review | Client multi-write | `vc.vport_reviews`, `vc.vport_review_ratings` | App controller + DAL | Medium |
| Delete review | Single soft-delete | `vc.vport_reviews` | App controller + DAL | Low |
| Fuel price submission | Single write | `vc.vport_fuel_price_submissions` or `vc.vport_fuel_prices` | App controller + DAL | Low |
| Fuel price review and officialization | Client multi-write | submissions, prices, history, review log tables | App controller + DAL | High |
| Upsert VPORT rate | Single upsert | `vc.vport_rates` | App controller + DAL | Low |
| Menu category CRUD | Single create/update/delete | `vc.vport_actor_menu_categories` | App controller + DAL | Low |
| Menu item CRUD | Remote upload + DB write | Cloudflare R2 + `vc.vport_actor_menu_items` | App controller + DAL | High |
| Design studio bootstrap / page save / page delete | Client multi-write | `vc.design_documents`, `vc.design_pages`, `vc.design_page_versions`, `vc.design_exports`, `vc.design_render_jobs` | App controllers + DAL | High |
| Design asset upload + export queue | Remote upload + DB write / client multi-write | Cloudflare R2 + `vc.design_assets`, `vc.design_exports`, `vc.design_render_jobs` | App controller + DAL | High |

## Booking

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Ensure owner booking resource | Single insert with race re-read | `vport.resources` | App controller + DAL | Low |
| Create booking | Single insert | `vport.bookings` | App controller + DAL | Low |
| Confirm / cancel booking | Single update | `vport.bookings` | App controller + DAL | Low |
| Availability rule / exception upsert | Single upsert | `vport.availability_rules`, `vport.availability_exceptions` | App controller + DAL | Low |
| Set resource slot duration | Client multi-write | `vport.resource_services`, `vport.service_booking_profiles` | App controller + DAL | High |

## Upload / Media

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Upload profile avatar/banner to R2 | Remote upload only | Cloudflare R2 | Upload helpers | High |
| Upload menu item image to R2 | Remote upload only | Cloudflare R2 | UI upload helper | High |
| Upload post media to R2 | Remote upload only | Cloudflare R2 | Upload API | High |

## Moderation

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Create report | Client multi-write | `moderation.reports`, `moderation.report_events`, sometimes `vc.inbox_entries` | App controller + DAL | High |
| Actor hide/unhide post/comment | Single insert | `moderation.actions` | App controller + DAL | Low |
| Moderator resolution (hide object / dismiss report) | Client multi-write | `vc.posts` or `vc.messages`, `moderation.actions`, `moderation.reports`, `moderation.report_events` | App controller + DAL | High |
| Undo conversation cover | Client multi-write | `moderation.actions`, `vc.inbox_entries` | App controller + DAL | High |

## Wanders

| Action | Write pattern | Tables touched | Transaction boundary owner | Atomicity risk |
| --- | --- | --- | --- | --- |
| Create Wanders card | Client multi-write | `wanders.cards`, `wanders.mailbox_items` | App controller + DAL | High |
| Publish Wanders from builder | Remote upload + DB write | Cloudflare R2 + `wanders.cards`, `wanders.mailbox_items` | App controller + DAL | High |
| Mark Wanders card opened | Client read/modify/write | `wanders.cards` | App controller + DAL | Medium |
| Create reply as anon | Client multi-write with best-effort tails | `wanders.replies`, `wanders.cards`, `wanders.mailbox_items`, `wanders.card_events` | App controller + DAL | High |
| Soft delete reply | Single update | `wanders.replies` | App controller + DAL | Low |
| Wanders support records (inboxes / keys / drop links / fingerprints / mailbox seed) | Mostly single writes | `wanders.inboxes`, `wanders.card_keys`, `wanders.inbox_drop_links`, `wanders.user_fingerprints`, `wanders.mailbox_items` | App controllers + DAL | Low |

## Read-through summary

| Boundary type | Where it is healthiest | Where it is weakest |
| --- | --- | --- |
| RPC transaction | platform bootstrap, engine chat send, VPORT create, delete-account RPC | VPORT delete fallback, friend-rank fallback |
| Single DB write | follow/unfollow, privacy, booking status, notification seen/read | block cleanup and follow accept, where the business action is bigger than one row |
| Client multi-write | unavoidable only in a few legacy areas | onboarding, post creation, legacy chat, moderation resolution, Wanders, booking duration |
| Remote upload + DB write | nowhere fully hardened yet | posts, profiles, VPORT create, menu items, design assets, Wanders builder, chat image attach |
