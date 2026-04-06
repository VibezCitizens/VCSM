const SUBMISSION_FILE_COLUMNS = `
  id,
  submission_id,
  storage_path,
  original_name,
  mime_type,
  size_bytes,
  created_at
`;

export async function listSubmissionFilesBySubmissionIdDal({
  supabase,
  submissionId,
}) {
  if (!supabase) {
    throw new Error("listSubmissionFilesBySubmissionIdDal requires supabase");
  }

  if (!submissionId) {
    throw new Error("listSubmissionFilesBySubmissionIdDal requires submissionId");
  }

  const { data, error } = await supabase
    .schema("learning")
    .from("submission_files")
    .select(SUBMISSION_FILE_COLUMNS)
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export { SUBMISSION_FILE_COLUMNS };
export default listSubmissionFilesBySubmissionIdDal;