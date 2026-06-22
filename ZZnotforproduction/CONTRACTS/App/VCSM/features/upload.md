# Feature Contract: upload

**Status:** CLEAN  
**Risk:** LOW  
**Files:** 38 (scanner 2026-06-05)  
**Inbound imports:** 15  
**Outbound imports:** 6  
**Violations:** 0  
**Split candidate:** NO

---

## 1. Purpose

`upload` owns the media upload pipeline:
- Image and file upload orchestration
- Upload progress state
- Upload error handling
- Integration with the media engine for storage

`upload` is consumed by any feature that allows users to add media (profile photos, post images, card images, portfolio items, wanders cards).

---

## 2. Non-Goals

`upload` must not own:
- Media storage or CDN — that is infrastructure
- Media access (read/fetch) — that is `media/`
- Post creation with media — that is `post/`
- Profile photo display — that is `profiles/`

---

## 3. Public API / Adapter Boundary

**Known adapter:**
- `upload/adapters/` — TODO: confirm exact adapter file

Consumers (15 inbound): profiles, post, wanders, settings, dashboard, and others.

---

## 4. Internal Layers

| Layer | Path | Notes |
|---|---|---|
| adapters | `upload/adapters/` | Primary public API |
| hooks | `upload/hooks/` | Upload progress hooks |
| controllers | `upload/controllers/` or `upload/controller/` | Upload orchestration |
| dal | `upload/dal/` | Upload record tracking |
| model | `upload/model/` | Upload state shapes |
| screens | `upload/screens/` | Upload UI (picker, progress) |
| services | `upload/services/` | TODO: confirm if upload has a services layer |

---

## 5. Allowed Dependencies

| Feature | Reason | Confirmed? |
|---|---|---|
| `media` | Upload delegates to media engine for storage | Confirmed by outbound count |
| `identity` | Active actor for upload ownership | Confirmed by outbound count |

---

## 6. Prohibited Dependencies

`upload` must not import from:
- `profiles/`, `post/`, `wanders/` — these are consumers of upload, not the reverse
- `booking/`, `social/`, `notifications/` — unrelated features
- `dashboard/` — management surface

---

## 7. DAL / Controller Rules

**DAL rules:**
- If upload tracks records (upload history, asset references), must use explicit column projections
- Must receive `actorId` as a parameter — not resolve ownership independently

**Controller rules:**
- Own the upload orchestration decision
- Must validate file type and size before delegating to media engine
- Must not return raw storage URLs — return domain-safe upload results

---

## 8. Known Coupling

**No violations.** Scanner confirms 0 violations.

---

## 9. Risk Notes

**LOW.** Clean feature with 15 consumers. The main risk is upload pipeline changes affecting all 15 consumer features.

---

## 10. Migration Notes

No pending migration. Structure is stable.

---

## 11. Unknowns

- TODO: Confirm adapter file name in `upload/adapters/`
- TODO: Identify all 15 inbound consumers
- TODO: Confirm remaining 4 outbound imports (6 total — media + identity + 4 unknown)
- TODO: Confirm whether upload uses `controllers/` or `controller/` naming
