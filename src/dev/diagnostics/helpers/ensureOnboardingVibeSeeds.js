import { supabase } from "@/services/supabase/supabaseClient";
import { createSeedMissingError } from "@/dev/diagnostics/helpers/supabaseAssert";

export async function ensureOnboardingStepSeed(shared) {
  if (shared?.cache?.onboardingStepSeed) {
    return shared.cache.onboardingStepSeed;
  }
  if (shared?.cache?.onboardingStepSeedError) {
    throw shared.cache.onboardingStepSeedError;
  }

  const { data: activeStep, error: activeStepError } = await supabase
    .schema("vc")
    .from("onboarding_steps")
    .select("key,label,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeStepError) throw activeStepError;

  let selectedStep = activeStep;

  if (!selectedStep?.key) {
    const { data: anyStep, error: anyStepError } = await supabase
      .schema("vc")
      .from("onboarding_steps")
      .select("key,label,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anyStepError) throw anyStepError;
    selectedStep = anyStep;
  }

  if (!selectedStep?.key) {
    const error = createSeedMissingError(
      "Required vc.onboarding_steps seed rows are missing or not readable to this client context. Diagnostics will not insert system seed data from client.",
      {
        schema: "vc",
        table: "onboarding_steps",
      }
    );
    if (shared?.cache) {
      shared.cache.onboardingStepSeedError = error;
    }
    throw error;
  }

  if (shared?.cache) {
    shared.cache.onboardingStepSeed = selectedStep;
  }

  return selectedStep;
}

export async function ensureVibeTagSeed(shared) {
  if (shared?.cache?.vibeTagSeed) {
    return shared.cache.vibeTagSeed;
  }
  if (shared?.cache?.vibeTagSeedError) {
    throw shared.cache.vibeTagSeedError;
  }

  const { data: activeTag, error: activeTagError } = await supabase
    .schema("vc")
    .from("vibe_tags")
    .select("key,label,sort_order,is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("key", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (activeTagError) throw activeTagError;

  let selectedTag = activeTag;

  if (!selectedTag?.key) {
    const { data: anyTag, error: anyTagError } = await supabase
      .schema("vc")
      .from("vibe_tags")
      .select("key,label,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (anyTagError) throw anyTagError;
    selectedTag = anyTag;
  }

  if (!selectedTag?.key) {
    const error = createSeedMissingError(
      "Required vc.vibe_tags seed rows are missing or not readable to this client context. Diagnostics will not insert system seed data from client.",
      {
        schema: "vc",
        table: "vibe_tags",
      }
    );
    if (shared?.cache) {
      shared.cache.vibeTagSeedError = error;
    }
    throw error;
  }

  if (shared?.cache) {
    shared.cache.vibeTagSeed = selectedTag;
  }

  return selectedTag;
}
