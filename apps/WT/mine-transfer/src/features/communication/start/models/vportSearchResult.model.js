export function VportSearchResultModel(row) {
  return {
    kind: 'vport',
    id: row.id,
    display_name: row.name,
    username: row.slug,
    photo_url: row.avatar_url,
  }
}
