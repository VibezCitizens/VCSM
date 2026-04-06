import { useCallback } from "react";
import {
  getHiddenPostIdsForActor,
  hidePostForActor,
  unhidePostForActor,
} from "@/features/moderation/controllers/postVisibility.controller";

export function usePostVisibility() {
  const readHiddenPostIds = useCallback(async (input) => {
    return getHiddenPostIdsForActor(input);
  }, []);

  const hidePost = useCallback(async (input) => {
    return hidePostForActor(input);
  }, []);

  const unhidePost = useCallback(async (input) => {
    return unhidePostForActor(input);
  }, []);

  return {
    getHiddenPostIdsForActor: readHiddenPostIds,
    hidePostForActor: hidePost,
    unhidePostForActor: unhidePost,
  };
}
