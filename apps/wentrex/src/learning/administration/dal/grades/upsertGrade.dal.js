import { GRADE_COLUMNS } from "@/learning/administration/dal/grades/getGradeBySubmissionId.dal";

export async function upsertGradeDal({ supabase, existingGradeId, payload }) {
  if (!supabase) {
    throw new Error("upsertGradeDal requires supabase");
  }

  if (!payload) {
    throw new Error("upsertGradeDal requires payload");
  }

  const query = supabase.schema("learning").from("grades");

  if (existingGradeId) {
    const { data, error } = await query
      .update(payload)
      .eq("id", existingGradeId)
      .select(GRADE_COLUMNS)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ?? null;
  }

  const { data, error } = await query
    .insert(payload)
    .select(GRADE_COLUMNS)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export default upsertGradeDal;
