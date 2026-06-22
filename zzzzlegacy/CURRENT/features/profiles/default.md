# Type Preset — Default (Global Fallback)

**Preset Name:** `VPORT_TABS`
**Applies To:** All VPORT types not covered by a type override or group preset
**Priority:** LOWEST — global fallback only
**Last Updated:** 2026-05-27

---

## Tab Order

```
1. about
2. reviews
3. content
4. vibes
5. photos
6. subscribers
(+owner — dynamically injected if isOwner)
```

---

## Preset Rationale

The default preset is the safety net for any vport type that doesn't have a more specific group or type configuration. It intentionally omits specialized tabs (`book`, `portfolio`, `rates`, `gas`, `menu`, `services`, `team`) to avoid showing irrelevant or broken surfaces for unexpected types.

It prioritizes:
- Identity (`about`) — first, always
- Social proof (`reviews`) — second
- Content presence (`content`, `vibes`, `photos`) — engagement signal
- Community (`subscribers`) — social layer

---

## Applied To (Examples)

Any vport type not matched by group or type override, including:
- `other`
- Newly registered types before group assignment
- Types with misconfigured group keys
- Emergency fallback during type resolution failure

---

## Source

`features/profiles/kinds/vport/model/getVportTabsByType.model.js`

```js
const VPORT_TABS = ['about', 'reviews', 'content', 'vibes', 'photos', 'subscribers'];
```

---

## Governance

| Command | Status | Notes |
|---|---|---|
| VENOM | NOT_STARTED | — |
| ARCHITECT | NOT_STARTED | Verify fallback resolution path |
| SENTRY | NOT_STARTED | — |
| LOGAN | PARTIAL | This doc |
