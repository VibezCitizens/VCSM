export function buildDashboardCards({ isDesktop, handlers }) {
  return [
    { key: "qr", title: "QR Code", body: "Open the QR screen for quick scanning and sharing.", onClick: handlers.openQr },
    {
      key: "flyer",
      title: "Printable Flyer",
      body: "Open a print-optimized flyer with your QR for your menu.",
      onClick: handlers.openFlyer,
      locked: !isDesktop,
    },
    {
      key: "flyer_edit",
      title: "Edit Flyer",
      body: "Update headline, note, accent color, hours, and images.",
      onClick: handlers.openFlyerEditor,
      locked: !isDesktop,
    },
    {
      key: "menu_preview",
      title: "Preview Online Menu",
      body: "Preview how your online menu looks to customers.",
      onClick: handlers.openOnlineMenuPreview,
    },
    {
      key: "exchange",
      title: "Exchange Rates",
      body: "View official exchange rates and last updated time.",
      onClick: handlers.openExchangeRates,
    },
    {
      key: "services",
      title: "Services",
      body: "Manage your services and add-ons shown on your profile.",
      onClick: handlers.openServices,
    },
    { key: "reviews", title: "Reviews", body: "View and manage your reviews and overall rating.", onClick: handlers.openReviews },
    {
      key: "gas",
      title: "Gas Prices",
      body: "Update official prices and review community suggestions.",
      onClick: handlers.openGasPrices,
    },
    {
      key: "ads",
      title: "Ads Pipeline",
      body: "Create, publish, pause, and preview VPORT ads from one place.",
      onClick: handlers.openAdsPipeline,
    },
    { key: "settings", title: "Settings", body: "Edit public details, hours, highlights, and more.", onClick: handlers.openSettings },
  ];
}
