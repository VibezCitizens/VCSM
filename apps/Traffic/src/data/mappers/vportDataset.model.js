export function flattenVportPublicTrazeProfileRow(row) {
  return {
    id: row.id,
    actor_id: row.actor_id,
    slug: row.slug,
    name: row.name,
    bio: row.bio,
    avatar_url: row.avatar_url ?? null,
    banner_url: row.banner_url ?? null,
    directory_visible: row.directory_visible ?? null,
    directory_status: row.directory_status ?? null,
    is_active: true,
    created_at: row.created_at,
    phone_public: row.phone_public ?? null,
    location_text: row.location_text ?? null,
    address: row.address ?? null,
    timezone: row.timezone ?? null,
    city_id: row.city_id ?? null,
    city: row.city ?? null,
    city_slug: row.city_slug ?? null,
    state_code: row.state_code ?? null,
    city_country_code: row.city_country_code ?? null,
    country_code: row.country_code ?? null,
    category_key: row.category_key ?? null
  };
}
