import { readOnboardingStepsDAL } from '@/features/onboarding/dal/onboardingSteps.dal'
import {
  readVibeTagsDAL,
  readSelectedVibeTagsDAL,
} from '@/features/onboarding/dal/vibeTags.dal'
import {
  readVibeInvitesDAL,
  readQualifyingVibeInviteCountDAL,
} from '@/features/onboarding/dal/vibeInvites.dal'
import {
  readActorRowDAL,
  readProfileCompletionFieldsDAL,
  readVportCompletionFieldsDAL,
} from '@/features/onboarding/dal/profileCompletion.dal'
import {
  mapOnboardingStepRow,
  mapVibeTagRow,
  mapVibeInviteRow,
  mapActorRow,
  mapProfileCompletionRow,
  mapVportCompletionRow,
  buildProfileCompletionSnapshot,
  buildProfileCompletionChecklist,
  buildVportCompletionSnapshot,
  buildVportCompletionChecklist,
  buildVibeTagsSnapshot,
  buildInviteSnapshot,
  buildOnboardingCardModel,
} from '@/features/onboarding/model/onboarding.model'

const STEP_DEFAULTS = Object.freeze({
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

function formatRemainingLabel(count, singular, plural) {
  const safeCount = Math.max(0, Number(count ?? 0))
  return `${safeCount} ${safeCount === 1 ? singular : plural}`
}

function getStepOrFallback(stepByKey, key) {
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

async function loadStep({
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

export async function getOnboardingCardsController({ actorId }) {
  if (!actorId) {
    return {
      ok: false,
      error: { message: 'Missing actorId' },
      data: { cards: [] },
    }
  }

  const [
    rawSteps,
    rawTags,
    rawSelectedTags,
    rawInvites,
    qualifyingInviteCount,
    rawActor,
  ] = await Promise.all([
    loadStep({
      step: 'readOnboardingStepsDAL',
      actorId,
      loader: () => readOnboardingStepsDAL(),
    }),
    loadStep({
      step: 'readVibeTagsDAL',
      actorId,
      loader: () => readVibeTagsDAL(),
    }),
    loadStep({
      step: 'readSelectedVibeTagsDAL',
      actorId,
      loader: () => readSelectedVibeTagsDAL(actorId),
    }),
    loadStep({
      step: 'readVibeInvitesDAL',
      actorId,
      loader: () => readVibeInvitesDAL({ senderActorId: actorId, limit: 10 }),
    }),
    loadStep({
      step: 'readQualifyingVibeInviteCountDAL',
      actorId,
      loader: () => readQualifyingVibeInviteCountDAL({ senderActorId: actorId }),
    }),
    loadStep({
      step: 'readActorRowDAL',
      actorId,
      loader: () => readActorRowDAL(actorId),
    }),
  ])

  const steps = rawSteps.map(mapOnboardingStepRow)
  const vibeTags = rawTags.map(mapVibeTagRow)
  const invites = rawInvites.map(mapVibeInviteRow)
  const actor = mapActorRow(rawActor)

  const [rawProfile, rawVport] = await Promise.all([
    actor?.kind === 'user' && actor?.profileId
      ? loadStep({
          step: 'readProfileCompletionFieldsDAL',
          actorId,
          loader: () => readProfileCompletionFieldsDAL(actor.profileId),
        })
      : Promise.resolve(null),
    actor?.kind === 'vport' && actor?.vportId
      ? loadStep({
          step: 'readVportCompletionFieldsDAL',
          actorId,
          loader: () => readVportCompletionFieldsDAL(actor.vportId),
        })
      : Promise.resolve(null),
  ])

  const profile = mapProfileCompletionRow(rawProfile)
  const vport = mapVportCompletionRow(rawVport)

  const stepByKey = new Map(steps.map((step) => [step.key, step]))

  const profileSnapshot = buildProfileCompletionSnapshot(profile)
  const vportSnapshot = buildVportCompletionSnapshot(vport)
  const inviteSnapshot = buildInviteSnapshot({
    inviteRows: invites,
    qualifyingCount: qualifyingInviteCount,
  })
  const vibeTagsSnapshot = buildVibeTagsSnapshot({
    selectedRows: rawSelectedTags,
    allTags: vibeTags,
    minimumRequired: 3,
  })

  const citizenCardStep = getStepOrFallback(stepByKey, 'complete_citizen_card')
  const inviteStep = getStepOrFallback(stepByKey, 'invite_first_citizen')
  const vibesStep = getStepOrFallback(stepByKey, 'set_vibe_tags')

  const isCitizenActor = actor?.kind === 'user'
  const isVportActor = actor?.kind === 'vport'
  const canCompleteIdentityCard = isCitizenActor || isVportActor
  const identitySnapshot = isVportActor ? vportSnapshot : profileSnapshot
  const identityChecklist = isVportActor
    ? buildVportCompletionChecklist(vportSnapshot)
    : buildProfileCompletionChecklist(profileSnapshot)

  const cards = [
    buildOnboardingCardModel({
      step: citizenCardStep,
      status:
        canCompleteIdentityCard && identitySnapshot.isCompleted ? 'completed' : 'pending',
      progress: canCompleteIdentityCard ? identitySnapshot.progressPercent : 0,
      checklist: canCompleteIdentityCard ? identityChecklist : [],
      helperText: canCompleteIdentityCard
        ? identitySnapshot.isCompleted
          ? isVportActor
            ? 'Profile complete. Your vport identity is ready.'
            : 'Profile complete. Your citizen identity is ready.'
          : `${formatRemainingLabel(
              identitySnapshot.completedFields,
              'field',
              'fields'
            )} of ${identitySnapshot.totalFields} completed.`
        : 'Profile completion is unavailable for this account.',
      progressMode: 'progress',
      fallbackTitle: STEP_DEFAULTS.complete_citizen_card.title,
      fallbackDescription: STEP_DEFAULTS.complete_citizen_card.description,
      fallbackCtaLabel: STEP_DEFAULTS.complete_citizen_card.ctaLabel,
      fallbackCtaPath: STEP_DEFAULTS.complete_citizen_card.ctaPath,
    }),
    buildOnboardingCardModel({
      step: inviteStep,
      status: inviteSnapshot.isCompleted ? 'completed' : 'pending',
      progress: inviteSnapshot.progressPercent,
      helperText: inviteSnapshot.isCompleted
        ? 'First invite sent. Your network is starting to grow.'
        : 'Invite one citizen to unlock faster conversations and discovery.',
      progressMode: 'action',
      fallbackTitle: STEP_DEFAULTS.invite_first_citizen.title,
      fallbackDescription: STEP_DEFAULTS.invite_first_citizen.description,
      fallbackCtaLabel: STEP_DEFAULTS.invite_first_citizen.ctaLabel,
      fallbackCtaPath: STEP_DEFAULTS.invite_first_citizen.ctaPath,
    }),
    buildOnboardingCardModel({
      step: vibesStep,
      status: vibeTagsSnapshot.isCompleted ? 'completed' : 'pending',
      progress: vibeTagsSnapshot.progressPercent,
      helperText: vibeTagsSnapshot.isCompleted
        ? 'Vibe identity complete. Your feed can now personalize better.'
        : vibeTagsSnapshot.nonVoidSelectedCount > 0
        ? `Add ${formatRemainingLabel(
            vibeTagsSnapshot.minimumTagsRemaining,
            'more tag',
            'more tags'
          )} to complete this step.`
        : 'Pick at least 3 vibe tags so citizens and vports can discover you.',
      progressMode: 'progress',
      fallbackTitle: STEP_DEFAULTS.set_vibe_tags.title,
      fallbackDescription: STEP_DEFAULTS.set_vibe_tags.description,
      fallbackCtaLabel: STEP_DEFAULTS.set_vibe_tags.ctaLabel,
      fallbackCtaPath: STEP_DEFAULTS.set_vibe_tags.ctaPath,
    }),
  ]

  return {
    ok: true,
    error: null,
    data: {
      cards,
      snapshots: {
        profile: profileSnapshot,
        vport: vportSnapshot,
        invites: inviteSnapshot,
        vibeTags: vibeTagsSnapshot,
      },
    },
  }
}
