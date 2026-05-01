import { searchMentionSuggestions } from "@/features/upload/dal/searchMentionSuggestions.dal";

export async function ctrlSearchMentionSuggestions({ query, limit = 8 }) {
  if (!query) return [];
  return searchMentionSuggestions(query, { limit });
}
