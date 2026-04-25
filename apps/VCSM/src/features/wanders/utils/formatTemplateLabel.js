const ROOT_LABELS = [
  { key: "mothers_day", label: "Mother’s Day" },
  { key: "teacher_appreciation", label: "Teacher Appreciation" },
  { key: "teachers_day", label: "Teacher Appreciation" },
  { key: "business", label: "Business" },
];

const TRAILING_VARIANT_SEGMENTS = new Set([
  "basic",
  "premium",
  "vport",
  "template",
]);

const SEGMENT_LABEL_OVERRIDES = {
  cta: "CTA",
  vport: "",
};

function toNormalizedSegments(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .split("_")
    .filter(Boolean);
}

function toTitleCaseSegment(segment) {
  if (!segment) return "";
  if (SEGMENT_LABEL_OVERRIDES[segment] !== undefined) {
    return SEGMENT_LABEL_OVERRIDES[segment];
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function stripTrailingVariants(segments) {
  const next = [...segments];
  while (next.length > 0 && TRAILING_VARIANT_SEGMENTS.has(next[next.length - 1])) {
    next.pop();
  }
  return next;
}

export function formatTemplateLabel(key) {
  if (!key) return "";

  const segments = toNormalizedSegments(key);
  if (!segments.length) return "";

  const root = ROOT_LABELS.find(({ key: rootKey }) => {
    const rootSegments = toNormalizedSegments(rootKey);
    if (rootSegments.length > segments.length) return false;
    return rootSegments.every((seg, idx) => seg === segments[idx]);
  });

  if (root) {
    const rootSegments = toNormalizedSegments(root.key);
    const remainder = stripTrailingVariants(segments.slice(rootSegments.length)).filter(
      (segment) => segment !== "vport"
    );
    if (!remainder.length) return root.label;

    const restLabel = remainder.map(toTitleCaseSegment).filter(Boolean).join(" ");
    return restLabel ? `${root.label} ${restLabel}` : root.label;
  }

  const fallbackSegments = stripTrailingVariants(segments).filter(
    (segment) => segment !== "vport"
  );
  const label = fallbackSegments.map(toTitleCaseSegment).filter(Boolean).join(" ");
  return label || String(key).trim();
}

export default formatTemplateLabel;
