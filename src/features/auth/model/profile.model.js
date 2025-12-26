export function ProfileModel(row) {
  if (!row) return null

  return {
    id: row.id,
    isDiscoverable: Boolean(row.discoverable),
  }
}
