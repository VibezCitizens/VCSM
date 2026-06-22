# VCSM Theme System

**Last updated:** April 10, 2026

## Overview

The VCSM app uses a centralized CSS custom property (design token) system for all visual theming. Every color, surface, border, shadow, and gradient across the entire app derives from a single set of `--vc-*` tokens defined in one file.

**Single source of truth:**
```
apps/VCSM/src/styles/citizens-theme.css
```

To change the theme, you change only the `:root` values in that file. Everything else follows.

---

## Architecture

```
citizens-theme.css (:root --vc-* tokens)
        │
        ├── global.css (body, .vc-dynamic-gradient)
        │
        ├── Feature CSS files (alias --vc-* into local vars)
        │   ├── profiles-modern.css   (--profiles-*)
        │   ├── post-modern.css       (--post-*)
        │   ├── chat-modern.css       (--chat-*)
        │   ├── explore-modern.css    (--explore-*)
        │   ├── upload-modern.css     (--upload-*)
        │   ├── settings-modern.css   (--settings-*)
        │   ├── notifications-modern.css
        │   └── module-modern.css
        │
        ├── authTheme.js (JS object using var(--vc-*) for inline styles)
        │
        └── Component inline styles (reference tokens via Tailwind or var())
```

### Import Order (main.jsx)

```js
import '@/styles/global.css'        // base reset + body bg
import '@/styles/citizens-theme.css' // :root tokens — MUST come before feature CSS
```

Feature CSS files are imported by individual screens/components. They inherit from `:root` automatically.

---

## Token Reference

All tokens are defined in `citizens-theme.css` under `:root`.

### Backgrounds

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-bg-0` | Deepest background (page base) | `#0b0b0f` |
| `--vc-bg-1` | Soft background (slightly elevated) | `#0e0d14` |
| `--vc-bg-2` | Elevated background | `#13121a` |

### Page Gradient

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-gradient-a` | Top-left glow color | `rgba(108, 77, 246, 0.15)` (purple) |
| `--vc-gradient-b` | Bottom-right glow color | `rgba(59, 130, 246, 0.10)` (blue) |

Used in `global.css`, `RootLayout`, and every feature page background:
```css
background:
  radial-gradient(900px 500px at 15% 10%, var(--vc-gradient-a), transparent 60%),
  radial-gradient(800px 420px at 85% 90%, var(--vc-gradient-b), transparent 60%),
  var(--vc-bg-0);
```

### Surfaces

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-surface` | Card / panel background | `rgba(20, 18, 30, 0.66)` |
| `--vc-surface-strong` | Elevated card / modal | `rgba(26, 22, 38, 0.84)` |
| `--vc-surface-input` | Input field background | `rgba(14, 12, 22, 0.78)` |

### Card Presets

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-card-bg` | Standard card gradient | `linear-gradient(180deg, rgba(20,20,26,0.98), rgba(20,20,26,0.90))` |
| `--vc-card-bg-blue` | Card with blue highlight overlay | gradient over `--vc-surface` |

### Borders

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-border` | Default border | `rgba(139, 92, 246, 0.18)` — purple tinted |
| `--vc-border-strong` | Focused / hover border | `rgba(139, 92, 246, 0.28)` |
| `--vc-border-subtle` | Dividers / separators | `rgba(139, 92, 246, 0.10)` |

### Text

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-text` | Primary text | `#f0eef5` |
| `--vc-text-soft` | Secondary text | `#d1d0d8` |
| `--vc-text-muted` | Muted / placeholder | `#9892a6` |

### Accents

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-accent-primary` | Primary purple | `#8b5cf6` |
| `--vc-accent-primary-hover` | Purple hover | `#a78bfa` |
| `--vc-accent-secondary` | Blue accent | `#4ea4ff` |
| `--vc-accent-tertiary` | Cyan accent | `#42d3ff` |
| `--vc-accent-pink` | Pink accent | `#ff69c6` |

### Semantic Colors

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-success` | Success green | `#22c55e` |
| `--vc-error` | Error red | `#ef4444` |
| `--vc-warning` | Warning amber | `#f59e0b` |
| `--vc-danger-a` | Danger pink | `rgba(190, 24, 93, 0.7)` |
| `--vc-danger-b` | Danger red | `rgba(220, 38, 38, 0.72)` |

### Shadows

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-shadow-card` | Standard card shadow | `0 12px 30px rgba(0,0,0,0.35)` |
| `--vc-shadow-elevated` | Elevated card + glow | `0 24px 45px rgba(0,0,0,0.36), 0 0 22px rgba(96,141,255,0.14)` |
| `--vc-shadow-glow` | Accent glow (buttons) | `0 10px 30px rgba(139,92,246,0.35)` |

### Utilities

| Token | Purpose | Default Value |
|---|---|---|
| `--vc-ring` | Focus ring | `0 0 0 3px rgba(139,92,246,0.24)` |
| `--vc-backdrop-blur` | Backdrop filter | `blur(12px)` |

---

## How Feature CSS Works

Each feature CSS file aliases the central tokens into local names. This keeps existing class names working while values come from one place.

Example from `chat-modern.css`:
```css
.chat-modern-page {
  --chat-bg-a: var(--vc-bg-0);
  --chat-border: var(--vc-border);
  --chat-text: var(--vc-text);
  --chat-accent-a: var(--vc-accent-primary);
  /* ... */
}
```

The local `--chat-*` vars are used throughout the rest of the file. But they all resolve to the central `--vc-*` tokens.

**Feature CSS files and their local alias prefixes:**

| File | Local Prefix | Used By |
|---|---|---|
| `profiles-modern.css` | `--profiles-*` | Feed, profiles, social screens |
| `post-modern.css` | `--post-*` | Post cards, comments, sparks |
| `chat-modern.css` | `--chat-*` | Chat inbox, conversations, bubbles |
| `explore-modern.css` | `--explore-*` | Explore/search screen |
| `upload-modern.css` | `--upload-*` | Upload/create post screen |
| `settings-modern.css` | `--settings-*` | Settings screens |
| `notifications-modern.css` | (no prefix, uses --vc-* directly) | Notifications screen |
| `module-modern.css` | (no prefix, uses --vc-* directly) | Shared module patterns |

---

## How authTheme.js Works

For screens that use inline `style={}` (login, register, legal, consent gate), there is a JS theme object:

```
apps/VCSM/src/features/auth/styles/authTheme.js
```

```js
export const authTheme = {
  pageBackground:
    'radial-gradient(... var(--vc-gradient-a) ...) var(--vc-bg-0)',
  cardBackground: 'var(--vc-card-bg)',
  cardShadow: '0 30px 70px rgba(0,0,0,0.55), ...',
}
```

It references `var(--vc-*)` so it stays in sync with the CSS tokens. Used in:
- `LoginScreen.jsx`
- `LegalDocumentScreen.jsx`
- `ConsentGateScreen.jsx`

---

## How to Switch Themes

### Option A: Static theme change

Edit `citizens-theme.css` `:root` values. Every screen updates automatically.

Example — switching to a warmer theme:
```css
:root {
  --vc-bg-0: #0f0a06;
  --vc-gradient-a: rgba(246, 146, 77, 0.15);
  --vc-accent-primary: #f59e0b;
  /* ... */
}
```

### Option B: Runtime theme switching (future)

Add a `[data-theme]` attribute selector that overrides the tokens:

```css
[data-theme="warm"] {
  --vc-bg-0: #0f0a06;
  --vc-gradient-a: rgba(246, 146, 77, 0.15);
  --vc-accent-primary: #f59e0b;
  /* override only what changes */
}
```

Then toggle via JS:
```js
document.documentElement.setAttribute('data-theme', 'warm')
```

All CSS and JS that references `var(--vc-*)` updates instantly — no rebuild needed.

### Option C: Seasonal themes

The app already has a season system (`src/season/`). It currently handles decorative elements (hat, fog). To extend it for full theming:

1. Define seasonal token overrides as CSS classes
2. Apply the class to `<html>` or `<body>` based on the active season
3. The seasonal class overrides `--vc-*` values

---

## Files That Consume Tokens

### CSS files (reference via `var(--vc-*)`)

| File | Path |
|---|---|
| Global base | `src/styles/global.css` |
| Theme tokens | `src/styles/citizens-theme.css` |
| Profiles | `src/features/profiles/styles/profiles-modern.css` |
| Profiles — booking | `src/features/profiles/styles/profiles-booking-modern.css` |
| Profiles — friends | `src/features/profiles/styles/profiles-friends-modern.css` |
| Profiles — photos | `src/features/profiles/styles/profiles-photos-modern.css` |
| Posts | `src/features/post/styles/post-modern.css` |
| Chat | `src/features/chat/styles/chat-modern.css` |
| Explore | `src/features/explore/styles/explore-modern.css` |
| Upload | `src/features/upload/styles/upload-modern.css` |
| Settings | `src/features/settings/styles/settings-modern.css` |
| Notifications | `src/features/notifications/styles/notifications-modern.css` |
| Module base | `src/features/ui/modern/module-modern.css` |
| iOS platform | `src/app/platform/ios/ios.css` |
| Legal docs | `src/features/legal/styles/legalDocument.css` |

### JS files (reference via `var(--vc-*)` in style strings)

| File | Path |
|---|---|
| Auth theme | `src/features/auth/styles/authTheme.js` |

### Components with inline theme references

| Component | What it uses |
|---|---|
| `LoginScreen.jsx` | `authTheme.pageBackground`, `authTheme.cardBackground` |
| `RegisterFormCard.jsx` | Hardcoded inline gradients (match token values) |
| `LegalDocumentScreen.jsx` | `authTheme.pageBackground`, `authTheme.cardBackground` |
| `ConsentGateScreen.jsx` | `authTheme.pageBackground`, `authTheme.cardBackground` |
| `TopNav.jsx` | `bg-[var(--vc-bg-0)]/72` |

### Wanders system (via wandersChrome.js + inline styles)

Wanders uses `var(--vc-*)` tokens via two mechanisms:
- **`wandersChrome.js`** — Tailwind arbitrary-value class strings (`bg-[var(--vc-bg-0)]`, `border-[var(--vc-border)]`, etc.) shared by all Wanders views
- **Inline `style={}` objects** — `var(--vc-*)` referenced directly in JS style values across `WandersCardPublic.view.jsx`, `WandersMailbox.view.jsx`, `WandersMailboxItemRow.jsx`, `WandersCardPreview.jsx`

Wanders does not have a dedicated feature CSS file. See `vcsm/wanders/vcsm.wanders.system.md` for full architecture.

---

## What NOT to Do

1. **Don't hardcode hex colors in new CSS.** Use `var(--vc-*)` tokens.
2. **Don't create new feature-specific tokens** unless you alias them from `--vc-*`.
3. **Don't add blue-tinted rgba values.** The theme is purple-based. Use the existing tokens.
4. **Don't import `citizens-theme.css` in feature files.** It's imported once in `main.jsx`.
5. **Don't duplicate gradient definitions.** Use `var(--vc-gradient-a)` and `var(--vc-gradient-b)`.

---

## Learning System Exception

The learning system (`/learning` route) uses a completely separate light theme:

```
src/learning/styles/learning.css
```

It defines its own `--learning-*` tokens (white background, black text). This is intentional — it's an embedded LMS with different UX requirements. The `RootLayout` switches to `bg-white text-black` for learning routes.

The learning theme does NOT reference `--vc-*` tokens and should not be merged into the main theme system.

---

## Quick Reference: Adding a New Screen

When building a new screen that needs the standard dark theme:

1. Apply the page background class `profiles-modern` or use inline `authTheme.pageBackground`
2. Use `var(--vc-card-bg)` for card surfaces
3. Use `var(--vc-border)` for card borders
4. Use `var(--vc-text)` / `var(--vc-text-muted)` for text
5. Use `var(--vc-accent-primary)` for interactive elements
6. Use `var(--vc-shadow-card)` for card shadows
7. Use `var(--vc-ring)` for focus states

No new token definitions needed. Just reference the existing ones.

---

## Changelog

### April 25, 2026

**Wanders CSS migration — all Wanders components now use `--vc-*` tokens:**
- `wandersChrome.js` — migrated from `bg-black`, `border-white/10`, `text-zinc-*`, `bg-zinc-900` and `rgba(124,58,237,...)` to full `var(--vc-*)` Tailwind arbitrary values
- `WandersCardPublic.view.jsx`, `WandersMailbox.view.jsx`, `WandersMailboxItemRow.jsx`, `WandersCardPreview.jsx` — inline `rgba()` color strings replaced with `var(--vc-*)` references
- `getTemplateTheme()` in `WandersCardPreview` — legacy light-theme fallback updated to dark `--vc-*` palette
- Purple glow colors corrected from `rgba(124,58,237,...)` to `rgba(139,92,246,...)` matching `--vc-accent-primary`

Added Wanders section to "Components with inline theme references" above.

### April 10, 2026

**Token fixes — removed all blue tints from core tokens:**
- `--vc-surface`: `rgba(18,28,54,0.66)` → `rgba(20,18,30,0.66)` (purple-neutral)
- `--vc-surface-strong`: `rgba(24,35,64,0.84)` → `rgba(26,22,38,0.84)`
- `--vc-surface-input`: `rgba(7,12,28,0.78)` → `rgba(14,12,22,0.78)`
- `--vc-border`: `rgba(139,167,255,0.24)` → `rgba(139,92,246,0.18)` (purple)
- `--vc-border-strong`: `rgba(141,175,255,0.32)` → `rgba(139,92,246,0.28)`
- `--vc-border-subtle`: `rgba(139,167,255,0.14)` → `rgba(139,92,246,0.10)`
- `--vc-text`: `#eef3ff` → `#f0eef5`
- `--vc-text-soft`: `#d1d5db` → `#d1d0d8`
- `--vc-text-muted`: `#a8b8df` → `#9892a6`
- `--vc-shadow-elevated`: blue glow → purple glow

**CSS files unified to tokens (full sweep):**
- `global.css`, `citizens-theme.css`
- `profiles-modern.css`, `profiles-friends-modern.css`, `profiles-booking-modern.css`, `profiles-booking-daypanel-modern.css`, `profiles-photos-modern.css`, `profiles-portfolio-modern.css`
- `post-modern.css`, `chat-modern.css`, `explore-modern.css`, `upload-modern.css`
- `settings-modern.css`, `notifications-modern.css`, `module-modern.css`
- `ios.css`

**Components updated to remove Tailwind blue/slate/indigo classes:**
- `OnboardingCardsView.jsx`, `OnboardingCard.jsx`, `OnboardingCardList.jsx`
- `NotificationCard.jsx`, `NotificationsHeader.view.jsx`, `Notifications.view.jsx`
- `PostDetail.view.jsx` (sparks header, iOS composer button)
- `ActorPill.jsx` (upload screen — fixed invisible pill)
- `TopNav.jsx`

### April 9, 2026

- Initial theme system created
- `citizens-theme.css` established as single source of truth
- All feature CSS files aliased to `--vc-*` tokens
- `authTheme.js` created for inline style references
- Theme documentation written
