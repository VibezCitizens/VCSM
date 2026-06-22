---
ticket: TICKET-LOGIN-0001
document: ux-audit
created: 2026-06-05
---

# UX Audit — Login Screen

## Evaluation Criteria

Audited against: Visual hierarchy, accessibility, contrast, typography, spacing,
mobile readiness, error state readiness, loading state readiness.

---

## Visual Hierarchy

### Assessment: GOOD

- Title ("Vibez Citizens") is dominant — large serif font in gold/amber on dark background. Clear focal point.
- Tagline is visually subordinate — appropriate size and muted color.
- Form fields are clearly labeled and grouped.
- CTA (Login button) is distinguishable from the card background.
- Footer links are properly de-emphasized at the bottom.

### Weakness

- The "Login" button's color contrast against the card background is low. The button appears dark gray on dark gray — the CTA may not pop enough to draw the eye decisively.
- The "BETA" badge is visually loud (pink/red) relative to the rest of the card — may confuse new users about platform readiness.

---

## Accessibility

### Assessment: NEEDS WORK

| Check | Status | Notes |
|---|---|---|
| Form labels present | PASS | "Email" and "Password" labels are visible above inputs |
| `<label>` HTML association | UNKNOWN | Cannot verify `for`/`id` pairing from screenshot — assume needs verification |
| Color as only indicator | RISK | Error states, if any, must not rely solely on red color |
| Keyboard navigation | UNKNOWN | Tab order not verifiable from screenshot — assume needs testing |
| Focus indicators | UNKNOWN | Focus ring visibility on dark background is a known risk area |
| Screen reader support | UNKNOWN | `aria-label`, `aria-describedby` on inputs — cannot verify |
| Button role | ASSUMED PASS | Login appears to be a `<button>` element |
| Placeholder as label anti-pattern | PASS | Labels are separate from placeholders — good pattern |

### Recommendations

- Verify all `<input>` elements have `<label>` elements with proper `for`/`id` pairing.
- Add `aria-label` to the logo title if it is purely decorative.
- Ensure `autocomplete="email"` and `autocomplete="current-password"` are set on inputs.
- Verify focus rings are visible at sufficient contrast on the dark background.

---

## Contrast

### Assessment: MIXED

| Element | Observed | Assessment |
|---|---|---|
| Title on background | Gold/amber on near-black | HIGH CONTRAST — likely passes WCAG AA |
| Tagline on background | Muted white/gray on dark | MEDIUM — check exact hex; may fail for small text |
| Input labels | White/light gray on dark card | LIKELY PASSES |
| Input placeholders | Muted gray on dark input | RISK — placeholder text is intentionally lighter; check WCAG AA 4.5:1 |
| Login button text | Light on dark button | LIKELY PASSES |
| Forgot/Create links | Light on dark background | MEDIUM — needs verification |
| Footer links | Muted on dark | RISK — likely fails for small, gray-on-gray text |
| BETA badge | White on pink/red | LIKELY PASSES |
| Debug widgets | Light on very dark | Dev-only; not a prod concern |

### Recommendations

- Use a contrast checker (e.g., WebAIM) on placeholder text — it is a frequent WCAG failure point.
- Footer link colors should meet at least 4.5:1 contrast ratio against the page background.
- Tagline copy should be checked — the muted gray on near-black may be borderline.

---

## Typography

### Assessment: GOOD

- Title uses a serif typeface — distinctive and on-brand.
- UI chrome (labels, links, footer) uses a sans-serif — readable and appropriate.
- Size hierarchy is clear: title > tagline > labels > links > footer.

### Weakness

- If the title font is loaded via an external CDN (Google Fonts, etc.), verify it does not cause layout shift (FOUT/FOIT) that degrades perceived performance on slow connections.

---

## Spacing

### Assessment: GOOD

- Generous vertical spacing between form elements — not cramped.
- Card padding appears consistent.
- "Forgot password?" and "Create account" are well-separated horizontally (left/right alignment) — clear visual distinction.

### Weakness

- Cannot verify exact spacing values from screenshot — confirm that spacing tokens are used consistently (e.g., Tailwind spacing scale or design tokens) rather than hard-coded `px` values.

---

## Mobile Readiness

### Assessment: UNKNOWN — RISK

| Concern | Notes |
|---|---|
| Card width on narrow viewports | Card appears fixed-width on desktop; must collapse to full-width on mobile |
| Input tap target size | Must be minimum 44×44px per Apple/Google HIG |
| Font scaling | Serif title may render small on narrow viewports |
| Footer link spacing | Pipe-separated footer on one line may wrap awkwardly on small screens |
| Virtual keyboard behavior | Password field should not cause layout shift when keyboard appears |
| Safe area insets | Bottom footer must not be obscured by home indicator on iOS |

### Recommendations

- Test on 375px viewport (iPhone SE baseline).
- Ensure card uses `max-w-sm w-full` or equivalent responsive classes.
- Footer links should either wrap gracefully or use a stacked layout below a breakpoint.

---

## Error State Readiness

### Assessment: UNKNOWN — RISK

From the screenshot, no error state is visible. The following error cases must be handled:

| Error Case | Required UI |
|---|---|
| Empty email on submit | Inline error below email field |
| Invalid email format | Inline error below email field |
| Empty password on submit | Inline error below password field |
| Wrong credentials | Non-field error (e.g., banner above form or below password) |
| Account not found | Error message — avoid "account not found" (enumeration risk) |
| Rate limited | Friendly message: "Too many attempts. Try again in X minutes." |
| Network error | Generic error with retry CTA |
| Auth service down | Graceful degradation message |

### Recommendations

- Confirm inline error messages are implemented per field.
- Wrong-credentials error must be generic: "Invalid email or password." — never differentiate between wrong email vs wrong password (prevents enumeration).
- Add a visible error container that screen readers can `aria-live="polite"` announce.

---

## Loading State Readiness

### Assessment: UNKNOWN — RISK

From the screenshot, no loading state is visible. Required behavior:

| State | Required UI |
|---|---|
| Credentials submitted | Button shows spinner or "Logging in..." text |
| Button disabled during in-flight request | Prevents duplicate submissions |
| Form fields disabled or locked | Prevents editing during auth call |
| Redirect on success | Immediate — no stale loading UI |

### Recommendations

- Login button should transition to a loading state (spinner + disabled) immediately on submit.
- Avoid long in-flight states with no feedback — add a timeout fallback message if auth takes > 5s.

---

## Summary

| Category | Rating | Action Required |
|---|---|---|
| Visual Hierarchy | GOOD | Minor CTA contrast improvement |
| Accessibility | NEEDS WORK | Label associations, focus rings, aria |
| Contrast | MIXED | Verify placeholder, footer, tagline |
| Typography | GOOD | Monitor FOUT on font load |
| Spacing | GOOD | Verify design token consistency |
| Mobile Readiness | RISK | Test on 375px, fix card width and footer wrap |
| Error States | RISK | Implement and verify all error cases |
| Loading States | RISK | Implement button loading + form lock |
