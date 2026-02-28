import { VPORT_TYPE_GROUPS } from "@/features/profiles/kinds/vport/config/vportTypes.config";
import { isDashboardCardEnabled } from "@/shared/config/releaseFlags";

const DASHBOARD_VIEW_PRESETS = Object.freeze({
  default: {
    id: "default",
    label: "Default",
    cardKeys: Object.freeze([
      "qr",
      "flyer",
      "flyer_edit",
      "menu_preview",
      "reviews",
      "ads",
      "settings",
    ]),
  },
  service: {
    id: "service",
    label: "Service",
    cardKeys: Object.freeze(["qr", "services", "reviews", "ads", "settings"]),
  },
  food: {
    id: "food",
    label: "Food & Hospitality",
    cardKeys: Object.freeze([
      "qr",
      "flyer",
      "flyer_edit",
      "menu_preview",
      "services",
      "reviews",
      "ads",
      "settings",
    ]),
  },
  gas: {
    id: "gas",
    label: "Gas & Fuel",
    cardKeys: Object.freeze(["gas", "services", "reviews", "ads", "settings"]),
  },
  exchange: {
    id: "exchange",
    label: "Exchange",
    cardKeys: Object.freeze([
      "exchange",
      "services",
      "reviews",
      "ads",
      "settings",
    ]),
  },
});

const GROUP_TO_VIEW = Object.freeze({
  "Arts, Media & Entertainment": "default",
  "Beauty & Wellness": "service",
  "Education & Care": "service",
  "Food, Hospitality & Events": "food",
  "Health & Medical": "service",
  "Home, Maintenance & Trades": "service",
  "Professional & Business Services": "service",
  "Retail, Sales & Commerce": "default",
  "Sports & Fitness": "service",
  "Transport & Logistics": "service",
  "Gas & Fuel": "gas",
  "Animal Care": "service",
  Other: "default",
});

const TYPE_TO_VIEW = Object.freeze({
  "gas station": "gas",
  exchange: "exchange",
});

function withVisibleCardKeys(view) {
  const baseKeys = Array.isArray(view?.cardKeys) ? view.cardKeys : [];
  const visibleKeys = baseKeys.filter((key) => isDashboardCardEnabled(key));
  if (visibleKeys.length === baseKeys.length) return view;
  return {
    ...view,
    cardKeys: Object.freeze(visibleKeys),
  };
}

export function normalizeVportType(type) {
  if (!type) return "other";
  return String(type).trim().toLowerCase();
}

export function resolveVportTypeGroup(type) {
  const normalized = normalizeVportType(type);

  for (const [group, types] of Object.entries(VPORT_TYPE_GROUPS)) {
    if (Array.isArray(types) && types.includes(normalized)) {
      return group;
    }
  }

  return "Other";
}

export function getDashboardViewByVportType(type) {
  const normalized = normalizeVportType(type);
  const overrideViewId = TYPE_TO_VIEW[normalized];
  if (overrideViewId) return withVisibleCardKeys(DASHBOARD_VIEW_PRESETS[overrideViewId]);

  const group = resolveVportTypeGroup(normalized);
  const groupViewId = GROUP_TO_VIEW[group] ?? "default";
  return withVisibleCardKeys(DASHBOARD_VIEW_PRESETS[groupViewId] ?? DASHBOARD_VIEW_PRESETS.default);
}

export function getDashboardCardKeysByVportType(type) {
  const view = getDashboardViewByVportType(type);
  return view?.cardKeys ?? DASHBOARD_VIEW_PRESETS.default.cardKeys;
}
