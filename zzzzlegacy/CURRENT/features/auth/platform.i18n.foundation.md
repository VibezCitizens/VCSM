# Platform i18n Foundation

Created: 2026-04-19
Codebase: `/Users/vcsm/Desktop/VCSM`
Scope: VCSM + Wentrex (Phase 0 — English-first)

---

## 1. Overview

Phase 0 establishes a shared, zero-dependency i18n foundation for VCSM and wentrex. The design is English-first: all strings are English now, but the call sites (`t('key')`) are stable enough that adding Spanish later requires only new dictionary files — no component changes.

Traffic is excluded from Phase 0. It uses Next.js 14 App Router and will require a separate integration.

---

## 2. Architecture

```
platform/i18n/
  src/
    interpolate.js          — {{param}} token replacement
    createTranslator.js     — t(key, params?) factory; dot-path lookup
    react/
      I18nProvider.jsx      — React context provider
      useTranslation.js     — useTranslation() → { t }
    index.js                — public exports
  en/
    common.json
    actions.json
    errors.json
    status.json
    state.json
    time.json
    auth.json
    notifications.json
```

Each app assembles its own dictionary:
```
apps/VCSM/src/i18n/
  setup.js                  — assembles vcsmDictionary (platform + app namespaces)
  en/
    booking.json
    vport.json
    feed.json
    social.json
    content.json

apps/wentrex/src/i18n/
  setup.js                  — assembles wentrexDictionary (platform + app namespaces)
  en/
    courses.json
    enrollments.json
    students.json
    realm.json
    gradebook.json
```

---

## 3. API

### `t(key, params?)`

Dot-path key lookup against the assembled dictionary. Returns the English string value.

```js
t('actions.save')             // → "Save"
t('errors.validation.required') // → "This field is required."
t('time.minutesAgo', { count: 5 }) // → "5m ago"
```

Missing keys return the key string in development (never throws).

### `useTranslation()`

```js
import { useTranslation } from '@i18n'

function MyComponent() {
  const { t } = useTranslation()
  return <button>{t('actions.save')}</button>
}
```

### `I18nProvider`

Wraps the root app tree. Accepts a pre-assembled `dictionary` object.

```jsx
import { I18nProvider } from '@i18n'
import { vcsmDictionary } from '@/i18n/setup'

<I18nProvider dictionary={vcsmDictionary}>
  <App />
</I18nProvider>
```

---

## 4. Aliases

Both Vite configs expose:

| Alias | Resolves to |
|-------|-------------|
| `@i18n` | `platform/i18n/src/index.js` |
| `@platform/i18n` | `platform/i18n/` (for JSON imports in setup.js) |

---

## 5. Dictionary Namespace Inventory

### Shared (platform/i18n/en/)

| File | Key examples |
|------|-------------|
| `common.json` | yes, no, none, all, optional, required, unknown |
| `actions.json` | save, cancel, delete, edit, back, next, publish, accept, clear |
| `errors.json` | generic, notFound, unauthorized, network, validation.* |
| `status.json` | active, inactive, draft, published, live, pending, confirmed, cancelled |
| `state.json` | loading, saving, deleting, submitting, searching, empty, noResults |
| `time.json` | today, yesterday, justNow, minutesAgo, hoursAgo |
| `auth.json` | login, logout, signup, email, password, signInRequired |
| `notifications.json` | notifications, bookingRequest, bookingConfirmed, reviewReceived |

### VCSM app (apps/VCSM/src/i18n/en/)

| File | Key examples |
|------|-------------|
| `booking.json` | selectedDay, noOpenSlots, requestSlot, createHold, clearSelectedDay, accept |
| `vport.json` | dashboard, manageMenu, services, subscribe, qrCode |
| `feed.json` | feed, noPostsYet, loadMore, post, comment |
| `social.json` | follow, unfollow, followers, following, rose, block |
| `content.json` | contentPages, newPage, guide, faq, emergency, tips, educational |

### Wentrex app (apps/wentrex/src/i18n/en/)

| File | Key examples |
|------|-------------|
| `courses.json` | courses, createCourse, enrollNow, continueLearning |
| `enrollments.json` | enrolled, enroll, noEnrollments, enrollmentApproved |
| `students.json` | students, addStudent, gradeReport |
| `realm.json` | realm, realmSettings, members, admins |
| `gradebook.json` | gradebook, submitGrade, passing, failing, average |

---

## 6. Root Wiring

**VCSM (`apps/VCSM/src/main.jsx`):**
```jsx
import { I18nProvider } from '@i18n'
import { vcsmDictionary } from '@/i18n/setup'

// Inside render:
<BrowserRouter>
  <I18nProvider dictionary={vcsmDictionary}>
    <AuthProvider>
      <IdentityProvider>
        <App />
      </IdentityProvider>
    </AuthProvider>
  </I18nProvider>
</BrowserRouter>
```

**Wentrex (`apps/wentrex/src/main.jsx`):**
```jsx
import { I18nProvider } from '@i18n'
import { wentrexDictionary } from '@/i18n/setup'

// Inside render:
<BrowserRouter>
  <I18nProvider dictionary={wentrexDictionary}>
    <App />
  </I18nProvider>
</BrowserRouter>
```

---

## 7. Proof-of-Pattern Migration

**Component:** `apps/VCSM/src/features/profiles/kinds/vport/screens/booking/components/BookingCalendarDayPanel.jsx`

All hardcoded strings replaced with `t()` calls using `booking.*` and `actions.*` namespaces. The component imports `useTranslation` from `@i18n` and calls `const { t } = useTranslation()` at the top of the render function. `OwnerCustomerPicker` receives `t` as a prop.

Keys used: `booking.selectedDay`, `booking.appointments`, `booking.noOpenSlots`, `booking.ownerModeHint`, `booking.citizenSwitchHint`, `booking.createHold`, `booking.requestSlot`, `booking.markSlotUnavailable`, `booking.restoreSlot`, `booking.clearSelectedDay`, `booking.noAppointmentsForDate`, `booking.accept`, `booking.searchFollowerPlaceholder`, `booking.searchingFollowers`, `booking.noFollowerMatch`, `booking.followersError`, `actions.cancel`, `actions.clear`

---

## 8. Adding Spanish Later

1. Create `platform/i18n/es/` with the same filenames
2. Create `apps/VCSM/src/i18n/es/` with app-specific overrides
3. Update `setup.js` to accept a `locale` param and pick the right dictionary set
4. Pass selected locale into `I18nProvider`

No component changes required.

---

## 9. Constraints

- Traffic is excluded from Phase 0 (Next.js App Router requires separate handling)
- Components must not import raw dictionary JSON directly — always use `useTranslation()`
- Do not implement Spanish in Phase 0
- The `t()` function never throws — missing keys return the key string in dev

---

## 10. Change Log

### 2026-04-19
- Phase 0 implemented: shared platform package, 8 shared English dictionaries, VCSM + wentrex app setup, both Vite aliases, both root providers wired, BookingCalendarDayPanel.jsx proof-of-pattern migration complete

### 2026-04-20
- VCSM i18n audit + dictionary prep delivered under `apps/VCSM/src/i18n/`:
  - `i18n-audit-report.md`
  - `en.json`
  - `es.json`
- Performed dictionary cleanup pass on `en.json` and `es.json` to enforce product lexicon terms and keep them untranslated in Spanish.

#### 2026-04-20 Product Lexicon Lock (Do Not Translate)

| Legacy term | Locked product term |
|-------------|---------------------|
| User | Citizen |
| Business Page / Bussines Page | Vport |
| Group / Community | District |
| Post | Vibe |
| Comment | Spark |
| Message | Vox |
| Conversation | Vox/Thread |
| Main Feed | Citizen central |

Notes:
- Applied to singular and plural variants where present.
- Applied across both English and Spanish dictionaries.
- Legacy source terms were removed from dictionary values for the mapped concepts.
