# Restaurant Vport Profile + Dashboard Spec

## 1. Purpose

The restaurant vport is a food and hospitality profile for restaurants, cafes, bakeries, caterers, and food vendors. Users visit to browse the menu, see food photos, check hours, and read dish-focused reviews. The menu is the centerpiece — everything else supports the decision to eat here.

## 2. Public Profile Goal

Help a visitor decide whether to eat here. Within 10 seconds of landing, the visitor should know:
- What kind of food this place serves
- What the menu looks like (items, prices, photos)
- Whether it's open now
- What other customers think about the food

## 3. Core Identity Block

- **Display name:** Restaurant name (e.g., "La Cocina del Sol", "Mike's Burgers")
- **Username / handle:** `@lacocina` — used in URLs, mentions, shares
- **Avatar / logo:** Square with `rounded-2xl`. Typically the restaurant logo or signature dish. Must never be circular.
- **Banner:** Hero food shot, restaurant interior, or branded graphic. Gradient fallback if none set.
- **Headline / short descriptor:** Vport type label ("Restaurant") shown below display name. Optionally: cuisine type.
- **Location summary:** City + neighborhood. Critical for dine-in discovery.
- **Contact / action buttons:**
  - Visitor: Message + Subscribe
  - Owner: QR code sharing
  - Menu link / order CTA should be prominent

## 4. Public Tabs

| Tab | Required | Purpose |
|-----|----------|---------|
| **Menu** | Yes | Full menu with categories, items, prices, photos. This is the landing tab. |
| **Portfolio** | Yes | Food photography, plating, atmosphere shots. Visual showcase. |
| **Reviews** | Yes | Customer reviews with food-focused dimensions (Food Quality, Service, Cleanliness, Value). |
| **About** | Yes | Hours, location, cuisine type, dine-in/takeout signals, contact. |
| **Services** | Optional | Catering, private events, delivery, special dietary accommodations. |
| **Photos** | Optional | All media posts (broader than portfolio). |
| **Vibes** | Optional | Social feed posts (specials, events, announcements). |
| **Subscribers** | Optional | Public subscriber list. |

**Tab order:** Menu → Portfolio → Reviews → About → Services → Photos → Vibes → Subscribers

## 5. Main Content Modules

### Menu
- Category-based organization (Appetizers, Mains, Desserts, Drinks, etc.)
- Each item: name, description, price, photo (optional)
- Dietary markers (vegetarian, vegan, gluten-free, halal, kosher)
- Specials / featured items section
- Empty state: "Menu is being prepared"
- Fetched via `readVportPublicMenu.rpc.dal.js`

### Portfolio
- Food photography grid — plating, atmosphere, ingredients
- Best dishes showcased
- No transformation detection needed (unlike barber)
- Tag filtering by dish type or category
- Related services section (catering tied to portfolio items)

### Reviews
- Dimension ratings: Food Quality (1.50 weight), Service (1.20), Cleanliness (1.00), Value (1.00)
- Food Quality is the dominant signal
- Dish-specific comments are highest value
- Overall average prominently displayed

### About
- Business hours with timezone
- Location with address and map link
- Cuisine type / categories
- Dine-in / takeout / delivery signals
- Seating capacity (optional)
- Reservation info
- Languages spoken
- Payment methods
- Contact: phone, email, website, booking URL

### Services (Optional)
- Catering packages with pricing
- Private event hosting
- Delivery services
- Special dietary accommodations
- Meal prep / subscription offers

## 6. Reviews Behavior

**What customers care about most:**
- Was the food good? (taste, freshness, portion size)
- Was the service attentive and friendly?
- Was the place clean?
- Was it worth the price?

**Dimension weights (from DB seed):**
| Dimension | Weight | Sort |
|-----------|--------|------|
| Food Quality | 1.50 | 10 |
| Service | 1.20 | 20 |
| Cleanliness | 1.00 | 30 |
| Value | 1.00 | 40 |

**Display priorities:**
- Food Quality dimension is most important — show it prominently
- Recent comments about specific dishes are high value
- Photo reviews (future) would add significant trust
- Overall average shown with star visualization

**History:** Card rotation after 24h. Multiple visits = multiple review cards over time, building a history of experiences.

**Trust:** For restaurants, volume matters. 50 reviews at 4.2 is more credible than 3 reviews at 5.0. Show review count prominently.

## 7. Dashboard Goal

Help the restaurant owner manage their menu, track food quality feedback, update hours and specials, and showcase their best dishes. Menu management must be intuitive — it's the most frequently edited surface.

## 8. Dashboard Sections

### Menu Manager
- **Purpose:** Create and maintain the full menu
- **Key actions:** Add/edit/remove items, set prices, organize categories, mark specials, upload dish photos
- **Key metrics:** Total items, categories, items with photos vs without
- **Key editing surfaces:** Category editor, item form (name, description, price, photo, dietary tags)
- **Feed share:** When the owner saves a menu item or category (add or edit), an optional "Share this update to my feed" checkbox is available. If checked, a post with `post_type = menu_update` is published to the public feed with the action, subject type, item/category name, and dish photo (if the item has one). The post is non-blocking (failure does not affect the menu save). A 1-hour dedup window prevents repeat posts per VPORT actor. Implemented via `publishMenuUpdateAsPost.controller.js` → `createSystemPost` adapter → `resolvePublicRealmIdDAL` (canonical public realm, never viewer session realm).

### Reviews Dashboard
- **Purpose:** Monitor food quality and service feedback
- **Key actions:** View reviews with dimension filters (Food Quality, Service, etc.)
- **Key metrics:** Overall average, food quality average, review count, trend
- **Key editing surfaces:** None (reviews are customer-owned)

### Portfolio Manager
- **Purpose:** Curate food photography showcase
- **Key actions:** Post dish photos, tag by category
- **Key metrics:** Portfolio item count
- **Key editing surfaces:** Post creation flow

### Services Editor
- **Purpose:** Manage catering and event offerings
- **Key actions:** Add/edit catering packages, set pricing
- **Key metrics:** Service count
- **Key editing surfaces:** Service list with details

### Profile Settings
- **Purpose:** Update business information
- **Key actions:** Edit hours, location, cuisine tags, dine-in/takeout flags, contact
- **Key metrics:** Profile completeness
- **Key editing surfaces:** About fields, hours schedule, dietary accommodation flags

## 9. Type-Specific Data Model Needs

Beyond the shared vport model, restaurant needs:
- **Menu system:** Categories, items, prices, descriptions, photos, dietary tags, specials flag — fetched via `readVportPublicMenu` RPC
- **Cuisine metadata:** Cuisine type, dietary accommodations, dining style (casual, fine dining, fast food)
- **Review dimensions:** `reviews.review_dimensions` with food-specific keys (food_quality, service, cleanliness, value)
- **Dining signals:** Dine-in, takeout, delivery, reservations — stored in `vc.vport_public_details`
- **Specials / promotions:** Featured items, daily specials, happy hour (future)

## 10. Shared vs Dedicated Logic

### Shared with all Vports
- Actor identity system
- Profile header (banner, avatar, name, bio, subscriber count)
- Privacy gating and block detection
- Reviews engine
- Photos and Vibes tabs
- Subscribers tab
- About tab structure
- Owner tab

### Dedicated to Restaurant
- Menu tab with category-based item display (unique to food vports)
- Menu manager dashboard (CRUD for categories and items)
- Food-specific review dimensions (food_quality, service, cleanliness, value)
- Cuisine type and dietary metadata
- Dine-in/takeout/delivery signals
- No booking tab (reservations handled via external link or future feature)
- Portfolio focused on food photography (no transformation detection)

## 11. UX Priorities

1. **Menu as landing tab** — the menu is why people come. Must be scannable and appetizing.
2. **Food photography prominence** — high-quality dish photos in menu items and portfolio
3. **Hours and availability** — "Are they open now?" must be answerable instantly
4. **Review quality signals** — Food Quality dimension is the most trusted indicator
5. **Mobile-first menu** — most restaurant discovery happens on phone
6. **Category navigation** — long menus need quick category jumping

## 12. Future Expansion

- **Online ordering:** In-app order placement with cart and checkout
- **Reservation system:** Table booking with party size and time selection
- **Daily specials:** Rotating specials with automatic expiry
- **Photo reviews:** Customers attach dish photos to reviews
- **Dish-level ratings:** Rate individual menu items, not just the restaurant
- **Allergen filtering:** Filter menu by allergens (nuts, dairy, gluten)
- **QR menu:** Scannable QR code that opens the menu directly
- **Meal bundles:** Combo deals and family packs
