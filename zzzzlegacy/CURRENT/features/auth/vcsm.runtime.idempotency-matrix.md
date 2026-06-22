# VCSM Idempotency Matrix

## Classification legend

- `Safe idempotent`: retry should converge on the same state
- `Upsert idempotent`: retry is safe because conflict/upsert semantics are explicit
- `Partial idempotent`: some substeps are safe, but the full mutation can still diverge
- `Unsafe on retry`: retry can duplicate data, uploads, or side effects

## Auth / Identity

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Login + login-state record | Partial idempotent | Auth login is stable; login-state write is best-effort | User signs in, but login-state metadata may be missed or duplicated | Make login-state write explicit and typed, not silent |
| Send reset password email | Safe idempotent | Auth-owned reset flow | May send another reset email, but app state stays consistent | Keep auth-owned |
| Register / anonymous upgrade | Partial idempotent | Profile upsert is safe; signup/upgrade path is not | Retry can create conflict or force stale-session recovery | Add registration/session recovery token or DB-side provisioning contract |
| Complete onboarding | Partial idempotent | Profile upsert + actor creation + platform bootstrap | Retry can hit half-finished state and rely on later self-heal | Persist onboarding checkpoint state or move to one DB contract |
| Create user actor for profile | Partial idempotent | Duplicate owner ignored; actor create itself is not fully tokenized | Retry can create actor/owner asymmetry without stronger unique contract | Add explicit uniqueness around one user -> one primary actor |
| Ensure VCSM platform bootstrap | Safe idempotent | `platform.provision_vcsm_identity` is documented idempotent | Retry converges on same platform rows | Keep RPC-owned |
| Switch active actor | Safe idempotent | Overwrites active preference | Retry keeps same active actor | Keep engine-owned |

## Feed / Post / Comments

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Upload post media batch | Unsafe on retry | No mutation token; each retry uploads fresh keys | Duplicate remote media objects | Attach a batch id or provisional upload manifest |
| Create post (upload flow) | Unsafe on retry | No post client id; partial DB rollback only | Duplicate posts or orphaned media on retry | Add `client_mutation_id` and finalize RPC |
| Create post (legacy postcard path) | Unsafe on retry | Plain insert + best-effort mentions | Duplicate posts on retry | Remove legacy path or add one create contract |
| Edit post | Partial idempotent | Same text update is stable; mention rewrite is best-effort | Text converges, mention edges may not | Make mention rewrite part of one controller or RPC |
| Delete post (soft delete) | Safe idempotent | Sets `deleted_at` / `deleted_by_actor_id` | Repeat delete converges | Keep soft-delete contract |
| Toggle post reaction | Partial idempotent | Toggle semantics, not explicit set-state | Retry can flip the reaction the wrong way | Prefer explicit `setReaction(state)` contract |
| Send rose gift | Unsafe on retry | Insert-only gift action | Retry can duplicate gifts | Add client mutation id or unique gift constraint if intended |
| Create comment / reply | Unsafe on retry | Plain insert | Retry can duplicate comments/replies | Add client-side mutation id or dedupe token |
| Edit comment | Safe idempotent | Overwrites body | Repeat save converges | Keep overwrite semantics |
| Delete comment (soft delete) | Safe idempotent | Sets deleted markers | Repeat delete converges | Keep soft-delete semantics |
| Toggle comment like | Partial idempotent | Toggle semantics | Retry can invert final state | Prefer explicit set/unset API |

## Social

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Follow public actor | Upsert idempotent | Upsert/reactivate semantics | Retry converges on “following” | Keep unique follow edge |
| Unfollow actor | Partial idempotent | Depends on current row state | Usually converges, but semantics are not as explicit as upsert | Prefer explicit active/inactive set |
| Send follow request | Upsert idempotent | Pending request upsert | Retry converges on one pending request | Keep unique pending request contract |
| Accept follow request | Partial idempotent | Status gate + separate follow insert/status update | Retry can leave split state if first attempt partially succeeded | Replace with accept RPC |
| Decline / cancel follow request | Safe idempotent | Status-gated update | Retry converges on terminal status | Keep status gate |
| Set actor privacy | Upsert idempotent | Single privacy upsert | Retry converges | Keep upsert |
| Save friend ranks | Partial idempotent | RPC path safe; fallback delete+insert not fully safe | Retry can briefly wipe/rebuild ranks | Remove fallback or keep it server-owned |
| Block actor with cleanup | Partial idempotent | Block row idempotent, cleanup side effects separate | Retry after partial failure may not complete cleanup deterministically | One block RPC with cleanup inside |
| Unblock actor | Safe idempotent | Delete block row | Repeat unblock converges | Keep delete semantics |
| Settings privacy block/unblock duplicate path | Safe idempotent | Direct insert/delete of block row | Retry converges, but cleanup still missing | Route through main block controller |

## Chat

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Start direct conversation (engine + legacy fallback) | Partial idempotent | Engine RPCs are mostly convergent; legacy fallback is not as strong | Retry may create or reopen differently by path | Remove legacy fallback and keep engine contract only |
| Send message (engine + legacy) | Partial idempotent | Engine uses `client_id`; legacy path does not | Engine retries are safe, legacy retries can duplicate messages | Remove legacy path; require `client_id` |
| Edit message (engine + legacy) | Safe idempotent | Overwrite semantics on one message row | Retry converges | Keep overwrite semantics |
| Unsend / delete-for-me message (engine + legacy) | Partial idempotent | Mixed message/receipt semantics | Retry can repeat visibility mutations inconsistently by path | Consolidate on one lifecycle contract |
| Mark conversation read (engine + legacy) | Safe idempotent | Writes a read boundary/unread reset | Retry converges on “read” | Keep explicit read boundary |
| Inbox thread actions + spam cover (engine + legacy) | Partial idempotent | Folder move is stable; moderation/report tails are not | Retry can duplicate reports/actions or miss tails | Keep one inbox action authority and one spam RPC |
| Typing presence (engine only) | Upsert idempotent | Upsert/delete typing state | Retry converges | Keep upsert/delete model |

## Notifications

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Mark notification read | Safe idempotent | Sets `is_read` + `is_seen` true | Retry converges | Start checking returned errors |
| Mark notifications seen on load | Safe idempotent | Sets `is_seen` true for loaded ids | Retry converges | Start checking returned errors |
| Mark all notifications seen | Safe idempotent | Batch update to seen/read | Retry converges | Keep batch update |
| Direct notification insert helper (dormant / fallback) | Partial idempotent | RPC or direct insert, no universal dedupe key | Retry can duplicate notifications if both paths succeed | Add notification dedupe key or keep creation DB-owned |

## Profile / Settings

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Save user profile | Partial idempotent | DB overwrite is safe, uploads are not | Retry can upload extra images before final DB save | Upload finalize token + overwrite write |
| Save VPORT profile | Partial idempotent | Same as user profile | Retry can orphan assets | Same finalize pattern |
| Save VPORT public details | Upsert idempotent | Single upsert | Retry converges | Keep upsert |
| Save flyer public details | Upsert idempotent | Single upsert | Retry converges | Keep upsert |
| Save onboarding vibe tags | Partial idempotent | Void old rows then upsert new ones | Retry usually converges, but mid-flight failure can leave partial tag set | Move replace-all semantics into one RPC |
| Delete account | Partial idempotent | Destructive RPC, contract not fully visible from JS | Retry safety depends on RPC implementation | Keep RPC-owned and document contract |
| Delete VPORT | Partial idempotent | RPC preferred; direct delete fallback differs | Retry may hit different cleanup semantics | Remove fallback or make fallback equivalent |

## VPORT

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Create VPORT | Unsafe on retry | No explicit client mutation id | Retry can create duplicates or hit uniqueness conflicts | Add idempotency token at RPC boundary |
| Persist selected services after VPORT create | Upsert idempotent | Batch upsert on selected service keys | Retry converges on desired service set | Keep batch upsert, but move into create RPC |
| Update VPORT core record | Safe idempotent | Overwrite update | Retry converges | Keep overwrite semantics |
| Upsert VPORT services | Upsert idempotent | Batch upsert | Retry converges | Keep upsert |
| Submit / update review | Partial idempotent | One active review intent, but multi-step writes | Retry may repeat some rating-related side effects | Add RPC or unique review contract by author/target |
| Delete review | Safe idempotent | Soft-delete | Retry converges | Keep soft-delete |
| Fuel price submission | Partial idempotent | Owner path vs citizen path differ | Retry can duplicate pending submissions if no unique contract exists | Add submission idempotency key |
| Fuel price review and officialization | Partial idempotent | Status gate plus several derived writes | Retry can partially replay officialization/history/review log | Replace with one review RPC |
| Upsert VPORT rate | Upsert idempotent | Upsert semantics | Retry converges | Keep upsert |
| Menu category CRUD | Partial idempotent | Save/update/delete operations stable, but no universal mutation token | Retry can recreate or reorder unexpectedly | Use item/category ids and explicit reorder contract |
| Menu item CRUD | Partial idempotent | Item save can overwrite, but image upload is not idempotent | Retry can upload extra images | Add upload finalize token tied to item id |
| Design studio bootstrap / page save / page delete | Partial idempotent | Versioned writes help, but lifecycle is multi-step | Retry can create extra versions/jobs/pages | Consolidate save lifecycle into one RPC or job queue |
| Design asset upload + export queue | Unsafe on retry | Upload and queue are separate | Retry can create extra assets/exports/jobs | Add asset token and export request id |

## Booking

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Ensure owner booking resource | Partial idempotent | Insert-if-missing plus race re-read | Usually converges, but not one explicit upsert contract | Prefer one upsert keyed by owner actor |
| Create booking | Unsafe on retry | Plain insert | Retry can create duplicate bookings | Add booking request id / unique constraint |
| Confirm / cancel booking | Safe idempotent | Status update | Retry converges on terminal status | Keep status-transition guard |
| Availability rule / exception upsert | Upsert idempotent | Upsert semantics | Retry converges | Keep upsert |
| Set resource slot duration | Partial idempotent | Links services then writes durations | Retry can converge, but partial first attempt leaves drift | Move both writes into one RPC |

## Upload / Media

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Upload profile avatar/banner to R2 | Unsafe on retry | Each retry uploads a new key | Extra remote objects accumulate | Add provisional upload id / finalize step |
| Upload menu item image to R2 | Unsafe on retry | Each retry uploads a new key | Extra remote objects accumulate | Same provisional upload pattern |
| Upload post media to R2 | Unsafe on retry | Batch uploads new keys each retry | Duplicate remote media objects | Batch id + cleanup worker |

## Moderation

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Create report | Partial idempotent | Optional `dedupeKey` only | Retry can duplicate reports if dedupe is absent | Make dedupe key required for UI-triggered report submits |
| Actor hide/unhide post/comment | Partial idempotent | Inserts moderation action rows | Retry can duplicate action rows | Use unique visible-state contract per actor/object/action |
| Moderator resolution (hide object / dismiss report) | Partial idempotent | Status checks help, but writes are split | Retry after partial success can leave mismatched report/object state | One moderation-resolution RPC |
| Undo conversation cover | Partial idempotent | Deletes action, restores folder, restores last message pointer | Retry can re-run some restores but not fully diagnose partial state | One recover RPC with explicit final state |

## Wanders

| Action | Classification | Current mechanism | Retry effect | Recommended hardening |
| --- | --- | --- | --- | --- |
| Create Wanders card | Unsafe on retry | Plain insert + mailbox seed | Retry can create duplicate cards/outbox rows | Add `client_mutation_id` or public-id reservation |
| Publish Wanders from builder | Unsafe on retry | Optional image upload + card create + mailbox seed | Retry can duplicate uploads/cards | Same mutation token + finalize pattern |
| Mark Wanders card opened | Partial idempotent | Counter/timestamp read-modify-write | Retry can overcount opens | Use server-side increment or idempotent “opened by viewer” table |
| Create reply as anon | Unsafe on retry | Plain reply insert with best-effort tails | Retry can duplicate replies and events | Add reply mutation token |
| Soft delete reply | Safe idempotent | Soft-delete update | Retry converges | Keep soft-delete |
| Wanders support records (inboxes / keys / drop links / fingerprints / mailbox seed) | Partial idempotent | Many are single writes or upserts, but not uniformly | Retry safety depends on the specific record type | Standardize on upsert/dedupe keys across Wanders support tables |

## Highest-value idempotency gaps

1. Create post
2. Legacy send message
3. Create booking
4. Create VPORT
5. Fuel price review officialization
6. Create Wanders card / reply
7. All Cloudflare-first upload flows
