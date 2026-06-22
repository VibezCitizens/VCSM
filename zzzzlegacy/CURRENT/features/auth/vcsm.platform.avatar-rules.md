# VCSM UI — Avatar & Profile Picture Rules

## 1. Purpose

Define the canonical avatar/profile picture rendering rules for all actor avatars across the VCSM app. This is a non-negotiable design contract.

## 2. Scope

Every place an actor avatar or profile picture is rendered, including:
- Feed post headers
- Comment/spark cards
- Notification cards
- Chat inbox rows
- Chat conversation members
- Profile headers
- Upload screen actor pill
- Explore search results
- Follow/subscriber lists
- Booking cards
- Review author cards
- Any future surface showing an actor identity

## 3. The Rule

**Avatars must be SQUARE with subtle ROUNDED CORNERS. Never circular.**

```
Shape: rounded-lg (8px border-radius)
Aspect: 1:1 square
Fit: object-cover
Border: border-white/12 (1px, subtle)
Fallback: onError → /avatar.jpg
```

### Size-based radius rules

| Avatar Size | Radius | Class | Why |
|---|---|---|---|
| Large (64px+) — profile headers | `rounded-2xl` (16px) | `rounded-2xl` | Big enough that 16px still reads as square |
| Medium (36-56px) — cards, lists, feed | `rounded-lg` (8px) | `rounded-lg` | The standard. Clearly square with subtle corners. |
| Small (24-32px) — pills, compact | `rounded-lg` (8px) | `rounded-lg` | Same as medium — consistency |
| Tiny (<24px) | `rounded-md` (6px) | `rounded-md` | Tighter radius for very small images |

### What is allowed
- `rounded-2xl` (16px) — ONLY for large avatars (64px+, profile headers)
- `rounded-lg` (8px) — the default for everything else
- `rounded-md` (6px) — acceptable for tiny avatars (< 24px)

### What is NOT allowed
- `rounded-full` — BANNED (creates circle)
- `rounded-xl` (12px) — too round on medium/small avatars
- `rounded-3xl` — too round
- No border-radius at all — looks too harsh

## 4. Shared Component

**File:** `apps/VCSM/src/shared/components/ActorLink.jsx`

This is the canonical avatar renderer. All surfaces should use it or follow its rules.

```jsx
<ActorLink
  actor={{ id, displayName, username, avatar, route }}
  avatarSize="w-11 h-11"    // default 44px
  avatarShape="rounded-lg"   // default — THE RULE
/>
```

### ActorLink defaults
- `avatarSize`: `"w-11 h-11"` (44px)
- `avatarShape`: `"rounded-lg"` (8px radius)
- `border`: `border-white/12`
- `object-fit`: `cover`
- `fallback`: `onError → /avatar.jpg`

### Common size overrides
| Context | Size | Shape |
|---|---|---|
| Feed post header | `w-10 h-10` (40px) | `rounded-lg` |
| Comment card | `w-9 h-9` (36px) | `rounded-lg` |
| Notification card | `w-11 h-11` (44px) | `rounded-lg` (default) |
| Upload actor pill | `h-7 w-7` (28px) | `rounded-lg` |
| Explore result row | `w-[2.7rem]` (43px) | `rounded-lg` |
| Profile header | Larger (custom) | `rounded-lg` or `rounded-xl` max |

## 5. Source of Truth

This document + `ActorLink.jsx` are the source of truth. If a component renders an avatar without using `ActorLink`, it must still follow these rules:

1. Shape: `rounded-lg`
2. Border: `border border-white/12`
3. Fit: `object-cover`
4. Fallback: `onError` handler that sets `src="/avatar.jpg"`
5. Loading: `loading="lazy"` for non-critical avatars

## 6. Rules / Invariants

1. **Never use `rounded-full` for avatars.** This is the #1 rule.
2. **Never use `rounded-xl` or `rounded-2xl` for avatars.** Too round.
3. **Always use `object-cover`.** Prevents stretching/squishing.
4. **Always include `onError` fallback.** Broken images must fall back gracefully.
5. **Always use `border-white/12`.** Subtle border separates avatar from background.
6. **Aspect ratio is always 1:1.** Use equal width/height classes.

## 7. Files Map

| File | Role |
|---|---|
| `shared/components/ActorLink.jsx` | Canonical shared avatar component |
| `features/upload/ui/ActorPill.jsx` | Upload screen identity pill (inline avatar) |
| `features/post/commentcard/components/cc/CommentHeader.jsx` | Comment card avatar (via ActorLink) |
| `features/profiles/screens/views/tabs/photos/components/PhotoGrid.jsx` | Photo grid (no avatar, but references ActorLink pattern) |

## 8. Origin

Rule established in `planning/april/09/09-19.md`:
- Line 1202: "Keep avatar rule strict: never circular, always square with rounded corners"
- Line 1236: "square-ish cards with rounded corners, never circular media frames"
- Line 1279: "Avatar/logo must remain square with rounded corners, never circle"
- Line 1379: "Portfolio grid with square cards (rounded-2xl corners, never circular)"

## 9. Change Log

### 2026-04-10 08:00 AM
- Task: Document and enforce avatar rules
- Code Status Before: Mixed — ActorLink defaulted to `rounded-2xl`, comment cards used `rounded-xl`, upload pill used `rounded-xl`. All too round.
- Summary: Standardized all avatar shapes to `rounded-lg` (8px). Updated ActorLink default, CommentHeader override, ActorPill. Created this document as the canonical reference.
- Files Changed:
  - `apps/VCSM/src/shared/components/ActorLink.jsx` — default `rounded-2xl` → `rounded-lg`
  - `apps/VCSM/src/features/post/commentcard/components/cc/CommentHeader.jsx` — `rounded-xl` → `rounded-lg`
  - `apps/VCSM/src/features/upload/ui/ActorPill.jsx` — `rounded-xl` → `rounded-lg`
  - Created: `logan/vcsm/ui/vcsm.ui.avatar-rules.md`
- Validation:
  - All avatars across app render as square with subtle rounded corners
  - No `rounded-full`, `rounded-xl`, or `rounded-2xl` on any avatar element
  - Fallback to `/avatar.jpg` on broken images
