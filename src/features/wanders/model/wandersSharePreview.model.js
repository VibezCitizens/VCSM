export function buildWandersDraftPayload(card) {
  if (!card) return null;

  const customization =
    card?.customization ?? card?.payload?.customization ?? card?.meta?.customization ?? {};

  const templateKey =
    card?.template_key ??
    card?.templateKey ??
    card?.payload?.template_key ??
    card?.payload?.templateKey ??
    customization?.template_key ??
    customization?.templateKey ??
    "";

  const imageUrl =
    card?.imageUrl ??
    card?.image_url ??
    card?.payload?.imageUrl ??
    card?.payload?.image_url ??
    customization?.imageUrl ??
    customization?.image_url ??
    "";

  const imageDataUrl =
    card?.imageDataUrl ??
    card?.image_data_url ??
    card?.payload?.imageDataUrl ??
    card?.payload?.image_data_url ??
    customization?.imageDataUrl ??
    customization?.image_data_url ??
    "";

  const title = card?.title ?? card?.payload?.title ?? customization?.title ?? "";
  const message =
    card?.message ??
    card?.message_text ??
    card?.payload?.message ??
    card?.payload?.messageText ??
    card?.payload?.message_text ??
    customization?.message ??
    "";

  return {
    ...card,
    templateKey,
    template_key: templateKey,
    title,
    message,
    imageUrl,
    imageDataUrl,
    customization: {
      ...(customization || {}),
      imageUrl,
      imageDataUrl,
      title,
      message,
    },
  };
}

