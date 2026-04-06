// src/features/profiles/kinds/vport/controller/review/VportServiceReviews.controller.js

import { readVportServicesByActor } from "@/features/profiles/kinds/vport/dal/services/readVportServicesByActor";
import { ctrlListReviews } from "@/features/profiles/kinds/vport/controller/review/VportReviews.controller";

function assertActorId(id, label) {
  if (!id || typeof id !== "string") {
    throw new Error(`[VportServiceReviews] missing ${label}`);
  }
}

function normalizeServiceRow(row) {
  return {
    id: row?.id ?? null,
    serviceId: row?.id ?? null,
    key: row?.key ?? null,
    name: row?.label ?? row?.name ?? row?.key ?? null,
    label: row?.label ?? row?.name ?? row?.key ?? null,
  };
}

/**
 * Returns selectable services for the Reviews service-tab.
 */
export async function ctrlListReviewServices(targetActorId) {
  assertActorId(targetActorId, "targetActorId");

  const rows = await readVportServicesByActor({
    actorId: targetActorId,
    includeDisabled: false,
  });

  return (Array.isArray(rows) ? rows : [])
    .map(normalizeServiceRow)
    .filter((row) => row.id && row.name);
}

// Legacy alias used in hook
export const ctrlListServicesForReviews = ctrlListReviewServices;

/**
 * Service-specific review list.
 *
 * Current review schema does not have a strict service FK, so when no service key
 * exists in rows we fall back to all rows instead of hiding reviews.
 */
export async function ctrlListServiceReviews({ targetActorId, serviceId, limit = 50 } = {}) {
  assertActorId(targetActorId, "targetActorId");

  if (!serviceId) return [];

  const rows = await ctrlListReviews(targetActorId, limit);
  const list = Array.isArray(rows) ? rows : [];

  const hasServiceBinding = list.some((r) => r?.serviceId || r?.service_id);
  if (!hasServiceBinding) return list;

  const sid = String(serviceId);
  return list.filter((r) => String(r?.serviceId ?? r?.service_id ?? "") === sid);
}

// Legacy alias used in hook
export const ctrlListReviewsForService = ctrlListServiceReviews;
