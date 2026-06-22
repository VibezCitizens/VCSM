/**
 * Regression tests — onboarding.controller.js
 *
 * Security invariant (TICKET-INVITE-ATTRIBUTION-001):
 * citizen_invite_code attribution is fire-and-forget.
 * A failing acceptVibeInviteByCodeDAL must NEVER block or fail onboarding.
 * ensureVcsmPlatformBootstrap must still be called.
 * The controller must return { ok: true } regardless of attribution outcome.
 *
 * Run: npx vitest run src/features/auth/controllers/__tests__/onboarding.controller.test.js
 * Tests: completeOnboardingController (now at onboarding/controllers/onboarding.complete.controller.js)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/features/auth/shared/dal/authSession.read.dal', () => ({
  dalGetAuthSession: vi.fn(),
}))

vi.mock('@/features/auth/onboarding/dal/onboarding.read.dal', () => ({
  generateUsernameDAL:         vi.fn(),
  readProfileForOnboardingDAL: vi.fn(),
}))

vi.mock('@/features/auth/onboarding/dal/onboarding.write.dal', () => ({
  upsertCompletedOnboardingProfileDAL: vi.fn(),
}))

vi.mock('@/features/auth/shared/model/onboarding.model', () => ({
  computeAgeFromBirthdateModel:       vi.fn(),
  mapProfileOnboardingRowToFormModel: vi.fn(),
  normalizeOnboardingFormModel:       vi.fn(),
}))

vi.mock('@/features/auth/onboarding/controllers/createUserActor.controller', () => ({
  createUserActorForProfile: vi.fn(),
}))

vi.mock('@/features/initiation/adapters/initiation.adapter', () => ({
  acceptCitizenInviteAttribution: vi.fn(),
}))

vi.mock('@/services/monitoring/monitoringClient', () => ({
  captureFrontendError: vi.fn(),
}))

vi.mock('@/services/supabase/supabaseClient', () => ({
  supabase: {
    auth:      { getSession: vi.fn() },
    functions: { invoke: vi.fn() },
    schema:    vi.fn(() => ({ from: vi.fn() })),
    from:      vi.fn(() => ({ select: vi.fn(), upsert: vi.fn(), update: vi.fn() })),
  },
}))

import { completeOnboardingController } from '@/features/auth/onboarding/controllers/onboarding.complete.controller'
import { dalGetAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'
import { generateUsernameDAL } from '@/features/auth/onboarding/dal/onboarding.read.dal'
import { upsertCompletedOnboardingProfileDAL } from '@/features/auth/onboarding/dal/onboarding.write.dal'
import {
  computeAgeFromBirthdateModel,
  normalizeOnboardingFormModel,
} from '@/features/auth/shared/model/onboarding.model'
import { createUserActorForProfile } from '@/features/auth/onboarding/controllers/createUserActor.controller'
import { acceptCitizenInviteAttribution } from '@/features/initiation/adapters/initiation.adapter'
import { captureFrontendError } from '@/services/monitoring/monitoringClient'

const VALID_FORM = {
  display_name:  'Test User',
  username_base: 'testuser',
  birthdate:     '2000-01-15',
  sex:           'male',
}

const MOCK_USER_ID  = 'user-123'
const MOCK_ACTOR_ID = 'actor-456'
const MOCK_INVITE_CODE = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function makeSession(citizenInviteCode = null) {
  return {
    user: {
      id:            MOCK_USER_ID,
      is_anonymous:  false,
      app_metadata:  {},
      user_metadata: citizenInviteCode ? { citizen_invite_code: citizenInviteCode } : {},
    },
  }
}

function setupHappyPath() {
  normalizeOnboardingFormModel.mockReturnValue({
    displayName:  'Test User',
    usernameBase: 'testuser',
    birthdate:    '2000-01-15',
    sex:          'male',
  })
  computeAgeFromBirthdateModel.mockReturnValue(25)
  generateUsernameDAL.mockResolvedValue('testuser')
  upsertCompletedOnboardingProfileDAL.mockResolvedValue(undefined)
  createUserActorForProfile.mockResolvedValue({ id: MOCK_ACTOR_ID })
}

describe('completeOnboardingController — attribution does not block onboarding', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('returns ok=true even when acceptCitizenInviteAttribution rejects', async () => {
    dalGetAuthSession.mockResolvedValue(makeSession(MOCK_INVITE_CODE))
    setupHappyPath()
    acceptCitizenInviteAttribution.mockRejectedValue(new Error('DB connection lost'))

    const ensureVcsmPlatformBootstrap = vi.fn().mockResolvedValue(undefined)

    const result = await completeOnboardingController({
      userId: MOCK_USER_ID,
      form:   VALID_FORM,
      ensureVcsmPlatformBootstrap,
      refreshActorFn: vi.fn(),
    })

    expect(result.ok).toBe(true)
    expect(result.error).toBeNull()
  })

  it('calls acceptCitizenInviteAttribution with the invite code and actor id', async () => {
    dalGetAuthSession.mockResolvedValue(makeSession(MOCK_INVITE_CODE))
    setupHappyPath()
    acceptCitizenInviteAttribution.mockRejectedValue(new Error('irrelevant'))

    await completeOnboardingController({
      userId: MOCK_USER_ID,
      form:   VALID_FORM,
      ensureVcsmPlatformBootstrap: vi.fn().mockResolvedValue(undefined),
      refreshActorFn: vi.fn(),
    })

    expect(acceptCitizenInviteAttribution).toHaveBeenCalledWith({
      citizenInviteCode: MOCK_INVITE_CODE,
      acceptedActorId:   MOCK_ACTOR_ID,
    })
  })

  it('calls captureFrontendError after attribution rejects (fire-and-forget handler runs)', async () => {
    dalGetAuthSession.mockResolvedValue(makeSession(MOCK_INVITE_CODE))
    setupHappyPath()
    acceptCitizenInviteAttribution.mockRejectedValue(new Error('DB connection lost'))

    await completeOnboardingController({
      userId: MOCK_USER_ID,
      form:   VALID_FORM,
      ensureVcsmPlatformBootstrap: vi.fn().mockResolvedValue(undefined),
      refreshActorFn: vi.fn(),
    })

    // Flush microtask queue so the fire-and-forget .catch handler runs
    await Promise.resolve()

    expect(captureFrontendError).toHaveBeenCalledOnce()
    expect(captureFrontendError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { flow: 'invite_attribution' } })
    )
  })

  it('still calls ensureVcsmPlatformBootstrap after attribution rejects', async () => {
    dalGetAuthSession.mockResolvedValue(makeSession(MOCK_INVITE_CODE))
    setupHappyPath()
    acceptCitizenInviteAttribution.mockRejectedValue(new Error('irrelevant'))

    const ensureVcsmPlatformBootstrap = vi.fn().mockResolvedValue(undefined)

    await completeOnboardingController({
      userId: MOCK_USER_ID,
      form:   VALID_FORM,
      ensureVcsmPlatformBootstrap,
      refreshActorFn: vi.fn(),
    })

    expect(ensureVcsmPlatformBootstrap).toHaveBeenCalledWith({
      userId:  MOCK_USER_ID,
      actorId: MOCK_ACTOR_ID,
    })
  })

  it('skips attribution entirely when no citizen_invite_code in user_metadata', async () => {
    dalGetAuthSession.mockResolvedValue(makeSession(null)) // no invite code
    setupHappyPath()

    await completeOnboardingController({
      userId: MOCK_USER_ID,
      form:   VALID_FORM,
      ensureVcsmPlatformBootstrap: vi.fn().mockResolvedValue(undefined),
      refreshActorFn: vi.fn(),
    })

    expect(acceptCitizenInviteAttribution).not.toHaveBeenCalled()
    expect(captureFrontendError).not.toHaveBeenCalled()
  })
})
