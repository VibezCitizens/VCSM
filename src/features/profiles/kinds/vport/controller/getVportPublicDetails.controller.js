// src/features/profiles/kinds/vport/controller/getVportPublicDetails.controller.js

import { fetchVportPublicDetailsByActorId } from '@/features/profiles/dal/vportPublicDetails.read.dal'
import { readVportTypeDAL } from '@/features/profiles/dal/readVportType.dal'
import { mapVportPublicDetailsModel } from '@/features/profiles/kinds/vport/model/mapVportPublicDetails.model'

export async function getVportPublicDetailsController(actorId) {
  if (!actorId) return null

  const [raw, vportTypeRow] = await Promise.all([
    fetchVportPublicDetailsByActorId(actorId),
    readVportTypeDAL(actorId),
  ])

  const out = mapVportPublicDetailsModel(raw, vportTypeRow)

  // ✅ DEBUG (dev only)
  const dev =
    typeof process !== "undefined"
      ? process.env.NODE_ENV !== "production"
      : true

  if (dev) {
    console.groupCollapsed("[VPORT PUBLIC DETAILS] hydrate probe")
    console.log("actorId:", actorId)
    console.log("raw:", raw)
    console.log("vportTypeRow:", vportTypeRow)
    console.log("mapped:", out)

    // important fields check (this will tell you why names vanish)
    console.table([{
      actorId,
      raw_vport_id: raw?.vport_id ?? raw?.vportId ?? null,
      raw_name: raw?.name ?? null,
      raw_slug: raw?.slug ?? null,
      mapped_vportId: out?.vportId ?? out?.vport_id ?? null,
      mapped_name: out?.name ?? out?.vportName ?? out?.vport_name ?? null,
      mapped_slug: out?.slug ?? out?.vportSlug ?? out?.vport_slug ?? null,
      mapped_avatar: out?.avatarUrl ?? out?.avatar_url ?? out?.vportAvatarUrl ?? out?.vport_avatar_url ?? null,
    }])
    console.groupEnd()
  }

  return out
}