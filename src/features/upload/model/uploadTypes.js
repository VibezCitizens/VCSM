// Domain types for Upload Feature

export const MediaType = {
  TEXT: "text",
  IMAGE: "image",
  VIDEO: "video",
};

export const Visibility = {
  PUBLIC: "public",
  FOLLOWERS: "followers",
  PRIVATE: "private",
};

// Payload sent from UI → usecase
export function createInitialPostPayload() {
  return {
    caption: "",
    tags: [],
    visibility: Visibility.PUBLIC,
    mode: "post",      // post | 24drop | vdrop
    file: null,
    mediaType: MediaType.TEXT,
  };
}
