import { readOnboardingStepsDAL, readActorOnboardingStepDAL } from '@/features/initiation/dal/onboardingSteps.dal'
import {
  readVibeTagsDAL,
  readSelectedVibeTagsDAL,
} from '@/features/initiation/dal/vibeTags.dal'
import {
  readVibeInvitesDAL,
  readQualifyingVibeInviteCountDAL,
} from '@/features/initiation/dal/vibeInvites.dal'
import {
  readActorRowDAL,
  readProfileCompletionFieldsDAL,
  readVportCompletionFieldsDAL,
} from '@/features/initiation/dal/profileCompletion.dal'
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
} from '@/features/initiation/models/onboarding.model'
import {
  STEP_DEFAULTS,
  SHOW_INVITE_ONBOARDING_CARD,
  formatRemainingLabel,
  getStepOrFallback,
  loadStep,
} from '@/features/initiation/controllers/onboarding.controller.helpers'

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
    inviteStepRow,
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
    loadStep({
      step: 'readActorOnboardingStepDAL:invite_first_citizen',
      actorId,
      loader: () => readActorOnboardingStepDAL({ actorId, stepKey: 'invite_first_citizen' }),
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
  const inviteStepCompleted = inviteStepRow?.status === 'completed'
  const inviteSnapshot = buildInviteSnapshot({
    inviteRows: invites,
    qualifyingCount: inviteStepCompleted ? 1 : qualifyingInviteCount,
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

  const citizenCardModel = buildOnboardingCardModel({
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
  })

  const inviteCardModel = buildOnboardingCardModel({
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
  })

  const vibeTagsCardModel = buildOnboardingCardModel({
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
  })

  const cards = [
    citizenCardModel,
    ...(SHOW_INVITE_ONBOARDING_CARD ? [inviteCardModel] : []),
    vibeTagsCardModel,
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
