# ARCHITECT DATABASE READ MAP
Generated: 2026-06-05T00:00:00Z
Scope: VCSM dashboard modules 7–16

---

## Dashboard Module Read DALs

### vport (root) — Read DALs
| DAL File | Table | Schema | Auth Guard |
|---|---|---|---|
| actorOwners.read.dal.js | actor_owners | vc | None at DAL level |
| actorVport.read.dal.js | actors, vport profiles | vc/vport | None at DAL level |
| listVportBookingsForProfileDay.read.dal.js | bookings | vport | profile_id filter |
| vportAvailabilityRules.read.dal.js | availability_rules | vport | profile_id filter |
| vportBookingById.read.dal.js | bookings | vport | id lookup |
| vportBookingsInRange.read.dal.js | bookings | vport | resource_id + range filter |
| vportCities.read.dal.js | cities | public | Public read |
| vportProfile.read.dal.js | actors / vport profiles | vc/vport | id lookup |
| vportProfileActorAccess.read.dal.js | actor_owners | vc | actor_id filter |
| vportResource.read.dal.js | resources | vport | profile_id filter |
| vportServices.read.dal.js | services/vport_services | vport | profile_id filter |

### gasprices — Read DALs
| DAL File | Table | Schema | Auth Guard |
|---|---|---|---|
| vportFuelPricePost.read.dal.js | posts / fuel_prices | vport | profile_id filter |
| vportFuelPriceSubmissions.read.dal.js | fuel_price_submissions | vport | profile_id filter |
| vportFuelPrices.read.dal.js | fuel_prices | vport | profile_id / actor_id filter |
| vportStationPriceSettings.read.dal.js | station_price_settings | vport | profile_id filter |

### flyerBuilder — Read DALs
| DAL File | Table | Schema | Auth Guard |
|---|---|---|---|
| designStudio.auth.dal.js | supabase.auth | auth | session-level |
| designStudio.read.dal.js | design_documents, actor_owners | vport/vc | actor_id filter |

## N+1 Risk Assessment
- schedule/loadDaySchedule.controller.js calls listVportBookingsForProfileDay + vportResource: risk LOW (per-day scoped)
- gasprices multi-DAL pattern (prices + submissions + history): parallel fetches, no N+1 detected
- bookings calendar view: single DAL call per date range — LOW risk

## Duplicate Read Detection
- bookings table read in vport/dal/read/vportBookingById + vportBookingsInRange + listVportBookingsForProfileDay: distinct query shapes, not duplicates
- profile_public_details: read by flyerBuilder (flyer.write.dal upsert) and settings DAL — same table, different operations
