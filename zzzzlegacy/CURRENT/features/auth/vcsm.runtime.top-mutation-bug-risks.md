# VCSM Top Mutation Bug Risks

## Prioritized hardening roadmap

| Rank | Mutation | Risk category | Failure scenario | User-visible symptom | Root cause | Recommended fix | Difficulty |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Complete onboarding | Partial identity bootstrap | Profile and actor are created, platform bootstrap silently fails | User looks onboarded but later has bad hydration / switch behavior | Multi-step client orchestration with swallowed platform failure | One onboarding RPC or explicit checkpointed recovery state | Large |
| 2 | Create post (upload flow) | Upload + SQL split | Media upload succeeds, post/media rows partially fail | Missing media, orphaned uploads, duplicate posts on retry | Remote upload happens first; no mutation token; partial rollback only | Add post mutation id + finalize RPC + cleanup for failed batches | Large |
| 3 | ~~Legacy chat send path~~ RESOLVED | ~~Hybrid chat authority~~ | N/A | N/A | **RESOLVED 2026-04-05** — All 9 VCSM chat hooks now delegate to engine. Legacy `vc.*` chat files are dead code with zero runtime imports. | See `vcsm.chat.migration-status.md` | N/A |
| 4 | Accept follow request | Multi-write social mutation | Follow row succeeds, request status update fails | Request still appears pending while actors already follow each other | No transaction boundary across `vc.actor_follows` and `vc.social_follow_requests` | Replace with accept-follow RPC | Medium |
| 5 | Block / unblock authority split | Duplicate authority | Settings block path writes block row without cleanup; main path removes follows/friend ranks | Blocked actor still appears socially connected or behaves differently by entry surface | Two controllers own the same business action with different side effects | Route all block/unblock actions through the main block controller | Medium |
| 6 | Save profile with uploads | Remote asset orphaning | Avatar/banner upload succeeds, profile DB update fails | New image exists remotely but profile still points to old image | Upload-first architecture with no finalize/cleanup step | Add provisional upload token + finalize write | Medium |
| 7 | Create VPORT + selected services | Split business creation | `vc.create_vport` succeeds, selected services persist fails and is only logged | New VPORT opens with missing service catalog | Creation and initial services are separate authorities | Fold initial services into the create contract | Medium |
| 8 | Fuel price review officialization | Multi-table admin action | Submission approved, but official price/history/review log diverge | Fuel price panel shows mismatched official price or missing history | Four-step controller sequence with no transaction | One review/officialize RPC | Medium |
| 9 | Set resource slot duration | Multi-table booking propagation | Resource-service links save, duration rows partially fail | Booking availability still uses old duration or only some services update | Booking settings writes are split across two tables without rollback | One booking propagation RPC | Medium |
| 10 | Moderator resolution | Moderation partial write | Content is hidden but report stays open, or report closes without action/event parity | Moderation dashboard and runtime visibility disagree | Hide, action log, report status, and event log are separate writes | One moderation-resolution RPC | Large |
| 11 | Create Wanders card / publish from builder | Card + mailbox split | Card row exists, mailbox seed fails; builder image upload can also orphan | Sender cannot reliably see a sent card in mailbox | Card create and mailbox seed are app-side sequential writes | Move card + mailbox seed into one DB contract | Medium |
| 12 | Create reply as anon | Best-effort tail writes | Reply succeeds, recipient claim/mailbox/event writes fail | Reply exists, but recipient inbox/event trail is inconsistent | Only reply insert is required; all other writes are best-effort | One reply RPC for recipient claim + mailbox seed; move events to durable queue | Medium |
| 13 | Menu item save with image | Upload-first menu mutation | Image upload succeeds, item save fails | Menu item image orphaned in storage | No cleanup after upload-first UI flow | Finalize upload after item row persists | Small |
| 14 | Design asset upload + export queue | Asset / queue split | Asset upload or export enqueue partially succeeds | Design studio shows dangling assets or stuck exports | Upload and queue creation are separate non-transactional writes | Asset finalize RPC and export enqueue RPC | Medium |
| 15 | Create booking | Duplicate booking on retry | User resubmits after network uncertainty | Two bookings exist for one intended action | Plain insert with no request token | Add booking request id / uniqueness contract | Medium |

## Execution order

1. Remove duplicate authorities first: legacy chat send/read/inbox actions, settings block path, legacy post create path.
2. Add transaction boundaries second: follow accept, booking duration propagation, fuel review officialization, moderation resolution.
3. Add upload finalization third: posts, profiles, VPORT create, menu items, design assets, Wanders builder.
4. Add idempotency tokens last for remaining create flows: booking, Wanders card/reply, VPORT create if RPC cannot guarantee convergence.

## Lowest-effort wins

| Fix | Why it pays off quickly |
| --- | --- |
| Check and throw Supabase errors in notification read/seen DALs | Removes silent read-state drift with minimal code change |
| Route settings block UI through main block controller | Eliminates one duplicate authority without schema changes |
| Delete or quarantine remaining legacy chat send callers | Cuts the highest-risk hybrid write path |
| Make follow-request accept a DB RPC | Removes one of the clearest partial-write bugs |

## Highest-leverage long-term fixes

| Fix | Why it matters |
| --- | --- |
| Onboarding contract RPC | Removes the most damaging identity partial-write path |
| Post create finalize RPC | Hardens one of the highest-traffic create flows |
| Unified chat write authority | Simplifies migration, debugging, and badge/inbox correctness |
| Upload reservation/finalize model | Reduces orphaned storage across multiple domains at once |
