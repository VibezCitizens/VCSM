import { toDateKey } from "@/features/wanderex/model/wanderexPublic.model";

export const STEP_KEYS = Object.freeze([
  "service",
  "barber",
  "time",
  "details",
  "confirm",
]);

export function clampStep(value) {
  return Math.max(0, Math.min(STEP_KEYS.length - 1, value));
}

export function createDefaultDateOrder(days = 14) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return {
      key: toDateKey(date),
      date,
    };
  });
}
