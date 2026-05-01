import { buildMotherDayPayload } from "./mothersDay.shared";
import { MothersDayPremiumForm } from "./mothersDayPremiumForm";
import { MothersDayPremiumPreview } from "./mothersDayPremiumPreview";

export const mothersDayPremiumTemplate = {
  id: "mothers_day_premium",
  cardType: "mothers_day",
  hideTemplatePicker: false,

  defaultData: {
    toName: "",
    fromName: "",
    title: "Happy Mother's Day",
    subtitle: "A beautiful day to celebrate the heart of the family.",
    message: "Thank you for your love, strength, and care. Today is for you. 💐",
    background: "midnight-bloom",
    palette: "amethyst-floral",
    sendAnonymously: false,

    imageFile: null,
    imageUrl: "",
    imageDataUrl: null,

    ctaType: "none",
    ctaLabel: "",
    ctaUrl: "",
    vportSlug: "",
    campaign: "mothers_day_2026",
  },

  toPayload(data) {
    return buildMotherDayPayload({
      data,
      templateKey: this.id,
      kind: "mothers_day",
      fallbackTitle: "Happy Mother's Day",
      fallbackBackground: "midnight-bloom",
      fallbackPalette: "amethyst-floral",
      fallbackCtaType: "none",
    });
  },

  Form: MothersDayPremiumForm,
  Preview: MothersDayPremiumPreview,
};
