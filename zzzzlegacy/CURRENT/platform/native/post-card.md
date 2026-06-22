# Module: Post card

## PWA Source of Truth

**Routes:** `/feed`, `/profile/:id`, `/posts/:id`

**Screens/components:**
- `apps/VCSM/src/features/post/postcard/*`
- `apps/VCSM/src/features/feed/*`

**Services/DAL:**
- `apps/VCSM/src/features/post/postcard/dal/*`
- `apps/VCSM/src/features/post/postcard/controller/*`

**Supabase schema/tables/RPCs:**
- `vc.posts`
- `vc.post_media`
- `vc.post_reactions`
- `vc.post_comments`
- `vc.post_rose_gifts`

**RLS expectations:** Post card reads must respect the same feed visibility and actor safety rules as feed/detail. Any card-level action must remain RLS-compatible and authenticated-only.

**Current PWA status:** Canonical PostCard suite includes header, body, media, reactions, comments/share footer, and actor actions menu.

---

## Native Transfer Status

**Status:** `Partial`

---

## Transferred Native Files

- `VCSMNativeApp/Features/Feed/FeedRowView.swift`
- `VCSMNativeApp/Features/Feed/FeedActionMenu.swift`
- `VCSMNativeApp/Features/Feed/SpreadShareButton.swift`
- `VCSMNativeApp/Services/Feed/LiveFeedService.swift`
- `VCSMNativeApp/Shared/Views/MentionText.swift`
- `VCSMNativeApp/Shared/Views/InlineVideoPlayer.swift`

---

## Native Behavior Currently Present

- Full post card with header (avatar, name, handle, timestamp, location, edited badge), body with `MentionText` (@mention deep links), media carousel with image/video support (pagination, arrows, slide indicators), reaction bar with like/dislike/rose counts and active viewer state, comment count, share/spread chip with spread count, post type badge, and action menu.
- Media carousel supports both images (`AsyncImage`) and videos (`InlineVideoPlayer`).
- Reaction chips show count and glow effect for active state.
- Spread count now displayed next to share button when > 0.

---

## Native Gaps

- No quote post inline preview.
- No hashtag styling (only @mentions are styled).
- No rich link preview cards for embedded URLs.
- No thread context indicator ("replying to").
- These are polish items — core card functionality is at parity.

---

## Risk Notes

- Post card inherits feed visibility risks — see [feed.md](feed.md) for safety lookup fail-open risks.
- Post card also inherits post detail reaction/comment contract risks — see [post-detail.md](post-detail.md).
- Any card-level write action (react, comment, share) must be RLS-compatible and authenticated-only.

---

## Pending Transfer Checklist

- [x] Inventory PWA PostCard props — all core props matched (header, body, media, reactions, comments, spread).
- [x] Media carousel with image/video, pagination, and navigation arrows implemented.
- [x] Reaction bar with counts, active state, and viewer reaction tracking implemented.
- [x] MentionText with @mention deep links implemented.
- [x] Spread count display added to share chip.
- [ ] Add quote post inline preview (P2 polish).
- [ ] Add hashtag styling in post body (P2 polish).
- [ ] Add rich link preview cards (P2 polish).
- [ ] Runtime QA for media aspect ratios and share payload.

---

## PWA → Native Transfer Log

### 2026-05-03 — Post card audit and spread count fix

- Date: 2026-05-03
- Change type: Fix / Audit
- PWA files changed: none
- Routes affected: `/feed`
- Screens/components changed: `FeedRowView.swift` (spread count display added)
- Services/DAL changed: none
- Behavior change: Spread count now visible next to share button when > 0. Prior audit confirmed card already has full media carousel, mention rendering, reaction bar with active state, comment count, and action menu.
- Supabase schema/RPC change: none
- RLS expectations changed: no
- Affected native modules: Post card, Feed
- Priority: P1
- Native status: Partial → near-Complete (only quote/hashtag/link preview polish remain)
- Testing notes: Xcode diagnostics zero issues. Runtime QA pending.
- Notes: Tracker was significantly out of date — card was already feature-complete except spread count display and polish items.

---

## Transfer History

- Last synced date: 2026-05-03
- Native files updated: `FeedRowView.swift` (spread count display)
- Delta status: Near-Complete — core card at parity; quote/hashtag/link preview are P2 polish
- Notes: Full audit confirmed card has all core features (media carousel, mentions, reactions, comments, spread, action menu). Tracker upgraded from inaccurate "Partial".

---

## Archived Notes

No archived notes yet.
