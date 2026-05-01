import vportSchema from "@/services/supabase/vportClient";

function normalizeCityInput(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeStateCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

function normalizeCountryCode(value) {
  const clean = String(value || "").trim().toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
  return clean || "US";
}

export async function resolveVportCity(city, stateCode, countryCode) {
  const cleanCity = normalizeCityInput(city);
  const cleanState = normalizeStateCode(stateCode);
  const cleanCountry = normalizeCountryCode(countryCode);

  if (!cleanCity || !cleanState) return null;

  const { data, error } = await vportSchema
    .from("cities")
    .select("id, city, state_code, country_code, slug")
    .ilike("city", cleanCity)
    .eq("state_code", cleanState)
    .eq("country_code", cleanCountry)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
