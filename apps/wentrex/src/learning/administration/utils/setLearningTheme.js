export function setLearningTheme({
  primaryColor,
  primaryForeground = "#ffffff",
  backgroundColor = "#ffffff",
  textColor = "#000000",
}) {
  const root = document.documentElement;

  if (primaryColor) {
    root.style.setProperty("--learning-primary", primaryColor);
  }

  if (primaryForeground) {
    root.style.setProperty("--learning-primary-foreground", primaryForeground);
  }

  if (backgroundColor) {
    root.style.setProperty("--learning-bg", backgroundColor);
  }

  if (textColor) {
    root.style.setProperty("--learning-text", textColor);
  }
}

export function resetLearningTheme() {
  const root = document.documentElement;

  root.style.setProperty("--learning-bg", "#ffffff");
  root.style.setProperty("--learning-text", "#000000");
  root.style.setProperty("--learning-primary", "#000000");
  root.style.setProperty("--learning-primary-foreground", "#ffffff");
}