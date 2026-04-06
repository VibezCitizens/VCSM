import { useCallback } from "react";
import { publishWandersFromBuilder } from "@/features/wanders/core/controllers/publishWandersFromBuilder.controller";

export function usePublishWandersFromBuilder() {
  return useCallback(async ({ realmId, baseUrl, payload }) => {
    return publishWandersFromBuilder({
      realmId,
      baseUrl,
      payload,
    });
  }, []);
}
