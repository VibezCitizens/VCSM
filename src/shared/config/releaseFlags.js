function parseOptionalBoolean(value, fallback) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return fallback;
}

const defaultDisabled = false;

export const releaseFlags = Object.freeze({
  professionalWorkspace: parseOptionalBoolean(
    import.meta.env.VITE_ENABLE_PROFESSIONAL_WORKSPACE,
    defaultDisabled
  ),
  vportPrintableFlyer: parseOptionalBoolean(
    import.meta.env.VITE_ENABLE_VPORT_PRINTABLE_FLYER,
    defaultDisabled
  ),
  vportFlyerEditor: parseOptionalBoolean(
    import.meta.env.VITE_ENABLE_VPORT_FLYER_EDITOR,
    defaultDisabled
  ),
  vportAdsPipeline: parseOptionalBoolean(
    import.meta.env.VITE_ENABLE_VPORT_ADS_PIPELINE,
    defaultDisabled
  ),
});

export function isDashboardCardEnabled(key) {
  if (key === "flyer") return releaseFlags.vportPrintableFlyer;
  if (key === "flyer_edit") return releaseFlags.vportFlyerEditor;
  if (key === "ads") return releaseFlags.vportAdsPipeline;
  return true;
}
