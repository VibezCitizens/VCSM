import { readVportPublicTrazeProfileRows } from "@/data/dal/vportDataset.read.dal";
import { flattenVportPublicTrazeProfileRow } from "@/data/mappers/vportDataset.model";

export async function loadVportRows() {
  let rawRows;
  try {
    rawRows = await readVportPublicTrazeProfileRows();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[vportDataset] Unexpected error fetching VPORT rows:", err?.message ?? err);
    }
    return [];
  }

  if (!rawRows) return [];

  return rawRows.map(flattenVportPublicTrazeProfileRow);
}
