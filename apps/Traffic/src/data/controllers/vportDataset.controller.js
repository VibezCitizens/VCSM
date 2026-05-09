import { readPublicTrazeProviderIndexRows } from "@/data/dal/vportDataset.read.dal";

export async function loadVportRows(options = {}) {
  let rawRows;
  try {
    rawRows = await readPublicTrazeProviderIndexRows(options);
  } catch (err) {
    console.error("[vportDataset] Unexpected error fetching provider index rows:", err?.message ?? err);
    return [];
  }

  if (!rawRows) return [];

  return rawRows;
}
