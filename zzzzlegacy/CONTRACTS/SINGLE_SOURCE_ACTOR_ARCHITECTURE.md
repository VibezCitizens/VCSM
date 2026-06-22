# CONTRACT — Single-Source Actor Architecture

**Rule Name:** SINGLE_SOURCE_ACTOR_ARCHITECTURE
**Status:** ACTIVE
**Scope:** apps/VCSM (all screens, providers, hooks, stores, caches, actions)
**Source of truth:** `identityContext.identity` via `useIdentity()`

---

## Goal

Eliminate actor-switch desync by making one runtime actor source of truth and forcing every feature to derive from it, never copy it.

---

## Core Rule

At runtime, the only authoritative active actor state is:

```
identityContext.identity
```

Everything else must be derived, never independently stored.

These must NOT own actor state:
- feed viewer store
- screen-local `useState(actorId)`
- memoized actor snapshots that survive switches
- route-scoped viewer models
- local cache objects used as current truth
- debug stores treated as live state

---

## 10 Architecture Rules

### 1. Identity Provider is the only writer

Only the identity layer may commit active actor changes via `setIdentity(nextIdentity)`.

Not allowed anywhere else:
- `setViewerActor(...)`
- `setCurrentActor(...)`
- `actorRef.current = ...`
- `cachedActor = ...`

If a feature needs actor info, it must read from identity context.

### 2. Derived consumers must never persist actor identity

Every screen, provider, and hook must consume actor like this:

```javascript
const { identity } = useIdentity();
const actorId = identity?.actorId ?? null;
const actorKind = identity?.kind ?? null;
```

Not like this:

```javascript
const [actorId, setActorId] = useState(identity?.actorId);
const viewer = useMemo(() => buildViewer(identity), []);
const actorRef = useRef(identity?.actorId);
```

Because those patterns allow stale actor state to survive after a switch.

### 3. Re-key actor-scoped providers

Any provider whose data depends on actor must either:
- A. derive directly from `useIdentity()`
- B. be keyed by actorId so it fully remounts on switch

Example:
```jsx
<FeedProvider key={identity?.actorId ?? "anon"} />
```

### 4. All actor-dependent queries must include actorId

Every actor-scoped fetch/query/cache key must include actorId.

Good: `["feed", actorId]`, `["notifications", actorId]`
Bad: `["feed"]`, `["notifications"]`

If actorId is missing, stale data from the previous actor can leak into the new actor session.

### 5. Actor switch must be version-guarded

`switchActor()` must reject stale async completions.

```javascript
let switchVersion = 0;

async function switchActor(nextActorId) {
  const myVersion = ++switchVersion;
  const nextIdentity = await resolveAndHydrate(nextActorId);
  if (myVersion !== switchVersion) return;
  setIdentity(nextIdentity);
}
```

This prevents rapid A->B->C switching from leaving stale actor state.

### 6. Derived debug stores must subscribe, not own

Debug-only stores like `feed.viewer` or `global.snapshot` must be treated as mirrors.

They may sync from identity:
```javascript
useEffect(() => {
  setDebugViewer(buildViewerFromIdentity(identity));
}, [identity]);
```

They may not become a second actor authority. If debug state disagrees with identity, identity wins.

### 7. No feature-specific actor reconstruction

Features must not rebuild actor truth from:
- `auth.user`
- localStorage
- previous route data
- feed row actor
- old viewer snapshot
- session cache

These sources may enrich display, but never decide active actor. Only identity context decides active actor.

### 8. Force actor-bound cleanup on switch

When actor changes:
- clear actor-local pending requests
- invalidate actor-scoped caches
- reset feature-local viewer state
- cancel stale async tasks
- remount actor-scoped providers if needed

Minimum rule:
```javascript
useEffect(() => {
  // reset actor-bound local state here
}, [identity?.actorId]);
```

### 9. Invariant enforcement

Add a development invariant checker:

```
engineActorId === identity.actorId === globalSnapshot.identity.actorId === derivedViewer.actorId
```

If any differ, log timestamp, actor ids, source file, provider name. This catches regressions early.

Current implementation: `useActorConsistencyCheck(feature, localActorId)` wired on feed, booking, reviews, profile screens.

### 10. Permanent architectural rule

**No feature in VCSM may store "current actor" independently of IdentityProvider.**

Allowed:
- derive from `useIdentity()`
- recompute from `identity`
- mirror for debug only

Forbidden:
- local actor ownership
- duplicate actor stores
- actor snapshots that survive switches
- actor-scoped providers without actor reset/remount behavior

---

## Final Principle

**IdentityProvider owns actor truth.
Everything else derives from it.
Nothing else stores it as live state.**

---

## Enforcement

Any new code in VCSM that introduces an independent actor state store, actor ref, or actor-scoped local state that does not reset on `identity?.actorId` change is a contract violation and must be rejected in review.

## Review Check

Search for these patterns in new code and verify they derive from `useIdentity()`:
- `useState` with actorId initialization
- `useRef` holding actorId
- `useMemo` with empty deps building actor state
- Any store/context that holds `actorId` independently
- Query keys that omit actorId for actor-dependent data
