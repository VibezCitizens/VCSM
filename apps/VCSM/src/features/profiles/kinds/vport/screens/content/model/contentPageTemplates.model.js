// Template definitions for the VPORT content page create flow.
// getTemplatesForVportType(vportType) returns type-aware templates first,
// followed by universal templates every vport can use.

const UNIVERSAL_TEMPLATES = [
  {
    key: "about-us",
    label: "About Us",
    category: "guide",
    suggestedTitle: "About Us",
    suggestedSummary: "Learn about who we are, what we do, and why we do it.",
    suggestedContent:
      "Welcome! We're glad you're here.\n\nWe started with a simple idea: [describe your origin story or mission].\n\nToday, we serve [describe your customers or community] with [describe what you offer].\n\nOur values guide everything we do:\n- [Value 1]\n- [Value 2]\n- [Value 3]\n\nWe'd love to hear from you. [Add contact info or CTA].",
  },
  {
    key: "faq",
    label: "FAQ",
    category: "faq",
    suggestedTitle: "Frequently Asked Questions",
    suggestedSummary: "Answers to the questions we hear most often.",
    suggestedContent:
      "**Q: [Question 1]**\nA: [Answer 1]\n\n**Q: [Question 2]**\nA: [Answer 2]\n\n**Q: [Question 3]**\nA: [Answer 3]\n\n**Q: How do I get started?**\nA: [Explain your onboarding or first steps].\n\nStill have questions? Reach out — we're happy to help.",
  },
  {
    key: "tips-for-customers",
    label: "Tips for Customers",
    category: "tips",
    suggestedTitle: "Tips for Getting the Most Out of Us",
    suggestedSummary: "Helpful tips to make your experience smoother.",
    suggestedContent:
      "We want every visit to go smoothly. Here are a few tips:\n\n1. **Book in advance** — [Explain any lead time or availability notes].\n2. **Come prepared** — [What should a customer bring or know ahead of time].\n3. **Ask questions** — [Encourage customers to ask what they need].\n4. **Check our hours** — [Where to find current hours or seasonal changes].\n\nThank you for choosing us!",
  },
  {
    key: "why-choose-us",
    label: "Why Choose Us",
    category: "guide",
    suggestedTitle: "Why Choose Us",
    suggestedSummary: "What sets us apart and why customers keep coming back.",
    suggestedContent:
      "There are a lot of options out there. Here's what makes us different:\n\n**[Differentiator 1]**\n[Expand on this point.]\n\n**[Differentiator 2]**\n[Expand on this point.]\n\n**[Differentiator 3]**\n[Expand on this point.]\n\nWe're proud of the trust our customers place in us. [Add a customer quote or stat if you have one].",
  },
];

const TEMPLATES_BY_TYPE = {
  barber: [
    {
      key: "barber-services",
      label: "Service Guide",
      category: "guide",
      suggestedTitle: "Our Services",
      suggestedSummary: "A full look at what we offer — cuts, styles, and more.",
      suggestedContent:
        "Here's what we offer at our shop:\n\n**Haircuts**\n[Describe your cut styles — fades, tapers, classic cuts, etc.]\n\n**Beard Services**\n[Trims, lineups, hot towel shaves, etc.]\n\n**Specialty Services**\n[Kid's cuts, design work, color, etc.]\n\nPricing starts at $[X]. Book your appointment or walk in — we'd love to have you.",
    },
    {
      key: "barber-booking-tips",
      label: "Booking Tips",
      category: "tips",
      suggestedTitle: "How to Book Your Appointment",
      suggestedSummary: "Everything you need to know before your visit.",
      suggestedContent:
        "Getting in the chair is easy. Here's how it works:\n\n1. **Book ahead** — Walk-ins are welcome, but booking ensures your spot.\n2. **Arrive on time** — We'll do our best to stay on schedule for everyone.\n3. **Bring a reference photo** — Not sure what style you want? A photo helps.\n4. **Let us know your preferences** — We'll tailor the experience to you.\n\nSee you soon!",
    },
  ],
  restaurant: [
    {
      key: "restaurant-menu-guide",
      label: "Menu Guide",
      category: "guide",
      suggestedTitle: "About Our Menu",
      suggestedSummary: "The story behind our food and what to expect.",
      suggestedContent:
        "Our menu is built around [describe your cuisine, region, or philosophy].\n\n**Our Signature Dishes**\n[Describe 2-3 standout items.]\n\n**Dietary Options**\nWe offer options for [vegetarian, vegan, gluten-free, etc.]. Ask your server for details.\n\n**Seasonal Specials**\nWe rotate specials based on what's fresh and in season. Check back often or ask about today's offerings.\n\nWe source [locally / from specific farms / etc.] whenever possible.",
    },
    {
      key: "restaurant-dining-tips",
      label: "Dining Tips",
      category: "tips",
      suggestedTitle: "Tips for Your Visit",
      suggestedSummary: "Make the most of your dining experience with us.",
      suggestedContent:
        "We want your visit to be great. A few things to know:\n\n1. **Reservations** — We recommend booking ahead for [weekends / dinner service / large groups].\n2. **Parking** — [Describe parking situation or nearby options].\n3. **Dietary needs** — Let us know in advance and we'll do our best to accommodate.\n4. **Group dining** — We can host parties of [X] or more. Contact us to plan.\n\nWe can't wait to see you at the table.",
    },
  ],
  gas: [
    {
      key: "gas-services",
      label: "Services & Amenities",
      category: "guide",
      suggestedTitle: "What We Offer",
      suggestedSummary: "Fuel, convenience, and services — all in one stop.",
      suggestedContent:
        "We're more than a gas station. Here's what you'll find at our location:\n\n**Fuel**\n[Regular, Plus, Premium, Diesel — list what's available.]\n\n**Convenience Store**\n[Snacks, drinks, hot food, lottery, etc.]\n\n**Additional Services**\n[Car wash, air pumps, ATM, propane exchange, etc.]\n\n**Hours**\n[Your operating hours.]\n\nWe're located at [address or intersection]. Easy in, easy out.",
    },
  ],
  exchange: [
    {
      key: "exchange-how-it-works",
      label: "How It Works",
      category: "educational",
      suggestedTitle: "How Our Exchange Works",
      suggestedSummary: "A simple guide to exchanging currency with us.",
      suggestedContent:
        "Exchanging currency is simple with us. Here's the process:\n\n1. **Check the rate** — View today's rates on our profile or ask in person.\n2. **Bring your currency** — We accept [list currency types you handle].\n3. **ID required** — Please bring a valid government-issued ID.\n4. **Get your exchange** — Fast, transparent, no hidden fees.\n\n**Walk-ins welcome.** No appointment needed for standard exchanges.\n\nFor large amounts or special currencies, contact us in advance.",
    },
    {
      key: "exchange-rate-guide",
      label: "Rate Guide",
      category: "educational",
      suggestedTitle: "Understanding Our Exchange Rates",
      suggestedSummary: "How rates work and what to expect when you exchange with us.",
      suggestedContent:
        "Our rates are updated [daily / in real time / as market conditions change].\n\n**What affects the rate?**\n- Market fluctuations in global currency pairs\n- Currency availability\n- Volume of the transaction\n\n**What we don't charge:**\n- Hidden fees\n- Service charges on standard exchanges\n\n**Large transactions:**\nFor amounts over $[X], contact us in advance for a better rate.\n\nWe believe in fair, transparent pricing. Questions? Ask us.",
    },
  ],
  locksmith: [
    {
      key: "locksmith-emergency",
      label: "Emergency Guide",
      category: "emergency",
      suggestedTitle: "Locked Out? Here's What to Do",
      suggestedSummary: "Fast help when you're locked out — steps to get back in.",
      suggestedContent:
        "Being locked out is stressful. We're here to help.\n\n**What to do right now:**\n1. Stay calm and stay safe.\n2. Call us at [phone number] — we're available [hours / 24/7].\n3. Share your location or address.\n4. We'll have a technician to you in [estimated response time].\n\n**What we handle:**\n- Residential lockouts\n- Car lockouts\n- Commercial lockouts\n- Broken key extraction\n- Lock changes and rekeying\n\nWe're licensed, insured, and local. Help is on the way.",
    },
    {
      key: "locksmith-services",
      label: "Service Guide",
      category: "guide",
      suggestedTitle: "Our Locksmith Services",
      suggestedSummary: "From lockouts to security upgrades — here's what we do.",
      suggestedContent:
        "We handle all things locks and security. Here's a full look at our services:\n\n**Emergency Services**\n[Lockouts, broken keys, after-hours calls.]\n\n**Residential**\n[Rekeying, lock installation, smart lock setup, garage doors.]\n\n**Automotive**\n[Car lockouts, key duplication, transponder keys, ignition repair.]\n\n**Commercial**\n[Master key systems, access control, high-security locks.]\n\nAll work is done by licensed technicians. We stand behind our work.",
    },
  ],
};

/**
 * Returns templates relevant to the given vport type, followed by universal templates.
 * Falls back to universal-only for unknown types.
 */
export function getTemplatesForVportType(vportType) {
  const typeKey = (vportType || "").toLowerCase().trim();
  const typeSpecific = TEMPLATES_BY_TYPE[typeKey] ?? [];
  return [...typeSpecific, ...UNIVERSAL_TEMPLATES];
}

export { UNIVERSAL_TEMPLATES };
