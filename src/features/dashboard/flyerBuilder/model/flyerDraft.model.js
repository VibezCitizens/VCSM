export function makeFlyerDraftFromPublicDetails(publicDetails) {
  const pd = publicDetails || {};

  return {
    // text
    flyer_headline: pd.flyer_headline ?? "",
    flyer_subheadline: pd.flyer_subheadline ?? "",
    flyer_note: pd.flyer_note ?? "",
    accent_color: (pd.accent_color ?? "#c23a3a").trim(),
    hours: pd.hours ?? "",
    website_url: pd.website_url ?? "",
    phone_public: pd.phone_public ?? "",

    // images (urls)
    logo_url: pd.logo_url ?? "",
    banner_url: pd.banner_url ?? "", // if you also expose banner in publicDetails
    flyer_food_image_1: pd.flyer_food_image_1 ?? "",
    flyer_food_image_2: pd.flyer_food_image_2 ?? "",
  };
}

export function mergeDraft(draft, patch) {
  return { ...(draft || {}), ...(patch || {}) };
}
