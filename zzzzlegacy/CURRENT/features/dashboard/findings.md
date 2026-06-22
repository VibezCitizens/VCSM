# VPORT Core — Findings Log

**Status:** No findings — no audit has run.

Findings will be recorded here after ARCHITECT + VENOM.

---

## Pre-Audit Architecture Questions (for ARCHITECT)

1. How does `features/vport/` relate to `features/dashboard/vport/` and `features/profiles/kinds/vport/`? Are they the same feature under different namespaces, or distinct features?
2. What does the `public/` subdirectory expose? Is this an unauthenticated read surface?
3. What does the `dal/` write — is it actor creation, VPORT creation, or profile management?
4. What does the `controller/` layer own — kind-level operations, lifecycle operations?
5. Are the `utils/` shared across features or private to vport-core?

## Pre-Audit Security Questions (for VENOM)

1. Are there public read paths in `vport/dal/` that expose sensitive VPORT data without auth?
2. Are there controller paths that write ownership or identity without kind-aware ownership guards?
3. Does the `public/` subdirectory have proper data minimization for unauthenticated viewers?
