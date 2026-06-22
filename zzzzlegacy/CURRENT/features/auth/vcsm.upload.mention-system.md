# VCSM — Mention / Tagging System

Date: 2026-05-03
Scope: apps/VCSM/src/features/upload/
Type: Feature Documentation
Status: Live

---

## 1. Overview

The mention system lets users tag other actors (citizens or Vports) inside a post caption by typing `@handle`. It works as an inline typeahead autocomplete: as the user types, a dropdown appears with matching actors. Picking one inserts the handle into the caption text and adds the actor to a visible chip list below the textarea.

After posting, mentions stored in the post record can be rendered as tappable links via `LinkifiedMentions`.

---

## 2. File Map

| File | Layer | Role |
|---|---|---|
| `dal/searchMentionSuggestions.dal.js` | DAL | Calls `identity.search_actor_directory` RPC on Supabase |
| `controller/searchMentionSuggestions.controller.js` | Controller | Thin guard — validates query, delegates to DAL |
| `hooks/useMentionAutocomplete.js` | Hook | All mention state: caret detection, debounced search, apply logic |
| `ui/MentionTypeahead.jsx` | UI | Dropdown rendered inside `CaptionCard` (no absolute positioning) |
| `ui/MentionAutocompleteList.jsx` | UI | Dropdown variant with `absolute` positioning — for other surfaces |
| `ui/MentionChips.jsx` | UI | Horizontal chip row showing confirmed mentions; supports remove + link to actor |
| `ui/LinkifiedMentions.jsx` | UI | Post-publish renderer: parses caption text, wraps matched handles in `<Link>` |
| `ui/CaptionCard.jsx` | View | Host component — wires hook + all mention UI together with caption textarea |

---

## 3. Data Flow

```
User types "@jo" in textarea
  → useMentionAutocomplete detects caret is inside an @-token
  → debounce 120ms
  → ctrlSearchMentionSuggestions({ query: "jo", limit: 8 })
  → searchMentionSuggestions DAL → Supabase identity.search_actor_directory RPC
  → results: [{ actor_id, kind, handle, display_name, photo_url }]
  → dropdown opens (MentionTypeahead)

User taps an item
  → handlePick(item) in CaptionCard
  → apply(picked) in hook: replaces "@jo" with "@jordan " in caption text
  → setCaption(nextText)
  → setMentions(prev → [...prev, { handle, actorId, kind, displayName, avatarUrl }])
  → dropdown closes
  → MentionChips renders new chip
```

---

## 4. DAL — `searchMentionSuggestions.dal.js`

**RPC:** `identity.search_actor_directory`

**Parameters:**

| Param | Value | Notes |
|---|---|---|
| `p_viewer_domain` | `'vc'` | Always `'vc'` for VCSM |
| `p_viewer_actor_id` | `null` | Not passed from this surface (unauthenticated search) |
| `p_query` | stripped prefix string | Leading `@` removed, trimmed |
| `p_filter` | `'all'` | Returns both users and Vports |
| `p_limit` | `8` (default) | Capped by controller |
| `p_offset` | `0` | No pagination in typeahead |

**Output shape per row:**

```js
{
  actor_id:     string,   // UUID
  kind:         'user' | 'vport',
  handle:       string,   // username / slug
  display_name: string | null,
  photo_url:    string | null,
}
```

Row is dropped if `actor_id` or `username` is missing.

---

## 5. Hook — `useMentionAutocomplete`

**Signature:**

```js
const { open, query, items, loading, onCaretEvent, apply, close } =
  useMentionAutocomplete({ value, inputRef })
```

**Props:**

| Prop | Type | Purpose |
|---|---|---|
| `value` | `string` | Current caption text (controlled) |
| `inputRef` | `React.RefObject` | Ref to the `<textarea>` — needed to read `selectionStart` |

**Returned state:**

| Key | Type | Description |
|---|---|---|
| `open` | `boolean` | Whether dropdown should be visible |
| `query` | `string` | Current mention prefix (without `@`) |
| `items` | `array` | Suggestion results from DAL |
| `loading` | `boolean` | Fetch in progress |
| `onCaretEvent` | `fn` | Call on `onSelect` + `onKeyUp` to sync caret position |
| `apply(picked)` | `fn → string` | Replaces `@token` in text with `@handle `, returns new caption string |
| `close()` | `fn` | Manually close and reset all state |

**Caret detection logic:**

1. Read `textarea.selectionStart`
2. Slice text from 0 to caret
3. Find last `@` in that slice
4. Char before `@` must be whitespace or start of string
5. Text after `@` must match `/^[a-zA-Z0-9_.-]{0,32}$/` and contain no whitespace
6. Minimum 1 char after `@` before opening dropdown

**Debounce:** 120ms. Stale responses discarded via `requestIdRef`.

**`apply(picked)` logic:**

Replaces text from `range.start` (position of `@`) to `range.end` (caret) with `@handle ` (trailing space). Moves caret to position after the inserted handle + space via `requestAnimationFrame`.

---

## 6. UI Components

### MentionTypeahead.jsx

Used in `CaptionCard` — renders inline (no absolute positioning), sits in normal document flow inside the `px-5` container.

```
Props: { open, items, onPick }
```

- Each row: `group` button → avatar (left) + name/handle (center) + circle indicator (right)
- Circle indicator: outlined at rest, gradient fill + inner dot on hover (150ms transition)
- Avatar: `w-8 h-8 rounded-lg object-cover border border-white/12` — per avatar rules

### MentionAutocompleteList.jsx

Positioned variant (`absolute z-50`) for surfaces outside the upload card where the dropdown needs to float over content.

```
Props: { open, items, onPick }
```

- Identical row structure to `MentionTypeahead`
- Avatar: `h-9 w-9 rounded-lg object-cover border border-white/12 bg-white/5`

### Circle Indicator (both components)

```jsx
<span className="ml-2 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-white/20 relative overflow-hidden
                 transition-colors duration-150 group-hover:border-transparent">
  <span className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500
                   opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
  <span className="absolute inset-0 flex items-center justify-center">
    <span className="w-1.5 h-1.5 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
  </span>
</span>
```

No JS state — purely CSS via `group` / `group-hover`. The outer circle border fades to transparent as the gradient layer fades in.

### MentionChips.jsx

Renders below the caption textarea after a mention is confirmed.

```
Props: { mentions, onRemove }
```

Each chip: `@handle` text + remove button (`x`). If `actorId` is known, wraps in `<Link to="/actor/:actorId">`. Otherwise renders as `<span>` (unresolved handle).

CSS class `.upload-chip` (defined in `upload-modern.css`) provides `border`, `background`, `border-radius: 9999px`.

`onRemove(handle)` is called with the string handle; parent is responsible for filtering it from the mentions array.

### LinkifiedMentions.jsx

Used post-publish to render caption text with tappable `@mention` links.

```
Props: { text, mentionMap, className }
```

`mentionMap` shape:

```js
{
  "jordan": { actorId: "uuid", route: "/profile/uuid", ... },
  "tripointlocks": { actorId: "uuid", route: "/vport/tripointlocks", ... }
}
```

**Algorithm:**
1. Extract keys from `mentionMap`
2. Sort by length descending (longest first, prevents partial match before full match)
3. Build regex: `(^|[^a-z0-9_-])(@)?(handle1|handle2)(?=$|[^a-z0-9_-])`
4. Walk matches, split into `{ type: 'text' }` and `{ type: 'mention', href }` parts
5. Render mentions as `<Link>` with violet color (`#a78bfa`), hover lightens to `#c4b5fd`

Route resolution via `getMentionTarget(entry)`: uses `entry.route` if present, falls back to `/profile/:actorId`.

---

## 7. CaptionCard Integration

`CaptionCard.jsx` is the host. It owns:

- `caption` (controlled from parent via props)
- `mentions` array (controlled from parent via props)
- Location state (internal — `cityQuery`, `cityResults`, `locationText`)
- `useMentionAutocomplete` hook

**`handlePick(item)` in CaptionCard:**

```js
function handlePick(item) {
  const handle = String(item?.handle || "").toLowerCase()
  if (!handle) return
  const nextText = apply({ handle })         // replaces token in caption
  if (typeof nextText !== 'string') return
  setCaption(nextText)
  setMentions(prev => {
    if (prev.some(m => m.handle === handle)) return prev  // dedup
    return [...prev, { handle, actorId, kind, displayName, avatarUrl }]
  })
}
```

Deduplication is done by `handle` — you cannot add the same actor twice.

---

## 8. Styling

Container class `.upload-typeahead` (from `upload-modern.css`):

```css
.upload-modern .upload-typeahead {
  border-radius: 0.9rem;
  border: 1px solid var(--vc-border);
  background: var(--vc-surface-input);
  box-shadow: var(--vc-shadow-elevated);
  overflow: hidden;
}
```

Container class `.upload-chip`:

```css
.upload-modern .upload-chip {
  border-radius: 9999px;
  border: 1px solid var(--vc-border);
  background: var(--vc-surface);
  color: var(--vc-text-soft);
}
```

---

## 9. Avatar Rules Compliance

All mention dropdowns follow the avatar rules contract (`logan/platform/vcsm.platform.avatar-rules.md`):

| Rule | Applied |
|---|---|
| `rounded-lg` (8px) for small avatars | `w-8 h-8 rounded-lg` / `h-9 w-9 rounded-lg` |
| `object-cover` | Yes |
| `border border-white/12` | Yes |
| `onError → /avatar.jpg` fallback | Yes |
| `rounded-full` BANNED | Not used on any avatar in these components |

---

## 10. Known Limitations

| Limitation | Notes |
|---|---|
| No keyboard navigation | Arrow keys do not move between suggestions. Click/tap only. |
| `p_viewer_actor_id` not passed | Search is unweighted — no boost for people you follow. Wire this when identity is available in upload context. |
| `LinkifiedMentions` uses inline style for colors | Should be migrated to `--vc-*` tokens or Tailwind classes when color system stabilizes. |
| `MentionChips` remove button renders literal `x` text | Should be replaced with an icon (e.g. Lucide `X`) for consistency. |
| No mention count cap | `setMentions` will keep appending. If a cap is needed (e.g. 10 max), add it in `handlePick`. |

---

## 11. Change Log

### 2026-05-03
- **Circle indicator UI**: Replaced row hover highlight with right-aligned circle indicator (outlined → gradient-filled on hover). 150ms CSS transition via `group`/`group-hover`. No JS state change.
- **Avatar compliance fix**: Both dropdown components corrected from `rounded-2xl` to `rounded-lg`, added `border-white/12`, added `onError` fallback.
