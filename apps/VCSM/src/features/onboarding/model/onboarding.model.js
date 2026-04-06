export function mapOnboardingStepRow(row) {
  return {
    key: row?.key ?? '',
    title: row?.label ?? '',
    description: row?.description ?? '',
    ctaLabel: row?.cta_label ?? '',
    ctaPath: row?.cta_path ?? '',
    sortOrder: Number(row?.sort_order ?? 0),
    isActive: row?.is_active !== false,
  }
}

export function mapVibeTagRow(row) {
  return {
    id: row?.id ?? null,
    name: row?.name ?? '',
    slug: row?.slug ?? '',
    color: row?.color ?? null,
    sortOrder: Number(row?.sort_order ?? 0),
    isActive: row?.is_active !== false,
  }
}

export function mapVibeInviteRow(row) {
  return {
    id: row?.id ?? null,
    senderActorId: row?.sender_actor_id ?? null,
    recipientActorId: row?.recipient_actor_id ?? null,
    status: row?.status ?? 'pending',
    createdAt: row?.created_at ?? null,
    acceptedAt: row?.accepted_at ?? null,
  }
}

export function mapActorRow(row) {
  return {
    id: row?.id ?? null,
    kind: row?.kind ?? null,
    profileId: row?.profile_id ?? null,
    vportId: row?.vport_id ?? null,
    isVoid: row?.is_void === true,
  }
}

export function mapProfileCompletionRow(row) {
  return {
    id: row?.id ?? null,
    displayName: row?.display_name ?? '',
    username: row?.username ?? '',
    avatarUrl: row?.photo_url ?? '',
    bio: row?.bio ?? '',
  }
}

export function mapVportCompletionRow(row) {
  return {
    id: row?.id ?? null,
    name: row?.name ?? '',
    avatarUrl: row?.avatar_url ?? '',
    bio: row?.bio ?? '',
  }
}

function buildCompletionSnapshot(record, requiredFields) {
  const safe = record || {}
  const required = Array.isArray(requiredFields) ? requiredFields : []
  const missingFields = required.filter((key) => !String(safe?.[key] ?? '').trim())
  const completedFields = required.length - missingFields.length
  const progress = required.length > 0 ? completedFields / required.length : 0

  return {
    requiredFields: required,
    missingFields,
    completedFields,
    totalFields: required.length,
    progressPercent: progress,
    isCompleted: missingFields.length === 0,
  }
}

export function buildProfileCompletionSnapshot(profile) {
  return buildCompletionSnapshot(profile, ['displayName', 'username', 'avatarUrl', 'bio'])
}

export function buildVportCompletionSnapshot(vport) {
  return buildCompletionSnapshot(vport, ['name', 'avatarUrl', 'bio'])
}

const PROFILE_COMPLETION_FIELD_LABELS = Object.freeze({
  displayName: 'Name',
  username: 'username',
  avatarUrl: 'Profile Picture',
  bio: 'Bio',
})

const VPORT_COMPLETION_FIELD_LABELS = Object.freeze({
  name: 'Name',
  avatarUrl: 'Profile Picture',
  bio: 'Bio',
})

function buildCompletionChecklist(snapshot, labelsByField) {
  const safeSnapshot = snapshot || {}
  const requiredFields = Array.isArray(safeSnapshot.requiredFields)
    ? safeSnapshot.requiredFields
    : []
  const missingSet = new Set(
    Array.isArray(safeSnapshot.missingFields) ? safeSnapshot.missingFields : []
  )

  return requiredFields.map((fieldKey) => ({
    key: fieldKey,
    label: labelsByField[fieldKey] || fieldKey,
    isCompleted: !missingSet.has(fieldKey),
  }))
}

export function buildProfileCompletionChecklist(snapshot) {
  return buildCompletionChecklist(snapshot, PROFILE_COMPLETION_FIELD_LABELS).filter(
    (item) => item.key !== 'username'
  )
}

export function buildVportCompletionChecklist(snapshot) {
  return buildCompletionChecklist(snapshot, VPORT_COMPLETION_FIELD_LABELS)
}

export function buildVibeTagsSnapshot({
  selectedRows = [],
  allTags = [],
  minimumRequired = 3,
}) {
  const selectedTagIds = new Set(
    (Array.isArray(selectedRows) ? selectedRows : [])
      .map((row) => row?.tag_id)
      .filter(Boolean)
  )

  const tagById = new Map(
    (Array.isArray(allTags) ? allTags : []).map((tag) => [tag.id, tag])
  )

  const nonVoidSelectedCount = Array.from(selectedTagIds).reduce((acc, tagId) => {
    const tag = tagById.get(tagId)
    const name = String(tag?.name ?? '').trim().toLowerCase()
    const slug = String(tag?.slug ?? '').trim().toLowerCase()
    const isVoid = name === 'void' || slug === 'void'
    return isVoid ? acc : acc + 1
  }, 0)

  const progress = Math.min(1, nonVoidSelectedCount / Math.max(1, minimumRequired))

  return {
    selectedTagIds,
    nonVoidSelectedCount,
    minimumRequired,
    minimumTagsRemaining: Math.max(0, minimumRequired - nonVoidSelectedCount),
    progressPercent: progress,
    isCompleted: nonVoidSelectedCount >= minimumRequired,
  }
}

export function buildInviteSnapshot({ inviteRows = [], qualifyingCount = null }) {
  const list = Array.isArray(inviteRows) ? inviteRows : []
  const totalInvites = list.length
  const qualifyingFromRows = list.filter((invite) =>
    ['pending', 'accepted'].includes(invite?.status)
  ).length

  const qualifyingInvites =
    typeof qualifyingCount === 'number' ? qualifyingCount : qualifyingFromRows

  return {
    totalInvites,
    qualifyingInvites,
    progressPercent: qualifyingInvites > 0 ? 1 : 0,
    isCompleted: qualifyingInvites > 0,
  }
}

export function buildOnboardingCardModel({
  step,
  status,
  progress,
  helperText,
  checklist = [],
  progressMode = 'progress',
  fallbackTitle,
  fallbackDescription,
  fallbackCtaLabel,
  fallbackCtaPath,
}) {
  return {
    key: step?.key ?? '',
    title: step?.title || fallbackTitle,
    description: step?.description || fallbackDescription,
    status,
    progress: Number(progress ?? 0),
    helperText: helperText ? String(helperText) : '',
    checklist: Array.isArray(checklist) ? checklist : [],
    progressMode: progressMode === 'action' ? 'action' : 'progress',
    ctaLabel: step?.ctaLabel || fallbackCtaLabel,
    ctaPath: step?.ctaPath || fallbackCtaPath,
  }
}
