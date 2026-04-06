import {
  readActorSelectedVibeTagKeysDAL,
  readVibeTagCatalogByKeysDAL,
} from '@/features/profiles/dal/tags/readActorVibeTags.dal'
import { buildActorVibeTagsModel } from '@/features/profiles/screens/views/tabs/tags/model/actorVibeTags.model'

export async function getActorVibeTagsController({ actorId }) {
  if (!actorId) {
    return {
      ok: false,
      error: { message: 'Missing actorId' },
      data: { tags: [] },
    }
  }

  const selectedRows = await readActorSelectedVibeTagKeysDAL(actorId)
  const selectedKeys = selectedRows.map((row) => row?.vibe_tag_key).filter(Boolean)
  const tagRows = await readVibeTagCatalogByKeysDAL(selectedKeys)
  const tags = buildActorVibeTagsModel({ selectedRows, tagRows })

  return {
    ok: true,
    error: null,
    data: { tags },
  }
}
