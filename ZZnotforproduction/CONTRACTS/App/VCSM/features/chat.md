# Feature Contract: chat

**Status:** CLEAN  
**Risk:** MEDIUM  
**Files:** 66 (scanner 2026-06-05)  
**Inbound imports:** 1  
**Outbound imports:** 28  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`chat` owns the complete messaging system:
- Inbox listing (all conversations)
- Conversation view (individual message thread)
- Realtime message subscription and state management
- Conversation start flow
- Message input and composition
- Media sharing in chat

`chat` has one of the lowest inbound counts (1) despite being a 66-file feature — it is relatively self-contained and consumed by very few other features.

---

## 2. Non-Goals

`chat` must not own:
- Actor blocking (blocking affects chat access, but the block decision belongs to `block/`)
- Moderation actions — flagging a chat message routes through `moderation/`
- Media storage — media access routes through `media/`
- Identity resolution — `identity/` provides the active actor

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `apps/VCSM/src/features/chat/adapters/` — TODO: confirm exact adapter file name

The architecture review notes a `start/` folder under both `adapters/start/` and top-level `start/` — structural duplication that should be consolidated.

The 1 inbound import suggests chat is primarily a leaf feature — users navigate into chat, but other features do not embed chat components broadly.

**Engine setup:**
- `chat/setup.js` — configures the chat engine at startup. Targeted for migration to `app/setup/` via ARCH-ENGINESETUP-001.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `chat/adapters/` | Public API; includes `adapters/start/` subfolder |
| hooks | `chat/hooks/` | Inbox hooks, conversation hooks, realtime subscriptions |
| controllers | `chat/controller/` | Conversation management, message sending, start conversation |
| dal | `chat/dal/` | Message and conversation data access |
| model | `chat/model/` | Message and conversation shapes |
| components | `chat/components/` | `ChatInput.jsx` (>200 lines), `MessageBubble.jsx` (>200 lines) |
| screens | `chat/screens/` | TODO: confirm if `screen/` or `screens/` (naming inconsistency) |
| start | `chat/start/` | Conversation start flow — structural duplication with `adapters/start/` |
| setup | `chat/setup.js` | Engine DI wiring |
| store | `chat/store/` | Realtime state management |

**Note on naming:** Architecture review confirms `chat` uses `screen/` not `screens/`. ARCH-NAMING-001 will decide the canonical form.

---

## 5. Allowed Dependencies

| Feature | Reason | Import Count |
|---|---|---|
| `identity` | Resolve active actor for chat sessions | Confirmed — 8x via `@/features/identity/` |
| `moderation` | Flag chat messages | Confirmed — 4x |
| `media` | Media sharing in chat | Confirmed — 2x |
| `block` | Block guard for chat access | Confirmed — 2x |
| `social` | Social context in chat (TODO: confirm exact usage) | TODO |

**Engine alias note:** Chat also imports `@identity` (engine alias) 16x in addition to `@/features/identity/` 8x. Total identity consumption = 24 files. This mixed pattern must be standardized in ARCH-NAMING-001.

---

## 6. Prohibited Dependencies

`chat` must not import from:
- `profiles/` — profile display is not a chat concern
- `feed/`, `post/` — content features
- `dashboard/`, `settings/` — management features
- `notifications/` — chat has its own realtime system; cross-importing with notifications would create a coupling cycle

---

## 7. DAL / Controller Rules

**DAL rules:**
- May query chat-related tables (conversations, messages, participants)
- Must use explicit column projections
- Must not apply ownership logic — that is the controller's responsibility
- May receive `actorId` as a filter parameter

**Controller rules:**
- Own conversation creation — must verify both actors are valid and not blocked
- Own message sending — must check actor context before inserting
- Must not import Supabase directly
- Must call `block/adapters/` to verify block status before allowing message (or rely on RLS)

**Realtime note:** Chat uses a store for realtime state. The store must not call DAL functions directly — it should receive state updates via controller callbacks or hooks.

---

## 8. Known Coupling

**Outbound (28 imports — highest single-feature count after profiles/dashboard):**
- `identity/` (8x via feature + 16x via engine alias)
- `moderation/` (4x)
- `media/` (2x)
- `block/` (2x)
- Additional targets: TODO (28 outbound - known confirmed = remaining unknown)

**No violations.** Zero scanner violations confirmed.

**Structural issues (not violations):**
- Mixed engine alias (`@identity` vs `@/features/identity/`)
- Duplicated `start/` folder structure
- Empty `styles/` folder (ARCH-CLEAN-001)

---

## 9. Risk Notes

**MEDIUM.** Chat has the third-highest outbound import count in the codebase (28). Large components (>200 lines) create test complexity. Realtime subscriptions mean any import cycle through chat could cause subscription state bugs.

Zero violations — structurally clean, but the naming inconsistencies and structural duplication are noise that could mask future violations.

---

## 10. Migration Notes

**ARCH-CLEAN-001:** Remove empty `chat/styles/` folder.

**ARCH-ENGINESETUP-001:** Migrate `chat/setup.js` to `app/setup/chat.setup.js`.

**ARCH-NAMING-001:** Decide canonical naming for `screen/` vs `screens/`. Standardize engine alias consumption (`@identity` vs `@/features/identity/`).

---

## 11. Unknowns

- TODO: Confirm exact adapter file in `chat/adapters/`
- TODO: Identify the 1 inbound consumer of chat
- TODO: Identify remaining 14 outbound imports (28 total - 14 confirmed = 14 unknown)
- TODO: Confirm whether `chat/store/` follows the hook/controller pattern or accesses DAL directly
- TODO: Confirm whether `start/` at top-level is truly a duplicate of `adapters/start/` or a distinct layer
