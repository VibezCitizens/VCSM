export const STEP_DEFAULTS = Object.freeze({
  complete_citizen_card: {
    title: 'Complete your citizen card',
    description: 'Finish the core profile fields for your citizen identity.',
    ctaLabel: 'Complete card',
    ctaPath: '/settings?tab=profile',
  },
  invite_first_citizen: {
    title: 'Invite your first citizen',
    description: 'Send your first invite to bring someone into the network.',
    ctaLabel: 'Invite citizen',
    ctaPath: '/invite',
  },
  set_vibe_tags: {
    title: 'Set your vibe tags',
    description: 'Show the vibes that represent you.',
    ctaLabel: 'Set vibe tags',
    ctaPath: '/citizen/vibes',
  },
})

// Temporary UI gate:
// hide invite onboarding card while invite email flow is rebuilt.
// Re-enable by setting this back to true.
export const SHOW_INVITE_ONBOARDING_CARD = false

function resolveStepCtaPath({
  stepKey,
  ctaPath,
  fallbackCtaPath,
}) {
  const rawPath = String(ctaPath || '').trim()
  const fallbackPath = String(fallbackCtaPath || '').trim()
  const candidate = rawPath || fallbackPath

  // Profile completion for citizens is owned by Settings > Profile.
  // Enforce this route regardless of DB cta_path to avoid drift.
  if (stepKey === 'complete_citizen_card') {
    return '/settings?tab=profile'
  }

  return candidate
}

export function formatRemainingLabel(count, singular, plural) {
  const safeCount = Math.max(0, Number(count ?? 0))
  return `${safeCount} ${safeCount === 1 ? singular : plural}`
}

export function getStepOrFallback(stepByKey, key) {
  const fallback = STEP_DEFAULTS[key]
  const fromDb = stepByKey.get(key)

  return {
    key,
    title: fromDb?.title || fallback?.title || '',
    description: fromDb?.description || fallback?.description || '',
    ctaLabel: fromDb?.ctaLabel || fallback?.ctaLabel || '',
    ctaPath: resolveStepCtaPath({
      stepKey: key,
      ctaPath: fromDb?.ctaPath,
      fallbackCtaPath: fallback?.ctaPath,
    }),
    sortOrder: fromDb?.sortOrder ?? 0,
  }
}

function logOnboardingStepFailure({
  step,
  actorId,
  error,
}) {
  console.error(`[onboarding/cards] ${step} failed`, {
    actorId,
    message: error?.message ?? null,
    code: error?.code ?? null,
    details: error?.details ?? null,
    hint: error?.hint ?? null,
    error,
  })
}

export async function loadStep({
  step,
  actorId,
  loader,
}) {
  try {
    return await loader()
  } catch (error) {
    logOnboardingStepFailure({ step, actorId, error })
    throw error
  }
}
