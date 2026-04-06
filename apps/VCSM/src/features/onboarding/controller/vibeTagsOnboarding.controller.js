import {
  readVibeTagsDAL,
  readSelectedVibeTagsDAL,
  replaceSelectedVibeTagsDAL,
} from '@/features/onboarding/dal/vibeTags.dal'
import { mapVibeTagRow } from '@/features/onboarding/model/onboarding.model'

export async function getVibeTagsOnboardingController({ actorId }) {
  if (!actorId) {
    return {
      ok: false,
      error: { message: 'Missing actorId' },
      data: { tags: [], selectedTagIds: [] },
    }
  }

  const [rawTags, rawSelected] = await Promise.all([
    readVibeTagsDAL(),
    readSelectedVibeTagsDAL(actorId),
  ])

  const tags = rawTags.map(mapVibeTagRow)
  const selectedTagIds = Array.from(
    new Set(rawSelected.map((row) => row?.tag_id).filter(Boolean))
  )

  return {
    ok: true,
    error: null,
    data: {
      tags,
      selectedTagIds,
    },
  }
}

export async function saveVibeTagsOnboardingController({
  actorId,
  selectedTagIds,
}) {
  if (!actorId) {
    return {
      ok: false,
      error: { message: 'Missing actorId' },
    }
  }

  const tagIds = Array.from(
    new Set((Array.isArray(selectedTagIds) ? selectedTagIds : []).filter(Boolean))
  )

  await replaceSelectedVibeTagsDAL({
    actorId,
    tagIds,
  })

  return {
    ok: true,
    error: null,
  }
}
