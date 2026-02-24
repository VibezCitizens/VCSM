const SUPPORTED_LANGUAGE_META = {
  en: { label: "English", hint: "en-US" },
  es: { label: "Spanish", hint: "es-ES" },
  de: { label: "German", hint: "de-DE" },
  pt: { label: "Portuguese", hint: "pt-PT" },
  it: { label: "Italian", hint: "it-IT" },
};

const SUPPORTED_LANGUAGE_CODES = Object.freeze(Object.keys(SUPPORTED_LANGUAGE_META));

const WORD_PATTERNS = {
  en: /\b(the|and|is|are|to|of|in|for|with|that|this|you|your|was|were|be|have|not)\b/g,
  es: /\b(el|la|los|las|de|que|y|en|un|una|por|para|con|no|es|se|como|est[ao]s|pero)\b/g,
  de: /\b(der|die|das|und|ist|nicht|mit|ein|eine|ich|du|wir|sie|für|auf|den|dem|des|aber)\b/g,
  pt: /\b(o|a|os|as|de|que|e|em|um|uma|por|para|com|não|é|se|como|mas|você|vocês)\b/g,
  it: /\b(il|lo|la|gli|le|di|che|e|in|un|una|per|con|non|è|sei|come|ma|della|delle)\b/g,
};

const CHAR_PATTERNS = {
  en: /\b(wh|th|ing)\b/g,
  es: /[ñ¿¡áéíóúü]/g,
  de: /[äöüß]/g,
  pt: /[ãõâêôçàáéíóú]/g,
  it: /[àèéìíîòóù]/g,
};

function countMatches(input, pattern) {
  if (!input || !pattern) return 0;
  const matches = input.match(pattern);
  return matches ? matches.length : 0;
}

export function getSupportedLanguageLabel(code) {
  return SUPPORTED_LANGUAGE_META[code]?.label ?? "Unknown";
}

export function detectSupportedLanguageFromText(input) {
  const source = String(input ?? "").trim().toLowerCase();
  if (!source) return "unknown";

  const lettersOnly = source.replace(/[^a-zA-ZÀ-ÿ\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!lettersOnly) return "unknown";

  const words = lettersOnly.split(" ").filter(Boolean);
  if (words.length < 3 || lettersOnly.length < 18) return "unknown";

  const scores = new Map();
  for (const code of SUPPORTED_LANGUAGE_CODES) {
    const wordHits = countMatches(lettersOnly, WORD_PATTERNS[code]);
    const charHits = countMatches(source, CHAR_PATTERNS[code]);
    scores.set(code, (wordHits * 3) + (charHits * 1.25));
  }

  const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const [topCode, topScore] = ranked[0] ?? ["unknown", 0];
  const secondScore = ranked[1]?.[1] ?? 0;

  if (!topScore || topScore < 2.5) return "unknown";
  if ((topScore - secondScore) < 1.25) return "unknown";

  return topCode;
}

export { SUPPORTED_LANGUAGE_CODES, SUPPORTED_LANGUAGE_META };
