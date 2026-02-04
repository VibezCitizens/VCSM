import { ChristmasTheme } from "./themes/christmas";
import { DefaultTheme } from "./themes/default";

const seasons = [ChristmasTheme];

function isSeasonActive(season) {
  const now = new Date();

  const start = new Date(now.getFullYear(), season.start.month - 1, season.start.day);
  const end = new Date(now.getFullYear(), season.end.month - 1, season.end.day);

  if (season.start.month > season.end.month) {
    if (now >= start || now <= end) return true;
    return false;
  }

  return now >= start && now <= end;
}

export function getActiveSeasonTheme(position = "topRight") {
  for (const season of seasons) {
    if (isSeasonActive(season)) {
      return season.apply(position);
    }
  }
  return DefaultTheme.apply(position);
}
