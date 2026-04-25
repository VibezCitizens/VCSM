export const TEACHER_APPRECIATION_THEME = "teacher_appreciation";
export const TEACHER_APPRECIATION_CAMPAIGN = "teacher_appreciation_2026";

export const TA_BACKGROUND_OPTIONS = [
  { value: "warm-classroom", label: "Warm Classroom" },
  { value: "chalkboard", label: "Chalkboard" },
  { value: "soft-glow", label: "Soft Glow" },
];

export const TA_PALETTE_OPTIONS = [
  { value: "gold-purple", label: "Gold & Purple" },
  { value: "chalkboard-dark", label: "Chalkboard Dark" },
  { value: "amber-warm", label: "Amber Warm" },
];

export const TA_CTA_OPTIONS = [
  { value: "none", label: "No CTA" },
  { value: "visit_vport", label: "Visit VPORT" },
  { value: "message", label: "Message" },
];

export function safeTrim(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeSlug(value) {
  const base = safeTrim(value).toLowerCase();
  if (!base) return "";
  return base.replace(/[^a-z0-9-]/g, "");
}

export function normalizeCtaType(value, fallback = "none") {
  const raw = safeTrim(value).toLowerCase();
  if (raw === "visit_vport" || raw === "message" || raw === "none") return raw;
  return fallback;
}

export function defaultCtaLabel(type) {
  if (type === "visit_vport") return "View Offer";
  if (type === "message") return "Send Message";
  return "";
}

export function buildTeacherAppreciationCta({
  ctaType,
  ctaLabel,
  ctaUrl,
  vportSlug,
  fallbackType = "none",
} = {}) {
  const type = normalizeCtaType(ctaType, fallbackType);
  const slug = normalizeSlug(vportSlug);

  let url = safeTrim(ctaUrl);
  if (type === "visit_vport" && slug) {
    url = `/vport/${slug}/card`;
  }

  if (type === "none") {
    return { label: "", url: "", type: "none" };
  }

  const label = safeTrim(ctaLabel) || defaultCtaLabel(type);
  return { label, url, type };
}

export function buildSearchableTeacherMessage({ title, teacherName, subtitle, message } = {}) {
  return [
    safeTrim(title),
    teacherName ? `To ${teacherName}` : "",
    safeTrim(subtitle),
    safeTrim(message),
  ]
    .filter(Boolean)
    .join(" — ");
}

export function buildTeacherAppreciationPayload({
  data,
  templateKey,
  kind = "teacher_appreciation",
  fallbackTitle = "Thank You, Teacher",
  fallbackBackground = "warm-classroom",
  fallbackPalette = "gold-purple",
  fallbackCtaType = "none",
} = {}) {
  const sendAnonymously = !!data?.sendAnonymously;

  const title = safeTrim(data?.title) || fallbackTitle;
  const subtitle = safeTrim(data?.subtitle);
  const message = safeTrim(data?.message);
  const background = safeTrim(data?.background) || fallbackBackground;
  const palette = safeTrim(data?.palette) || fallbackPalette;

  const teacherName = safeTrim(data?.teacherName || data?.teacher_name);
  const studentName = safeTrim(data?.studentName || data?.student_name);
  const classroomName = safeTrim(data?.classroomName || data?.classroom_name);
  const schoolName = safeTrim(data?.schoolName || data?.school_name);

  const toName = teacherName || safeTrim(data?.toName);
  const fromName = sendAnonymously ? "" : safeTrim(data?.fromName);

  const imageUrl = safeTrim(data?.imageUrl || data?.hero_image_url);
  const imageDataUrl = safeTrim(data?.imageDataUrl || data?.image_data_url);
  const vportSlug = normalizeSlug(data?.vportSlug || data?.vport_slug);

  const cta = buildTeacherAppreciationCta({
    ctaType: data?.ctaType || data?.cta?.type,
    ctaLabel: data?.ctaLabel || data?.cta?.label,
    ctaUrl: data?.ctaUrl || data?.cta?.url,
    vportSlug,
    fallbackType: fallbackCtaType,
  });

  const messageText =
    buildSearchableTeacherMessage({ title, teacherName, subtitle, message }) || message || title;

  return {
    kind,
    toName,
    fromName,
    messageText,
    templateKey,
    isAnonymous: sendAnonymously,

    imageFile: data?.imageFile || null,
    imageUrl: imageUrl || null,
    imageDataUrl: imageDataUrl || null,

    customization: {
      theme: TEACHER_APPRECIATION_THEME,
      title,
      subtitle,
      message,

      teacher_name: teacherName || null,
      student_name: studentName || null,
      classroom_name: classroomName || null,
      school_name: schoolName || null,

      background,
      palette,

      hero_image_url: imageUrl || null,
      heroImageUrl: imageUrl || null,
      image_url: imageUrl || null,
      imageUrl: imageUrl || null,
      image_data_url: imageDataUrl || null,
      imageDataUrl: imageDataUrl || null,

      cta,
      vport_slug: vportSlug || null,
      vportSlug: vportSlug || null,
      campaign: TEACHER_APPRECIATION_CAMPAIGN,
    },
  };
}

export function resolveTeacherAppreciationPaletteClasses(palette) {
  const key = safeTrim(palette).toLowerCase();

  if (key === "chalkboard-dark") {
    return {
      shell: "bg-gradient-to-br from-[#111f12] via-[#182b1a] to-[#0d1a0e] border-green-700/40",
      badge: "bg-green-700/30 text-green-100 border-green-600/40",
      title: "text-green-50",
      subtitle: "text-green-200/75",
      body: "text-white/88",
    };
  }

  if (key === "amber-warm") {
    return {
      shell: "bg-gradient-to-br from-[#1f0f2e] via-[#2d1645] to-[#190c28] border-orange-300/30",
      badge: "bg-orange-500/20 text-orange-100 border-orange-300/35",
      title: "text-orange-50",
      subtitle: "text-orange-200/80",
      body: "text-white/90",
    };
  }

  // Default: gold-purple
  return {
    shell: "bg-gradient-to-br from-[#1a0f3a] via-[#241653] to-[#150c2e] border-amber-400/30",
    badge: "bg-amber-500/20 text-amber-100 border-amber-400/35",
    title: "text-amber-50",
    subtitle: "text-amber-200/80",
    body: "text-white/90",
  };
}
