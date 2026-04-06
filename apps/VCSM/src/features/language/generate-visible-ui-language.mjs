import fs from "node:fs";
import path from "node:path";
import { parse } from "@babel/parser";
import traverseModule from "@babel/traverse";

const traverse = traverseModule.default;
const projectRoot = process.cwd();
const srcRoot = path.join(projectRoot, "src");
const outputDir = path.join(srcRoot, "features", "language");

const FILE_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);
const UI_PATH_HINTS = [
  /[/\\]screen[/\\]/i,
  /[/\\]screens[/\\]/i,
  /[/\\]view[/\\]/i,
  /[/\\]views[/\\]/i,
  /[/\\]component[/\\]/i,
  /[/\\]components[/\\]/i,
  /[/\\]modal[/\\]/i,
  /[/\\]modals[/\\]/i,
  /[/\\]ui[/\\]/i,
  /[/\\]page[/\\]/i,
  /[/\\]pages[/\\]/i,
];

const EXCLUDED_PATH_SEGMENTS = [
  "/dal/",
  "/model/",
  "/models/",
  "/debug/",
  "/dev/",
  "/diagnostics/",
  "/scripts/",
  "/server/",
  "/migrations/",
];

const VISIBLE_PROP_NAMES = new Set([
  "placeholder",
  "title",
  "label",
  "alt",
  "helperText",
  "caption",
  "tooltip",
  "headerTitle",
  "buttonText",
  "emptyMessage",
  "errorMessage",
  "subtitle",
  "description",
  "text",
]);

const VISIBLE_OBJECT_KEYS = new Set([
  "label",
  "title",
  "caption",
  "tooltip",
  "placeholder",
  "helperText",
  "headerTitle",
  "buttonText",
  "emptyMessage",
  "errorMessage",
  "description",
  "subtitle",
  "message",
  "confirmText",
  "cancelText",
]);

const DIALOG_CALL_MATCHERS = [
  "alert",
  "confirm",
  "prompt",
  "window.alert",
  "window.confirm",
  "window.prompt",
];

const TOAST_CALL_PREFIXES = [
  "toast",
  "snackbar",
  "enqueueSnackbar",
  "showToast",
  "notify",
];

const TECHNICAL_TOKENS = new Set([
  "undefined",
  "null",
  "nan",
  "infinity",
  "true",
  "false",
  "classname",
  "style",
  "styles",
  "prop",
  "props",
  "state",
  "setstate",
  "onclick",
  "onchange",
  "oninput",
  "onblur",
  "onfocus",
  "innerheight",
  "innerwidth",
  "inputstyle",
  "includetags",
  "uid",
  "uuid",
  "actorid",
  "pathname",
  "queryparam",
  "localhost",
  "http",
  "https",
  "javascript",
  "typescript",
]);

const MIN_ALPHA_NUMERIC_RATIO = 0.3;
const WORD_PATTERN = /[a-z0-9]+(?:'[a-z0-9]+)?/gi;

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function toRelativePath(filePath) {
  return toPosixPath(path.relative(projectRoot, filePath));
}

function isUiLikelyPath(relativePath) {
  const normalized = relativePath.toLowerCase();
  if (EXCLUDED_PATH_SEGMENTS.some((segment) => normalized.includes(segment))) return false;
  if (normalized.includes("debug")) return false;
  const extension = path.extname(relativePath).toLowerCase();
  if (extension === ".jsx" || extension === ".tsx") return true;
  return UI_PATH_HINTS.some((matcher) => matcher.test(relativePath));
}

function listSourceFiles(rootDir) {
  const result = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!FILE_EXTENSIONS.has(path.extname(entry.name))) continue;
      result.push(fullPath);
    }
  }
  return result;
}

function normalizeText(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeForLookup(raw) {
  return normalizeText(raw).toLowerCase();
}

function stringFromLiteralNode(node) {
  if (!node) return null;
  if (node.type === "StringLiteral") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked ?? q.value.raw ?? "").join("");
  }
  return null;
}

function isTechnicalSingleToken(text) {
  if (!text || /\s/.test(text)) return false;
  const token = text.toLowerCase();
  if (token.length === 1 && /[a-z]/i.test(token)) return true;
  if (/^_+[a-z0-9_]+$/.test(token)) return true;
  if (token.startsWith("--")) return true;
  if (token.endsWith(":")) return true;
  if (TECHNICAL_TOKENS.has(token)) return true;
  if (/^[a-z]+[A-Z][a-zA-Z0-9]*$/.test(text)) return true;
  if (/^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(token)) return true;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(token)) return true;
  if (/^[A-Z0-9_]{5,}$/.test(text)) return true;
  if (/^[a-z0-9]{18,}$/.test(token) && !/[aeiou]/.test(token)) return true;
  return false;
}

function looksLikeCssValue(text) {
  const lower = text.toLowerCase();
  if (/^-?\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|%|deg|ms|s)?$/.test(lower)) return true;
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(lower)) return true;
  if (/^(rgb|rgba|hsl|hsla)\(/.test(lower)) return true;
  if (/^(var|calc|min|max|clamp)\(/.test(lower)) return true;
  if (/^[a-z-]+\s*:\s*[^ ]+$/.test(lower)) return true;
  if (
    [
      "inline-flex",
      "flex",
      "grid",
      "inline-grid",
      "block",
      "inline",
      "absolute",
      "relative",
      "fixed",
      "sticky",
      "ui-monospace",
    ].includes(lower)
  ) {
    return true;
  }
  return false;
}

function looksLikeClassList(text) {
  const tokens = text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  if (tokens.length < 2) return false;

  let classLike = 0;
  for (const token of tokens) {
    const lower = token.toLowerCase();
    const hasUtilityMarkers = /[:[\]#/]/.test(token);
    const kebabUtility = /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(lower);
    const cssUnitToken = /^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$/.test(lower);
    if (hasUtilityMarkers || kebabUtility || cssUnitToken) classLike += 1;
  }

  return classLike / tokens.length >= 0.7;
}

function hasNaturalLanguageShape(text) {
  const compact = text.replace(/\s+/g, "");
  if (!compact) return false;
  const alphaNum = (compact.match(/[a-z0-9]/gi) || []).length;
  const ratio = alphaNum / compact.length;
  if (ratio < MIN_ALPHA_NUMERIC_RATIO) return false;
  if (!/[a-z]/i.test(text) && !/\d/.test(text)) return false;
  return true;
}

function shouldKeepPhrase(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (normalized.length > 240) return false;
  if (normalized.startsWith("--")) return false;
  if (/[<>{}=]/.test(normalized)) return false;
  if (/[/\\]/.test(normalized) && !/\s/.test(normalized)) return false;
  if (looksLikeClassList(normalized)) return false;
  if (looksLikeCssValue(normalized)) return false;
  if (isTechnicalSingleToken(normalized)) return false;
  if (!hasNaturalLanguageShape(normalized)) return false;
  return true;
}

function shouldKeepWord(word) {
  if (!word) return false;
  const token = word.toLowerCase();
  if (token.length < 2) return false;
  if (/^\d+$/.test(token)) return false;
  if (TECHNICAL_TOKENS.has(token)) return false;
  if (isTechnicalSingleToken(token)) return false;
  return true;
}

function getCalleeName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "ThisExpression") return "this";
  if (node.type === "Super") return "super";
  if (node.type === "MemberExpression" || node.type === "OptionalMemberExpression") {
    const objectName = getCalleeName(node.object);
    let propertyName = null;
    if (!node.computed && node.property?.type === "Identifier") {
      propertyName = node.property.name;
    } else if (node.computed && node.property?.type === "StringLiteral") {
      propertyName = node.property.value;
    }
    if (objectName && propertyName) return `${objectName}.${propertyName}`;
    return propertyName || objectName || null;
  }
  return null;
}

function isDialogCall(name) {
  if (!name) return false;
  return DIALOG_CALL_MATCHERS.includes(name);
}

function isToastCall(name) {
  if (!name) return false;
  return TOAST_CALL_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));
}

function extractStringFromExpression(expression, add) {
  if (!expression) return;

  const direct = stringFromLiteralNode(expression);
  if (direct != null) {
    add(direct, "expression_literal", expression);
    return;
  }

  if (expression.type === "ConditionalExpression") {
    const consequent = stringFromLiteralNode(expression.consequent);
    const alternate = stringFromLiteralNode(expression.alternate);
    if (consequent != null) add(consequent, "fallback_literal", expression.consequent);
    if (alternate != null) add(alternate, "fallback_literal", expression.alternate);
    return;
  }

  if (expression.type === "LogicalExpression") {
    if (expression.operator === "||" || expression.operator === "??" || expression.operator === "&&") {
      const rightValue = stringFromLiteralNode(expression.right);
      if (rightValue != null) add(rightValue, "fallback_literal", expression.right);
    }
    return;
  }
}

function objectPropertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return null;
}

function ensurePhraseEntry(map, normalizedText, rawText) {
  if (!map.has(normalizedText)) {
    map.set(normalizedText, {
      text: normalizeText(rawText),
      normalizedText,
      paths: new Set(),
      kinds: new Set(),
      occurrenceCount: 0,
    });
  }
  return map.get(normalizedText);
}

function scanFile(filePath, phraseMap, seenOccurrenceKeys, stats) {
  const relativePath = toRelativePath(filePath);
  const fileContent = fs.readFileSync(filePath, "utf8");
  stats.filesScanned += 1;

  let ast;
  try {
    ast = parse(fileContent, {
      sourceType: "unambiguous",
      errorRecovery: true,
      plugins: [
        "jsx",
        "typescript",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "objectRestSpread",
        "dynamicImport",
        "optionalChaining",
        "nullishCoalescingOperator",
        "topLevelAwait",
        "decorators-legacy",
      ],
    });
    stats.filesParsed += 1;
  } catch (error) {
    stats.filesParseFailed += 1;
    stats.parseFailures.push({
      path: relativePath,
      reason: String(error?.message || "parse_failed"),
    });
    return;
  }

  const uiLikely = isUiLikelyPath(relativePath);
  let fileHasJsx = false;

  function addPhrase(rawText, kind, node) {
    const text = normalizeText(rawText);
    if (!shouldKeepPhrase(text)) return;
    const normalizedText = normalizeForLookup(text);
    const start = node?.start ?? -1;
    const end = node?.end ?? -1;
    const occurrenceKey = `${relativePath}:${start}:${end}:${normalizedText}`;
    if (seenOccurrenceKeys.has(occurrenceKey)) return;
    seenOccurrenceKeys.add(occurrenceKey);

    const entry = ensurePhraseEntry(phraseMap, normalizedText, text);
    entry.paths.add(relativePath);
    entry.kinds.add(kind);
    entry.occurrenceCount += 1;
    stats.candidatesAccepted += 1;
  }

  traverse(ast, {
    JSXElement() {
      fileHasJsx = true;
    },
    JSXFragment() {
      fileHasJsx = true;
    },
    JSXText(nodePath) {
      if (!uiLikely) return;
      const text = normalizeText(nodePath.node.value);
      if (!text) return;
      addPhrase(text, "text_node", nodePath.node);
    },
    JSXAttribute(nodePath) {
      if (!uiLikely) return;
      const attr = nodePath.node;
      if (!attr?.name) return;
      const attrName = objectPropertyName(attr.name)?.trim();
      if (!attrName) return;
      if (attrName.startsWith("aria-")) return;
      if (attrName.startsWith("data-")) return;
      if (!VISIBLE_PROP_NAMES.has(attrName)) return;

      if (!attr.value) return;
      if (attr.value.type === "StringLiteral") {
        addPhrase(attr.value.value, "ui_prop_literal", attr.value);
        return;
      }
      if (attr.value.type === "JSXExpressionContainer") {
        extractStringFromExpression(attr.value.expression, (value, kind, node) =>
          addPhrase(value, `ui_prop_${kind}`, node ?? attr.value.expression),
        );
      }
    },
    JSXExpressionContainer(nodePath) {
      if (!uiLikely) return;
      if (!fileHasJsx) return;
      if (nodePath.parentPath?.isJSXAttribute?.()) {
        const parentAttrName = objectPropertyName(nodePath.parentPath.node.name);
        if (!parentAttrName || !VISIBLE_PROP_NAMES.has(parentAttrName)) return;
      }
      const expression = nodePath.node.expression;
      extractStringFromExpression(expression, (value, kind, node) =>
        addPhrase(value, kind, node ?? expression),
      );
    },
    CallExpression(nodePath) {
      const callNode = nodePath.node;
      const calleeName = getCalleeName(callNode.callee);
      const dialogCall = isDialogCall(calleeName);
      const toastCall = isToastCall(calleeName);
      if (!dialogCall && !toastCall) return;

      const kindPrefix = dialogCall ? "dialog_message" : "toast_message";
      for (const arg of callNode.arguments || []) {
        const direct = stringFromLiteralNode(arg);
        if (direct != null) {
          addPhrase(direct, kindPrefix, arg);
          continue;
        }
        if (arg.type === "ObjectExpression") {
          for (const prop of arg.properties) {
            if (prop.type !== "ObjectProperty" || prop.computed) continue;
            const keyName = objectPropertyName(prop.key);
            if (!keyName || !VISIBLE_OBJECT_KEYS.has(keyName)) continue;
            const value = stringFromLiteralNode(prop.value);
            if (value != null) {
              addPhrase(value, `${kindPrefix}_object`, prop.value);
            } else {
              extractStringFromExpression(prop.value, (found, childKind, node) =>
                addPhrase(found, `${kindPrefix}_${childKind}`, node ?? prop.value),
              );
            }
          }
        } else {
          extractStringFromExpression(arg, (found, childKind, node) =>
            addPhrase(found, `${kindPrefix}_${childKind}`, node ?? arg),
          );
        }
      }
    },
    ObjectProperty(nodePath) {
      if (!uiLikely) return;
      if (!fileHasJsx) return;
      const prop = nodePath.node;
      if (prop.computed) return;
      const keyName = objectPropertyName(prop.key);
      if (!keyName || !VISIBLE_OBJECT_KEYS.has(keyName)) return;
      const value = stringFromLiteralNode(prop.value);
      if (value != null) {
        addPhrase(value, "object_visible_prop", prop.value);
        return;
      }
      extractStringFromExpression(prop.value, (found, kind, node) =>
        addPhrase(found, `object_visible_${kind}`, node ?? prop.value),
      );
    },
  });
}

function buildWordEntries(phraseEntries) {
  const wordMap = new Map();
  for (const phrase of phraseEntries) {
    const matches = phrase.normalizedText.match(WORD_PATTERN) || [];
    for (const token of matches) {
      const word = token.toLowerCase();
      if (!shouldKeepWord(word)) continue;
      if (!wordMap.has(word)) {
        wordMap.set(word, {
          word,
          paths: new Set(),
          sourceTexts: new Set(),
          sourceTextCount: 0,
          occurrenceCount: 0,
        });
      }
      const entry = wordMap.get(word);
      for (const sourcePath of phrase.paths) entry.paths.add(sourcePath);
      entry.sourceTexts.add(phrase.text);
      entry.sourceTextCount = entry.sourceTexts.size;
      entry.occurrenceCount += phrase.occurrenceCount;
    }
  }

  return Array.from(wordMap.values())
    .map((entry) => ({
      word: entry.word,
      paths: Array.from(entry.paths).sort(),
      pathCount: entry.paths.size,
      sourceTexts: Array.from(entry.sourceTexts).sort(),
      sourceTextCount: entry.sourceTextCount,
      occurrenceCount: entry.occurrenceCount,
      visible: true,
    }))
    .sort((a, b) => a.word.localeCompare(b.word));
}

function run() {
  const allFiles = listSourceFiles(srcRoot);
  const phraseMap = new Map();
  const seenOccurrenceKeys = new Set();
  const stats = {
    filesScanned: 0,
    filesParsed: 0,
    filesParseFailed: 0,
    candidatesAccepted: 0,
    parseFailures: [],
  };

  for (const filePath of allFiles) {
    scanFile(filePath, phraseMap, seenOccurrenceKeys, stats);
  }

  const phraseEntries = Array.from(phraseMap.values())
    .map((entry) => ({
      text: entry.text,
      normalizedText: entry.normalizedText,
      paths: Array.from(entry.paths).sort(),
      pathCount: entry.paths.size,
      occurrenceCount: entry.occurrenceCount,
      kind: entry.kinds.size === 1 ? Array.from(entry.kinds)[0] : "visible_text",
      kinds: Array.from(entry.kinds).sort(),
      visible: true,
    }))
    .sort((a, b) => a.normalizedText.localeCompare(b.normalizedText));

  const repeatedPhraseEntries = phraseEntries.filter((entry) => entry.pathCount > 1 || entry.occurrenceCount > 1);
  const wordEntries = buildWordEntries(phraseEntries);
  const generatedAt = new Date().toISOString();

  const phrasesOutput = {
    generatedAt,
    sourceRoot: "src",
    contractVersion: "visible-ui-text-v1",
    extraction: [
      "jsx text nodes",
      "ui-facing props: placeholder/title/label/alt/helperText/caption/tooltip/headerTitle/buttonText/emptyMessage/errorMessage",
      "dialog and toast/snackbar message literals",
      "visible fallback literals in JSX expressions",
      "visible text-like object keys in UI files",
    ],
    filters: [
      "reject class/style/internal token shapes",
      "reject aria-* and data-* props",
      "reject CSS-like values and utility-class tokens",
      "reject camelCase/snake_case/kebab-case implementation identifiers",
      "keep only strings with natural language shape",
    ],
    summary: {
      filesScanned: stats.filesScanned,
      filesParsed: stats.filesParsed,
      filesParseFailed: stats.filesParseFailed,
      candidateOccurrencesAccepted: stats.candidatesAccepted,
      phraseCount: phraseEntries.length,
      repeatedPhraseCount: repeatedPhraseEntries.length,
      wordCount: wordEntries.length,
    },
    parseFailures: stats.parseFailures,
    phrases: phraseEntries,
    repeatedPhrases: repeatedPhraseEntries,
  };

  const wordsOutput = {
    generatedAt,
    sourceRoot: "src",
    contractVersion: "visible-ui-text-v1",
    derivedFrom: "src/features/language/repeated-code-with-paths.json#phrases",
    summary: {
      phraseCount: phraseEntries.length,
      wordCount: wordEntries.length,
    },
    entries: wordEntries,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, "repeated-code-with-paths.json"),
    `${JSON.stringify(phrasesOutput, null, 2)}\n`,
    "utf8",
  );
  fs.writeFileSync(
    path.join(outputDir, "screen-words-with-paths.json"),
    `${JSON.stringify(wordsOutput, null, 2)}\n`,
    "utf8",
  );

  const summary = [
    `generatedAt=${generatedAt}`,
    `filesScanned=${stats.filesScanned}`,
    `filesParsed=${stats.filesParsed}`,
    `parseFailed=${stats.filesParseFailed}`,
    `phrases=${phraseEntries.length}`,
    `repeatedPhrases=${repeatedPhraseEntries.length}`,
    `words=${wordEntries.length}`,
  ];
  console.log(summary.join(" "));
}

run();
