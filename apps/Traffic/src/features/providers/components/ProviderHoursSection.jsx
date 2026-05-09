"use client";

import { useTrafficLanguage } from "@/lib/language";
import { translate } from "@/i18n";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const DAY_LABELS = {
  en: { monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri", saturday: "Sat", sunday: "Sun" },
  es: { monday: "Lun", tuesday: "Mar", wednesday: "Mié", thursday: "Jue", friday: "Vie", saturday: "Sáb", sunday: "Dom" }
};

function formatSchedule(schedule, lang) {
  if (!schedule) return "—";

  if (typeof schedule === "string") {
    return schedule.toLowerCase() === "closed"
      ? translate("common.closed", lang)
      : schedule;
  }

  if (schedule.closed === true) {
    return translate("common.closed", lang);
  }

  if (schedule.open && schedule.close) {
    return `${schedule.open} – ${schedule.close}`;
  }

  return "—";
}

export function ProviderHoursSection({ hours }) {
  const { lang, t } = useTrafficLanguage();

  if (!hours || typeof hours !== "object") return null;
  const labels = DAY_LABELS[lang] ?? DAY_LABELS.en;
  const isAlwaysOpen = hours.mode === "24_7";
  const rows = DAYS.map((day) => ({ day, schedule: hours[day] ?? null }));
  const hasAny = isAlwaysOpen || rows.some(({ schedule }) => schedule != null);
  if (!hasAny) return null;

  return (
    <section
      className="card card--subtle pro-hours"
      aria-label={t("providerProfile.businessHours")}
    >
      <h2 className="pro-section-title">{t("providerProfile.hours")}</h2>
      {isAlwaysOpen ? (
        <p className="pro-hours-note">{hours.label ?? t("common.open247")}</p>
      ) : null}
      <ul className="pro-hours-list">
        {rows.map(({ day, schedule }) => (
          <li key={day} className="pro-hours-row">
            <span className="pro-hours-day">{labels[day]}</span>
            <span className="pro-hours-time">
              {isAlwaysOpen ? t("common.open") : formatSchedule(schedule, lang)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
