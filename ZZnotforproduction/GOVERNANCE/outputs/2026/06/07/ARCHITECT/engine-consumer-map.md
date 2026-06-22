# ARCHITECT ENGINE CONSUMER MAP
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Engine Inventory

| Engine | Root | Status | Callgraph Nodes |
|---|---|---|---|
| engine:booking | engines/booking | ACTIVE | 221 |
| engine:chat | engines/chat | ACTIVE | 255 |
| engine:hydration | engines/hydration | ACTIVE | — |
| engine:i18n | engines/i18n | ACTIVE | — |
| engine:identity | engines/identity | ACTIVE | 74 |
| engine:media | engines/media | ACTIVE | — |
| engine:notifications | engines/notifications | ACTIVE | 102 |
| engine:portfolio | engines/portfolio | ACTIVE | — |
| engine:reviews | engines/reviews | ACTIVE | — |

---

## Engine Consumers (from scanner dependency-map + engine-candidates)

### engine:booking
Consumers: VCSM:booking, VCSM:notifications, VCSM:dev, VCSM:join, VCSM:portfolio, VCSM:profiles, VCSM:settings, VCSM:vport, VCSM:vportDashboard, VCSM:wanderex, wentrex (via engine:booking consumer list)

### engine:chat
Consumers: VCSM:app, VCSM:bootstrap, VCSM:chat, VCSM:dev, VCSM:main.jsx, VCSM:profiles, engine:chat (self), wentrex:communication, wentrex:identity

### engine:hydration
Consumers: VCSM:block, VCSM:booking, VCSM:chat, VCSM:explore, VCSM:feed, VCSM:hydration, VCSM:identity, VCSM:main.jsx, VCSM:notifications, VCSM:post, VCSM:profiles, VCSM:settings, VCSM:state, VCSM:vportDashboard

### engine:identity
Consumers: VCSM:ads, VCSM:app, VCSM:auth, VCSM:block, VCSM:chat, VCSM:explore, VCSM:feed, VCSM:flyerBuilder, VCSM:identity, VCSM:initiation, VCSM:invite, VCSM:join, VCSM:learning, VCSM:main.jsx, VCSM:notifications, VCSM:post, VCSM:professional, VCSM:profiles, VCSM:settings, VCSM:shared, VCSM:shell, VCSM:social, VCSM:state, VCSM:upload, VCSM:vport, VCSM:vportDashboard, wentrex:App.jsx, wentrex:auth, wentrex:communication, wentrex:identity, wentrex:learning, wentrex:main.jsx

**Note: engine:identity is consumed by the broadest surface in the platform — 30+ features.**

### engine:i18n
Consumers: Traffic:components, Traffic:home, Traffic:i18n, Traffic:lib, Traffic:providers, Traffic:reviews, Traffic:shared, VCSM:i18n, VCSM:main.jsx, VCSM:platform, wentrex:i18n, wentrex:main.jsx

### engine:media
Consumers: VCSM:app, VCSM:chat, VCSM:flyerBuilder, VCSM:profiles, VCSM:public, VCSM:shared

### engine:notifications
Consumers: VCSM:app, VCSM:booking, VCSM:bootstrap, VCSM:chat, VCSM:dev, VCSM:flyerBuilder, VCSM:media, VCSM:notifications, VCSM:post, VCSM:professional, VCSM:profiles, VCSM:public, VCSM:settings, VCSM:social, VCSM:upload, VCSM:vport, VCSM:vportDashboard, VCSM:wanders, engine:notifications

### engine:portfolio
Consumers: VCSM:chat, VCSM:feed, VCSM:flyerBuilder, VCSM:main.jsx, VCSM:media, VCSM:profiles, VCSM:settings, VCSM:upload, VCSM:vport, VCSM:vportDashboard, VCSM:wanders

### engine:reviews
Consumers: Traffic:data, Traffic:providers, Traffic:reviews, VCSM:chat, VCSM:dev, VCSM:main.jsx, VCSM:notifications, VCSM:profiles, VCSM:public, VCSM:reviews, VCSM:vportDashboard, VCSM:wanders

---

## Engines with No Confirmed App Consumer

All engines appear to have active consumers. No orphaned engines detected.

---

## Engine Architecture Risks

| Risk | Engine | Severity | Notes |
|---|---|---|---|
| Broadest identity surface | engine:identity | HIGH | 30+ consumers; every auth-sensitive path depends on it |
| Dev-only engine consumption | VCSM:dev | MEDIUM | Dev feature consumes notifications+reviews engines |
| Wentrex consumes VCSM engines | wentrex:identity | MEDIUM | wentrex:identity, wentrex:communication consume engine:identity, engine:chat — must remain engine-layer only |
