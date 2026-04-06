export function ProfileSearchResultModel(row) {
  return {
    kind: 'user',
    id: row.id,
    display_name: row.display_name,
    username: row.username,
    photo_url: row.photo_url,
  }
}
