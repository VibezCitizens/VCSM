---
title: Business Card Module — Architecture
status: STUB
feature: public
module: business-card
source: venom+bw-derived
created: 2026-06-05
---

# public / modules / business-card — ARCHITECTURE

## Read Path

```
VportBusinessCardPublic.screen
  └── useVportBusinessCardExperience → vportBusinessCard.controller
        └── businessCardSections.read.dal + vportBusinessCard.read.dal
              └── vc.* SELECT (anonymous, slug-resolved, no actor_id from caller)
```

## Lead Write Path

```
BusinessCardLeadForm → useVportBusinessCardLeadForm
  └── vportBusinessCardLead.write.dal → SECURITY DEFINER RPC
        ├── p_ip = hardcoded null ← BW-PUBLIC-007
        ├── navigator.userAgent stored with PII ← VEN-PUBLIC-002
        └── no idempotency token, no rate limit ← BW-PUBLIC-007 BYPASSED
```

## Email Dispatch

```
vportBusinessCardLead.write.dal → sendLeadConfirmationEmail.edge.dal
  └── Edge Function: send-lead-confirmation
        └── Authorization: Bearer <ANON_KEY> ← VEN-PUBLIC-001 / BW-PUBLIC-005
              └── anon key is public in frontend bundle; no rate limiting
```

## Owner Notification linkPath

```
lead notification → /actor/<actorId UUID>/dashboard/leads ← BW-PUBLIC-010
                                     ↑ raw UUID in notification record
```

## Phone Validation Gap

```
toSafePhone() → permits '+', ',', '.' as valid ← BW-PUBLIC-015
  └── single-char phone passes contact validation
```

## TODO

- [ ] Confirm SECURITY DEFINER RPC for lead INSERT enforces rate limit
- [ ] Confirm edge function accepts only service_role key or has other auth
