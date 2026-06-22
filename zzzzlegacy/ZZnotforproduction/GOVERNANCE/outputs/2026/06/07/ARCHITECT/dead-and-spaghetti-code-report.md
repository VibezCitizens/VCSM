# DEAD AND SPAGHETTI CODE REPORT
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0
Application Scope: ALL APPS + ENGINE

---

## CODE HEALTH METRICS

| Feature | Total Nodes | Layers | Cross-Feature Imports | Dead Code Signals | Spaghetti Score |
|---|---:|---:|---:|---:|---|
| VCSM:profiles | 671 | 7 | 0 | LOW | WATCH |
| VCSM:vportDashboard | 435 | 6 | 0 | LOW | WATCH |
| VCSM:learning (FROZEN) | 393 | 7 | 0 | MEDIUM | TANGLED |
| VCSM:dev | 358 | 3 | 2 | HIGH | WATCH |
| VCSM:wanders (FROZEN) | 240 | 6 | 0 | MEDIUM | WATCH |
| VCSM:settings | 196 | 7 | 0 | LOW | CLEAN |
| VCSM:post | 178 | 6 | 0 | LOW | CLEAN |
| VCSM:booking | 142 | 5 | 0 | LOW | CLEAN |
| VCSM:chat | 131 | 5 | 0 | LOW | WATCH |
| VCSM:auth | 126 | 6 | 0 | LOW | CLEAN |
| VCSM:wanderex (FROZEN) | 85 | 5 | 0 | MEDIUM | WATCH |
| VCSM:debuggers-stub | 104 | 2 | 0 | HIGH | WATCH |

---

## DEAD CODE FINDINGS

### DEAD CODE FINDING 1 — VCSM:dev
Location: apps/VCSM/src/features/dev/  
Code Type: Feature  
Classification: LIKELY DEAD (production build)  
Evidence: 358 callgraph nodes; feature=dev; should be excluded from production bundle  
Risk: Dev tooling code shipping to production if not tree-shaken  
Recommended action: VERIFY USAGE — confirm excluded from production bundle via build analysis  
Recommended handoff: LOKI

### DEAD CODE FINDING 2 — VCSM:debuggers-stub
Location: apps/VCSM/src/features/ (debuggers-stub)  
Code Type: Feature stub  
Classification: LIKELY DEAD (production build)  
Evidence: 104 callgraph nodes; all module layer — no controllers, no DAL  
Risk: Debug panels shipping to production  
Recommended action: VERIFY USAGE — confirm excluded from production bundle  
Recommended handoff: LOKI

### DEAD CODE FINDING 3 — VCSM:learning (FROZEN)
Location: apps/VCSM/src/features/learning/  
Code Type: Feature module  
Classification: POSSIBLY LEGACY  
Evidence: 393 callgraph nodes; governance freeze active; feature development paused  
Risk: Stale code may have security or architecture drift  
Recommended action: MARK LEGACY — document freeze; exclude from security scope unless reactivated  
Recommended handoff: LOGAN

### DEAD CODE FINDING 4 — VCSM:wanders, wanderex, vgrid (FROZEN)
Location: apps/VCSM/src/features/wanders/, wanderex/, vgrid/  
Code Type: Feature modules  
Classification: POSSIBLY LEGACY  
Evidence: 240 + 85 + 0 callgraph nodes; governance freeze active  
Risk: Frozen features may have unpatched vulnerabilities  
Recommended action: MARK LEGACY — explicitly exclude from security audits  
Recommended handoff: LOGAN

---

## SPAGHETTI CODE FINDINGS

### SPAGHETTI CODE FINDING 1 — VCSM:chat thin backend
Location: apps/VCSM/src/features/chat/  
Pattern: Thin feature with engine dependency  
Classification: LOW  
Evidence: 3 controllers, 2 dals in VCSM:chat vs 255 nodes in engine:chat  
Architectural risk: If engine:chat is not properly abstracted, chat feature may bypass engine boundaries  
Suggested untangling direction: Verify engine:chat API contract is the only entry point from VCSM:chat  
Recommended handoff: SENTRY

### SPAGHETTI CODE FINDING 2 — VCSM:vport thin controller layer
Location: apps/VCSM/src/features/vport/  
Pattern: High module count (45), low controller count (2)  
Classification: LOW  
Evidence: 100 total nodes, 45 module layer, 2 controllers  
Architectural risk: Business logic may be in module layer (no responsibility boundary)  
Suggested untangling direction: Review module layer for hidden controller behavior  
Recommended handoff: SENTRY

### SPAGHETTI CODE FINDING 3 — Unclassified write surfaces
Location: VCSM write-surface-map, feature=null  
Pattern: 111/290 VCSM write surfaces have no feature owner  
Classification: MODERATE  
Evidence: Scanner could not attribute 111 write surfaces to a named feature  
Architectural risk: Unowned write surfaces cannot be assigned security responsibility  
Suggested untangling direction: IRONMAN ownership assignment pass  
Recommended handoff: IRONMAN

---

## DUPLICATE IMPLEMENTATION FINDINGS

None detected by static analysis. No duplicate DAL or controller implementations found across features.

---

## FINAL CODE HEALTH STATUS: WATCH

Primary concerns:
- Frozen features (learning, wanders, wanderex, vgrid) — not cleaned up
- Dev-only features (dev, debuggers-stub) — prod bundle exclusion unverified
- 111 unclassified write surfaces — ownership gap
- VCSM:chat thin backend pattern — engine boundary needs SENTRY verification
