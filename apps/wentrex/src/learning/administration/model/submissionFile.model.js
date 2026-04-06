export function mapSubmissionFile(row) {
  if (!row) return null;

  return {
    id: row.id,
    submissionId: row.submission_id,
    storagePath: row.storage_path,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: row.created_at,
  };
}

export function mapSubmissionFiles(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(mapSubmissionFile);
}

export default mapSubmissionFile;