// src/features/profiles/model/VportTypeModel.js

import { isValidVportType } from "@/features/profiles/kinds/vport/config/vportTypes.config";

export function toVportType(row) {
  // DAL returns { vport_type } at top-level
  // keep compatibility with nested shape
  const raw =
    (row?.vport_type ?? row?.vport?.vport_type ?? null)?.toString().toLowerCase().trim() ??
    null;

  if (!raw) return "other";

  // use your config as the source of truth
  if (isValidVportType(raw)) return raw;

  // safe fallback
  return "other";
}
