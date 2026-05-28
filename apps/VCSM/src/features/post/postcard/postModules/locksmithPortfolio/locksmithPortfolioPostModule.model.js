const JOB_TYPE_LABELS = {
  lockout: "Lockout",
  rekey: "Rekeying",
  lock_change: "Lock Change",
  new_install: "New Install",
  repair: "Repair",
  smart_lock: "Smart Lock",
  safe: "Safe",
  car_key: "Car Key Replacement",
  commercial_hardware: "Commercial Hardware",
  security_upgrade: "Security Upgrade",
};

export function parseLocksmithPortfolioPostModule(text, payload = null) {
  const rawText = text ?? "";
  const actorName =
    rawText.replace(/^New locksmith work added by\s*/i, "").split("\n")[0].trim() || null;

  if (payload !== null && ("portfolioTitle" in payload || "jobType" in payload)) {
    const jobTypeLabel = JOB_TYPE_LABELS[payload.jobType] ?? null;
    return {
      actorName,
      portfolioTitle: payload.portfolioTitle ?? null,
      jobTypeLabel,
    };
  }

  const portfolioTitle = rawText.split("\n\n").slice(1).join("\n\n").trim() || null;
  return { actorName, portfolioTitle, jobTypeLabel: null };
}
