# React Query Server-State Rule

> **Source Contract:** [ARCHITECTURE_GOVERNANCE_CONTRACT.md](../ARCHITECTURE_GOVERNANCE_CONTRACT.md)
> **Section:** React Query Server-State Rule

---

## Rule

React Query is the standard server-state manager.

---

## Required Uses

Use React Query for:

- database reads
- RPC reads
- mutation lifecycle
- cache invalidation
- loading/error/retry state
- server-derived lists and detail views

---

## Forbidden Pattern

Do not introduce new manual server-fetch patterns:

```js
// FORBIDDEN — introduces new manual server state
const [data, setData] = useState(null)
useEffect(() => {
  fetchData().then(setData)
}, [])
```

Use `useQuery` or `useMutation` from React Query instead.

---

## Migration Rule

Existing manual patterns must be migrated progressively.

Do not add new ones. Migrate old ones opportunistically during feature work.

---

## Violation Level

| Condition | Level |
|---|---|
| New manual useState + useEffect server-fetch pattern introduced | MEDIUM |
