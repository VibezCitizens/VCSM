import { getDashboardCardKeysByVportType } from "@/features/dashboard/vport/screens/model/dashboardViewByVportType.model";

const CARD_CATALOG = Object.freeze({
  qr: {
    key: "qr",
    title: "QR Code",
    body: "Open the QR screen for quick scanning and sharing.",
    handlerKey: "openQr",
  },
  flyer: {
    key: "flyer",
    title: "Printable Flyer",
    body: "Open a print-optimized flyer with your QR for your menu.",
    handlerKey: "openFlyer",
    getLocked: ({ isDesktop }) => !isDesktop,
  },
  flyer_edit: {
    key: "flyer_edit",
    title: "Edit Flyer",
    body: "Update headline, note, accent color, hours, and images.",
    handlerKey: "openFlyerEditor",
    getLocked: ({ isDesktop }) => !isDesktop,
  },
  menu_preview: {
    key: "menu_preview",
    title: "Preview Online Menu",
    body: "Preview how your online menu looks to customers.",
    handlerKey: "openOnlineMenuPreview",
  },
  exchange: {
    key: "exchange",
    title: "Exchange Rates",
    body: "View official exchange rates and last updated time.",
    handlerKey: "openExchangeRates",
  },
  services: {
    key: "services",
    title: "Services",
    body: "Manage your services and add-ons shown on your profile.",
    handlerKey: "openServices",
  },
  reviews: {
    key: "reviews",
    title: "Reviews",
    body: "View and manage your reviews and overall rating.",
    handlerKey: "openReviews",
  },
  gas: {
    key: "gas",
    title: "Gas Prices",
    body: "Update official prices and review community suggestions.",
    handlerKey: "openGasPrices",
  },
  ads: {
    key: "ads",
    title: "Ads Pipeline",
    body: "Create, publish, pause, and preview VPORT ads from one place.",
    handlerKey: "openAdsPipeline",
  },
  settings: {
    key: "settings",
    title: "Settings",
    body: "Edit public details, hours, highlights, and more.",
    handlerKey: "openSettings",
  },
});

export function getDashboardCardMetaByKey(key) {
  return CARD_CATALOG[key] ?? null;
}

export function buildDashboardCards({ isDesktop, handlers, vportType }) {
  const resolvedHandlers = handlers || {};
  const keys = getDashboardCardKeysByVportType(vportType);

  return keys
    .map((key) => {
      const meta = getDashboardCardMetaByKey(key);
      if (!meta) return null;

      const onClick = resolvedHandlers[meta.handlerKey];
      const locked = meta.getLocked?.({ isDesktop }) ?? false;

      return {
        key: meta.key,
        title: meta.title,
        body: meta.body,
        onClick: typeof onClick === "function" ? onClick : undefined,
        locked,
      };
    })
    .filter(Boolean);
}
