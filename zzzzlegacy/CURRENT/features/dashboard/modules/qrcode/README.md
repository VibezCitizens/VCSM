# Module: QR Code

**VPORT Kinds:** ALL
**Public/Owner:** OWNER (generation) + PUBLIC (QR link consumption)
**Route/Surface:** DASHBOARD — owner QR code generation and management
**Source:** `apps/VCSM/src/features/dashboard/qrcode/`
**Governance status:** NOT_STARTED
**Last audit:** —

---

## What This Module Does

Dashboard QR code generation tool. Allows VPORT owners to generate QR codes linking to their profile or specific features. Has adapters, components (including a flyer subcomponent), and is related to the flyerBuilder feature's printableQr component.

Subdirectories: `adapters/`, `components/flyer/`

## Why This Folder Exists

QR codes encode VPORT identity data as navigable links. Key question: are the QR payloads using human-readable slugs or raw internal UUIDs? Platform rule: raw UUIDs must never appear in public URLs or shared content. No security audit has run. The flyer subcomponent may pass internal IDs into generated output.

## Next Command

VENOM