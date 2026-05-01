import { buildTeacherAppreciationPayload } from "./teacherAppreciation.shared";
import { TeacherAppreciationPremiumForm } from "./teacherAppreciationPremiumForm";
import { TeacherAppreciationPremiumPreview } from "./teacherAppreciationPremiumPreview";

export const teacherAppreciationPremiumTemplate = {
  id: "teacher_appreciation_premium",
  cardType: "teacher_appreciation",
  hideTemplatePicker: false,

  defaultData: {
    teacherName: "",
    studentName: "",
    classroomName: "",
    schoolName: "",
    fromName: "",
    title: "Thank You for Everything",
    subtitle: "Your impact reaches far beyond the classroom.",
    message:
      "Teaching is one of the most powerful professions in the world. Thank you for showing up every day with heart.",
    background: "soft-glow",
    palette: "gold-purple",
    sendAnonymously: false,

    imageFile: null,
    imageUrl: "",
    imageDataUrl: null,

    ctaType: "none",
    ctaLabel: "",
    ctaUrl: "",
    vportSlug: "",
    campaign: "teacher_appreciation_2026",
  },

  toPayload(data) {
    return buildTeacherAppreciationPayload({
      data,
      templateKey: this.id,
      kind: "teacher_appreciation",
      fallbackTitle: "Thank You for Everything",
      fallbackBackground: "soft-glow",
      fallbackPalette: "gold-purple",
      fallbackCtaType: "none",
    });
  },

  Form: TeacherAppreciationPremiumForm,
  Preview: TeacherAppreciationPremiumPreview,
};
