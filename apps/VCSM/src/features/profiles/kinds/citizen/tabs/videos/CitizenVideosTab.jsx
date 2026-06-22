import { useTranslation } from "@i18n";

export default function CitizenVideosTab() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center py-10 text-white/40">
      {t("profile.header.videosSoon")}
    </div>
  );
}
