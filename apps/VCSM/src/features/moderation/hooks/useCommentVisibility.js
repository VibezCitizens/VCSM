import { useCallback } from "react";
import {
  expandHiddenRootsToDescendants,
  getHiddenCommentIdsForActor,
  hideCommentForActor,
  unhideCommentForActor,
} from "@/features/moderation/controllers/commentVisibility.controller";

export function useCommentVisibility() {
  const readHiddenCommentIds = useCallback(async (input) => {
    return getHiddenCommentIdsForActor(input);
  }, []);

  const hideComment = useCallback(async (input) => {
    return hideCommentForActor(input);
  }, []);

  const unhideComment = useCallback(async (input) => {
    return unhideCommentForActor(input);
  }, []);

  const expandHiddenIds = useCallback((tree, hiddenSet) => {
    return expandHiddenRootsToDescendants(tree, hiddenSet);
  }, []);

  return {
    getHiddenCommentIdsForActor: readHiddenCommentIds,
    hideCommentForActor: hideComment,
    unhideCommentForActor: unhideComment,
    expandHiddenRootsToDescendants: expandHiddenIds,
  };
}
