# Governance: LOKI — Runtime Observability and Request Trace

**Command:** `/Loki`  
**Authority:** Runtime observability and live request path tracing  
**Mode:** Read-only observation + trace output  
**Scope in VPORT governance:** All modules with runtime behavior concerns

---

## Responsibility

LOKI traces what actually happens at runtime for VPORT dashboard modules — not what the code says should happen, but what the runtime execution path produces.

It covers:
- Full request lifecycle trace: component render → hook call → controller dispatch → DAL query → DB response → UI state update
- Realtime subscription lifecycle (Supabase Realtime channels — subscribe, receive, unsubscribe)
- Auth session lifecycle — token refresh timing, session expiry behavior
- Unexpected re-render chains — identifying render triggers that are not intentional
- Error boundary reach — tracing what causes a module to fall to its error state
- Race conditions — identifying async paths that can interleave incorrectly

## Trace Output Format

```
LOKI TRACE — [module] — [YYYY-MM-DD]

Entry Point: [component or hook]
Trigger: [user action or lifecycle event]

Step 1: [layer] → [function:file:line] → [result]
Step 2: [layer] → [function:file:line] → [result]
...

Observed Behavior: [what actually happened]
Expected Behavior: [what should happen]
Divergence Point: [step where observed ≠ expected]
```

## Output Location

`zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/YYYY-MM-DD_loki_[module].md`

## When to Run

When a module exhibits unexpected runtime behavior that code reading alone cannot explain. After DEADPOOL identifies a root cause that requires runtime verification to confirm.

## Module Coverage

See `../vport-dashboard-governance-matrix.md` for runtime audit status per module.
