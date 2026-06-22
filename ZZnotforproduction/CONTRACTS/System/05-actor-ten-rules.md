# Actor Architecture Rules — The Ten Rules
## Single-Source Actor Architecture Contract — 10 Architecture Rules (Locked)

> **Source:** [../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md](../SINGLE_SOURCE_ACTOR_ARCHITECTURE.md)
> **Status:** ACTIVE
> **Scope:** apps/VCSM (all screens, providers, hooks, stores, caches, actions)
> **Index:** [INDEX.md](INDEX.md)
> **Reads After:** [04-actor-core-rule.md](04-actor-core-rule.md)
> **Reads Before:** [06-actor-enforcement.md](06-actor-enforcement.md)

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
