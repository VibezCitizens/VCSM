// src/features/wanders/components/cardstemplates/photo/photo.basic.js
import PhotoCardForm from "./PhotoCard.form";
import PhotoCardPreview from "./PhotoCard.preview";

export const photoBasicTemplate = {
  id: "photo.basic",
  hideTemplatePicker: true,
  defaultData: {
    title: "",
    message: "",
    imageFile: null,
    imageDataUrl: null,
    imageUrl: "",
  },
  Form: PhotoCardForm,
  Preview: PhotoCardPreview,

  toPayload: (data) => {
    const title = String(data?.title || "").trim();
    const message = String(data?.message || "").trim();

    const imageUrl = String(data?.imageUrl || "").trim();
    const imageDataUrl = data?.imageDataUrl || null;

    return {
      // searchable text (goes into cards.message_text)
      messageText: message,

      // upload input (controller can upload to R2)
      imageFile: data?.imageFile || null,

      // preview-only (draft)
      imageDataUrl,

      // persisted fields (go into cards.customization json)
      customization: {
        title,
        message,

        // store BOTH so old/new code works
        imageUrl: imageUrl || null,
        image_url: imageUrl || null,

        // optional (usually null after upload)
        imageDataUrl,
        image_data_url: imageDataUrl,
      },
    };
  },
};
