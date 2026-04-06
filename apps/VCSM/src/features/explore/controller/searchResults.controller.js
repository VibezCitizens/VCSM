import { searchDal } from '@/features/explore/dal/search.dal'

export async function ctrlSearchResults({ query, filter }) {
  const trimmed = String(query || '').trim()
  if (!trimmed) return []

  const responses = await Promise.all(searchDal(trimmed, filter, {}))

  const normalized = responses
    .flat()
    .map(normalizeResult)
    .filter(Boolean)

  const features = buildFeatureResults(trimmed, filter)
    .map(normalizeResult)
    .filter(Boolean)

  return dedupeByKindAndId([...features, ...normalized])
}

function buildFeatureResults(query, activeFilter) {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return []
  if (activeFilter !== 'all') return []

  const wantsWanders =
    needle.includes('wander') ||
    needle.includes('wanders') ||
    needle.startsWith('@wander') ||
    needle === 'w'

  if (!wantsWanders) return []

  return [
    {
      result_type: 'feature',
      id: 'wanders',
      title: 'Wanders',
      subtitle: 'Explore nearby Wanders',
      icon: 'at-bubble',
      route: '/wanders',
    },
  ]
}

export function normalizeResult(item) {
  if (!item) return null

  const type = item.result_type || item.type || item.kind

  switch (type) {
    case 'actor':
      if (!item.actor_id) return null
      return {
        result_type: 'actor',
        actor_id: item.actor_id,
        display_name: item.display_name ?? '',
        username: item.username ?? '',
        photo_url: item.photo_url ?? '/avatar.jpg',
        private: !!item.private,
      }
    case 'feature':
      if (!item.id) return null
      return {
        result_type: 'feature',
        id: item.id,
        title: item.title ?? '',
        subtitle: item.subtitle ?? '',
        icon: item.icon ?? null,
        route: item.route ?? null,
      }
    case 'vport':
      return {
        result_type: 'vport',
        id: item.id ?? null,
        name: item.name ?? '',
        description: item.description ?? '',
        avatar_url: item.avatar_url ?? '/avatar.jpg',
        is_active: !!item.is_active,
      }
    case 'post':
      return {
        result_type: 'post',
        id: item.id ?? item.post_id ?? null,
        title: item.title ?? '',
        text: item.text ?? '',
      }
    case 'comment':
      return {
        result_type: 'comment',
        id: item.id ?? item.comment_id ?? null,
        text: item.text ?? item.body ?? '',
        post_id: item.post_id ?? null,
      }
    case 'message':
    case 'conversation':
      return {
        result_type: type,
        id: item.id ?? item.conversation_id ?? item.message_id ?? null,
        title: item.title ?? '',
        text: item.text ?? item.body ?? '',
      }
    case 'video':
      return {
        result_type: 'video',
        id: item.id ?? item.video_id ?? null,
        title: item.title ?? '',
      }
    case 'group':
      return {
        result_type: 'group',
        id: item.id ?? item.group_id ?? null,
        name: item.name ?? item.group_name ?? '',
        description: item.description ?? '',
      }
    default:
      return null
  }
}

export function dedupeByKindAndId(items) {
  const out = new Map()

  for (const item of items) {
    if (!item) continue
    const keyId = item.result_type === 'actor' ? item.actor_id : item.id
    const key = `${item.result_type}:${keyId ?? 'null'}`
    if (!out.has(key)) out.set(key, item)
  }

  return Array.from(out.values())
}
