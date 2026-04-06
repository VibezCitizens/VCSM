const VALID_MEDIA_TYPES = new Set(["image", "video"]);

function normalizeMediaType(value) {
  const type = String(value ?? "").trim().toLowerCase();
  return VALID_MEDIA_TYPES.has(type) ? type : null;
}

function normalizeMediaArray(rawMedia) {
  const list = Array.isArray(rawMedia) ? rawMedia : [];

  const normalized = list
    .map((item, index) => {
      const type = normalizeMediaType(item?.type ?? item?.media_type);
      const url = String(item?.url ?? item?.media_url ?? "").trim();
      if (!type || !url) return null;

      const sortOrderRaw = item?.sortOrder ?? item?.sort_order ?? index;
      const sortOrder = Number.isFinite(Number(sortOrderRaw))
        ? Number(sortOrderRaw)
        : index;

      return {
        id: item?.id ?? null,
        type,
        url,
        sortOrder,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return normalized;
}

function normalizeLegacyMedia(row) {
  const url = String(row?.media_url ?? row?.mediaUrl ?? "").trim();
  if (!url) return [];

  const type = normalizeMediaType(row?.media_type ?? row?.mediaType) ?? "image";

  return [
    {
      id: null,
      type,
      url,
      sortOrder: 0,
    },
  ];
}

function normalizeMedia(row) {
  const multi = normalizeMediaArray(row?.media);
  return multi.length ? multi : normalizeLegacyMedia(row);
}

function toReactionCounts(reactions, roseCount) {
  const like = Number(reactions?.like ?? 0);
  const dislike = Number(reactions?.dislike ?? 0);
  const rose = Number(roseCount ?? 0);

  return {
    like: Number.isFinite(like) ? like : 0,
    dislike: Number.isFinite(dislike) ? dislike : 0,
    rose: Number.isFinite(rose) ? rose : 0,
  };
}

export function buildCanonicalProfilePostModel(
  row,
  { reactions = {}, roseCount = 0 } = {}
) {
  const media = normalizeMedia(row);
  const firstMedia = media[0] ?? null;

  const reactionsSafe = toReactionCounts(reactions, roseCount);
  const tags = Array.isArray(row?.tags) ? row.tags.filter(Boolean) : [];

  return {
    id: row?.id ?? null,

    actorId: row?.actor_id ?? row?.actorId ?? null,
    actor_id: row?.actor_id ?? row?.actorId ?? null,
    userId: row?.user_id ?? row?.userId ?? null,
    user_id: row?.user_id ?? row?.userId ?? null,

    text: row?.text ?? "",
    title: row?.title ?? null,
    postType: row?.post_type ?? row?.postType ?? null,
    post_type: row?.post_type ?? row?.postType ?? null,
    tags,

    createdAt: row?.created_at ?? row?.createdAt ?? null,
    created_at: row?.created_at ?? row?.createdAt ?? null,
    editedAt: row?.edited_at ?? row?.editedAt ?? null,
    edited_at: row?.edited_at ?? row?.editedAt ?? null,
    deleted_at: row?.deleted_at ?? null,
    deleted_by_actor_id: row?.deleted_by_actor_id ?? null,

    locationText: row?.location_text ?? row?.locationText ?? null,
    location_text: row?.location_text ?? row?.locationText ?? null,

    media,
    mediaUrl: firstMedia?.url ?? null,
    media_url: firstMedia?.url ?? null,
    mediaType: firstMedia?.type ?? null,
    media_type: firstMedia?.type ?? null,

    mentionMap: row?.mentionMap ?? {},

    reactions: reactionsSafe,
    likeCount: reactionsSafe.like,
    dislikeCount: reactionsSafe.dislike,
    roseCount: reactionsSafe.rose,
  };
}

