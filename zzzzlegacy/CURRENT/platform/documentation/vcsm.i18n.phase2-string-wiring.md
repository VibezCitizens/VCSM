# VCSM i18n Phase 2 — String Wiring

Date: 2026-05-09
Scope: VCSM + ENGINE
Type: Infrastructure / UI
Status: In Progress — Batch 4 complete

---

## 1. What This Phase Does

Wires the existing i18n infrastructure (Phase 1) into actual UI components. No architecture changes — only `useTranslation()` calls replacing hardcoded strings.

Spanish values are placeholders (English copies). Human translation is supplied by the product owner directly per Translation Rules in Phase 1 doc.

---

## 2. New Namespace Files

### App-level — `apps/VCSM/src/i18n/`

| File | Purpose |
|---|---|
| `en/nav.json` | Navigation labels, CTAs, aria-labels — all VCSM-specific |
| `es/nav.json` | Spanish stub (EN placeholders) |
| `en/auth.json` | VCSM-specific auth copy: login title/tagline, register copy, forgot copy, consent text |
| `es/auth.json` | Spanish stub (EN placeholders) |

### Engine additions — `engines/i18n/en/auth.json` + `es/auth.json`

Added generic keys shared across apps:
- `showPassword`, `hidePassword`
- `showConfirmPassword`, `hideConfirmPassword`

### setup.js merge strategy

`auth` namespace merges engine + app keys with app keys taking precedence:

```js
auth: { ...authEn, ...appAuthEn }
```

This avoids namespace collision (two separate `auth.json` files) while keeping engine generics alongside VCSM-specific copy.

---

## 3. Batch 1 — Wired Components

### BottomNavBar (`apps/VCSM/src/shared/components/BottomNavBar.jsx`)

| String | Key |
|---|---|
| "Home" | `nav.home` |
| "Explore" | `nav.explore` |
| "Vox" / "Vox (N)" | `nav.vox` / `nav.voxWithCount` |
| "Notifications" / "Notifications (N)" | `nav.notifications` / `nav.notificationsWithCount` |
| "Settings" | `nav.settings` |
| "New Upload" (aria) | `nav.newUpload` |
| "Citizen" (aria) | `nav.citizen` |
| "Primary" (nav aria) | `nav.primary` |

Dynamic badge labels use `t('nav.voxWithCount', { count })` — interpolation via `{{count}}` token.

### TopNav (`apps/VCSM/src/shared/components/TopNav.jsx`)

| String | Key |
|---|---|
| "Vibez Citizens" | `nav.vibezCitizens` |
| "The Void" | `nav.theVoid` |
| "Exit the Void" (aria + title) | `nav.exitVoid` |
| "Enter the Void" (aria + title) | `nav.enterVoid` |

### PublicNavbar (`apps/VCSM/src/shared/components/PublicNavbar.jsx`)

| String | Key |
|---|---|
| "About" link | `nav.about` |
| "VPORT" link | `nav.vport` |
| "How-To" link | `nav.howTo` |
| "Contact" link | `nav.contact` |
| "Go to app" CTA | `nav.goToApp` |
| "Log in" CTA | `nav.logIn` |
| "Get started" CTA | `nav.getStarted` |
| "Open menu" / "Close menu" (aria) | `nav.openMenu` / `nav.closeMenu` |

`NAV_LINK_ROUTES` is a static key-to-route map. The translated `NAV_LINKS` array is built inside the component where `t` is available.

### LoginScreen (`apps/VCSM/src/features/auth/screens/LoginScreen.jsx`)

| String | Key |
|---|---|
| "Vibez Citizens" (heading) | `auth.login.title` |
| "Where your vibez belongs." | `auth.login.tagline` |
| "Email" label | `auth.email` |
| "Password" label | `auth.password` |
| "Enter your password" placeholder | `auth.passwordPlaceholder` |
| "Email confirmed" / body | `auth.login.emailConfirmedTitle` / `auth.login.emailConfirmedBody` |
| "Account not found" / body | `auth.login.accountNotFoundTitle` / `auth.login.accountNotFoundBody` |
| "Logging in…" / "Login" | `auth.login.loggingIn` / `auth.login.loginButton` |
| "Forgot password?" | `auth.forgotPassword` |
| "Create account" link | `auth.createAccount` |
| "Install on iPhone" / subtitle | `auth.login.installTitle` / `auth.login.installSubtitle` |
| Bottom nav: About, Contact, Privacy, Terms | `nav.about` / `nav.contact` / `nav.privacy` / `nav.terms` |

### RegisterFormCard (`apps/VCSM/src/features/auth/components/RegisterFormCard.jsx`)

| String | Key |
|---|---|
| "Join Vibez Citizens" | `auth.register.title` |
| "Create your account to get started." | `auth.register.subtitle` |
| "Email" label | `auth.email` |
| "Password" label | `auth.password` |
| "Create a secure password" placeholder | `auth.register.passwordPlaceholder` |
| "Use at least 8 characters…" hint | `auth.register.passwordHint` |
| Show/hide password (aria) | `auth.showPassword` / `auth.hidePassword` |
| "Confirm password" label | `auth.confirmPassword` |
| "Re-enter your password" placeholder | `auth.register.confirmPasswordPlaceholder` |
| Show/hide confirm password (aria) | `auth.showConfirmPassword` / `auth.hideConfirmPassword` |
| Consent prefix | `auth.register.consentPrefix` |
| Consent "and" | `auth.register.consentAnd` |
| Consent suffix | `auth.register.consentSuffix` |
| "Terms of Service" link text | `auth.termsOfService` |
| "Privacy Policy" link text | `auth.privacyPolicy` |
| "Creating account…" / "Create account" | `auth.register.creating` / `auth.createAccount` |
| "Already have an account?" | `auth.alreadyHaveAccount` |
| "Back" button | `actions.back` |

### ForgotPasswordScreen (`apps/VCSM/src/features/auth/screens/ForgotPasswordScreen.jsx`)

| String | Key |
|---|---|
| "Forgot password" heading | `auth.forgot.title` |
| "Enter your email…" subtitle | `auth.forgot.subtitle` |
| "Email" label | `auth.email` |
| "Sending…" / "Send reset link" | `auth.forgot.sending` / `auth.forgot.sendResetLink` |
| "Back to login" (both button + link) | `auth.forgot.backToLogin` |
| "Redirecting you to login…" | `auth.forgot.redirecting` |

---

---

## 3B. Batch 2 — Settings / Account / Privacy + LocaleSwitcher mount

### New namespace

`apps/VCSM/src/i18n/en/settings.json` + `es/settings.json` — covers:
- `settings.title`, `settings.loading`, `settings.settingsSections`, `settings.language`
- `settings.tabs.*` — Privacy, Profile, Account, VPORTs
- `settings.dangerZone`
- `settings.account.*` — delete account flow (desc, modal title/body, cannot be undone)
- `settings.vport.*` — deactivate/hard-delete/restore modal titles, labels, body text, type-to-confirm
- `settings.privacy.*` — visibility labels, find citizen, blocked citizens, help text, public/private

Body text containing user-generated vport names uses split-key pattern:
`{t('settings.vport.hardDeleteBodyPre')} {vport.name} {t('settings.vport.hardDeleteBodyPost')}`
Preserves styled `<span>` wrapper on the name without collapsing i18n strings around user data.

### LocaleSwitcher mounted

Location: **Account tab** (`AccountTab.view.jsx`) — first card in both VPORT mode and Citizen mode.
Import: `@/platform/i18n/LocaleSwitcher`
Styling: `.locale-switcher` block added to `settings-modern.css` — ghost button style, active state uses purple accent.
Persistence: unchanged — `useLocale()` already handles `localStorage['vcsm.locale']` and `<html lang>`.

### Files wired — Batch 2

| File | Change |
|---|---|
| `apps/VCSM/src/i18n/en/settings.json` | CREATE — 40+ keys |
| `apps/VCSM/src/i18n/es/settings.json` | CREATE — EN placeholders |
| `apps/VCSM/src/i18n/setup.js` | settings imports added |
| `apps/VCSM/src/features/settings/styles/settings-modern.css` | `.locale-switcher` CSS block |
| `apps/VCSM/src/features/settings/screen/SettingsScreen.jsx` | title, close, tab labels, loading, aria-label; TABS → TAB_DEFS pattern |
| `apps/VCSM/src/features/settings/account/ui/AccountTab.view.jsx` | LocaleSwitcher mounted; sign out, delete account, modal strings |
| `apps/VCSM/src/features/settings/account/ui/components/AccountTabSubComponents.jsx` | VportDangerRow, SoftDeleteModal, HardDeleteModal, RestoreModal, DeleteModal, DangerLabel all wired |
| `apps/VCSM/src/features/settings/privacy/ui/PrivacyTab.view.jsx` | all visibility/lookup/blocked labels |

---

## 3C. Batch 3 — Upload card strings

### New namespace

`apps/VCSM/src/i18n/en/upload.json` + `es/upload.json` — 6 keys covering visible card strings only.

| Key | Value |
|---|---|
| `upload.addPhotosVideos` | "Add photos/videos (up to {{max}})" |
| `upload.addPhotoVideo` | "Add photo/video" |
| `upload.tapToUpload` | "Tap to upload or drag and drop" |
| `upload.selectedCount` | "Selected: {{count}} / {{max}}" |
| `upload.captionPlaceholder` | "Write a caption... (use @ to tag)" |
| `upload.addLocation` | "Add location" |

Scope note: tab labels (VIBE/24DROP/VDROP), ActorPill, spread button, location aria-labels, searching text, permission prompt, and error messages were explicitly excluded from this batch by product owner.

`addPhotosVideos` and `selectedCount` use `{{max}}` interpolation — value supplied at call site as `MAX_VIBES_PHOTOS` from `useMediaSelection`.

### Files wired — Batch 3

| File | Change |
|---|---|
| `apps/VCSM/src/i18n/en/upload.json` | CREATE — 6 keys |
| `apps/VCSM/src/i18n/es/upload.json` | CREATE — EN placeholders |
| `apps/VCSM/src/i18n/setup.js` | upload imports added to both dictionaries |
| `apps/VCSM/src/features/upload/ui/UploadCard.jsx` | addPhotosVideos, addPhotoVideo, tapToUpload, selectedCount wired |
| `apps/VCSM/src/features/upload/ui/CaptionCard.jsx` | captionPlaceholder, addLocation placeholders wired |

---

## 3D. Batch 4 — Privacy subcomponents, Profile tab, VPORTs tab

### New keys added to settings.json

`settings.privacy` additions: `public`, `private`, `noResults`, `nBlocked` ({{count}} interpolation), `noBlockedCitizens`, `block`, `unblock`, `pendingFollowRequests`

New `settings.profile` namespace: `heading`, `viewMyProfile`, `avatarBanner`, `chooseBanner`, `fileSizeHint`, `avatarPhoto`, `chooseImage`, `username`, `displayName`, `bio`, `saving`, `changesSaved`

New `settings.vports` namespace: `yourProfile`, `currentProfile`, `switchToMyProfile`, `profileTag`, `yourVports`, `createVport`, `noActiveVports`, `noVportsYet`, `current`, `switch`, `deactivatedVports`, `recover`

New `settings.businessCards` namespace: `title`, `published`, `unpublished`, `restoreBeforePublish`, `vportInactive`, `updating`, `publishing`, `publishCard`, `copied`, `copyLink`, `quickQr`, `preview`

Reused keys: `actions.search`, `actions.refresh`, `actions.remove`, `actions.accept`, `actions.decline`, `actions.delete`, `actions.unpublish`, `auth.email`, `settings.loading`

### Files wired — Batch 4

| File | Change |
|---|---|
| `apps/VCSM/src/i18n/en/settings.json` | ~30 new keys added across privacy, profile, vports, businessCards |
| `apps/VCSM/src/i18n/es/settings.json` | Spanish values for all new keys |
| `apps/VCSM/src/features/settings/privacy/ui/ProfilePrivacyToggle.jsx` | Public/Private/Loading wired |
| `apps/VCSM/src/features/settings/privacy/ui/UserLookup.jsx` | Search, Block, Unblock, No results wired |
| `apps/VCSM/src/features/settings/privacy/ui/BlockedUsersSimple.jsx` | nBlocked, Refresh, empty state, Unblock wired |
| `apps/VCSM/src/features/settings/privacy/ui/PendingFollowRequests.jsx` | section heading, Accept, Decline wired |
| `apps/VCSM/src/features/settings/profile/ui/ProfileTab.view.jsx` | all form labels, choose/remove, saving, changesSaved wired |
| `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx` | Your Profile, Current/Switch, Create VPORT, empty states, Deactivated VPORTs, Recover/Delete wired |
| `apps/VCSM/src/features/settings/vports/ui/VportsBusinessCardSection.jsx` | Business Cards, Published/Unpublished, all action buttons wired |

---

## 4. What Phase 2 Does NOT Do

- No actual Spanish translation (all ES files remain EN-value copies)
- No string extraction from feature domain screens (feed, booking, vport, social, etc.)
- No extraction from settings, profile, or notification screens
- `LocaleSwitcher` is still not mounted in any route/nav

---

## 5. Phase 2 — Remaining Batches

The following screens are not yet wired. They are candidates for future batches:

- Profile settings tab (`ProfileTab.view.jsx`, form labels)
- Vports settings tab (`VportsTab.view.jsx`, create/QR/business card modals)
- Feed/post components
- Profile/Vport screens
- Booking screens
- Notification components
- Toast/error messages

Priority order is determined by product owner.

---

## 6. Translation Keys Reference

All keys follow dot-path notation resolvable by `createTranslator`:

- `nav.*` → `apps/VCSM/src/i18n/en/nav.json`
- `auth.*` → merged `{ ...engines/i18n/en/auth.json, ...apps/VCSM/src/i18n/en/auth.json }`
- `actions.*` → `engines/i18n/en/actions.json`
- `settings.*` → `apps/VCSM/src/i18n/en/settings.json`
- `upload.*` → `apps/VCSM/src/i18n/en/upload.json`

Spanish values must be supplied directly by the product owner. No machine translation.
