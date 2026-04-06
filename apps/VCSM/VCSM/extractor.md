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
  "/__tests__/",
  "/test/",
  "/tests/",
  "/fixtures/",
  "/stories/",
  "/storybook/",
  "/mock/",
  "/mocks/",
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

const DIALOG_CALL_MATCHERS = new Set([
  "alert",
  "confirm",
  "prompt",
  "window.alert",
  "window.confirm",
  "window.prompt",
]);

const TOAST_CALL_PREFIXES = [
  "toast",
  "snackbar",
  "enqueueSnackbar",
  "showToast",
  "notify",
];

const I18N_CALL_NAMES = new Set([
  "t",
  "i18n.t",
  "intl.formatMessage",
  "formatMessage",
]);

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
  "tsx",
  "jsx",
  "json",
  "api",
  "sdk",
  "url",
  "uri",
  "src",
  "href",
]);

const MIN_ALPHA_NUMERIC_RATIO = 0.45;
const WORD_PATTERN = /[a-z0-9]+(?:'[a-z0-9]+)?/gi;
const MAX_PHRASE_LENGTH = 240;

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function toRelativePath(filePath) {
  return toPosixPath(path.relative(projectRoot, filePath));
}

function normalizeText(raw) {
  if (typeof raw !== "string") return "";
  return raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeForLookup(raw) {
  return normalizeText(raw).toLowerCase();
}

function objectPropertyName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "StringLiteral") return node.value;
  return null;
}

function getNodeLocation(node) {
  return {
    line: node?.loc?.start?.line ?? null,
    column: node?.loc?.start?.column ?? null,
  };
}

function getEnclosingComponentName(pathRef) {
  let current = pathRef;
  while (current) {
    if (
      current.isFunctionDeclaration?.() &&
      current.node.id?.name &&
      /^[A-Z]/.test(current.node.id.name)
    ) {
      return current.node.id.name;
    }

    if (
      current.isVariableDeclarator?.() &&
      current.node.id?.type === "Identifier" &&
      /^[A-Z]/.test(current.node.id.name)
    ) {
      return current.node.id.name;
    }

    if (
      current.isClassDeclaration?.() &&
      current.node.id?.name &&
      /^[A-Z]/.test(current.node.id.name)
    ) {
      return current.node.id.name;
    }

    current = current.parentPath;
  }
  return null;
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
      if (!FILE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;

      result.push(fullPath);
    }
  }

  return result;
}

function stringFromLiteralNode(node) {
  if (!node) return null;

  if (node.type === "StringLiteral") return node.value;

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis.map((q) => q.value.cooked ?? q.value.raw ?? "").join("");
  }

  return null;
}

function getCalleeName(node) {
  if (!node) return null;

  if (node.type === "Identifier") return node.name;

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

  if (node.type === "ThisExpression") return "this";
  if (node.type === "Super") return "super";

  return null;
}

function isDialogCall(name) {
  return DIALOG_CALL_MATCHERS.has(name);
}

function isToastCall(name) {
  if (!name) return false;
  return TOAST_CALL_PREFIXES.some((prefix) => name === prefix || name.startsWith(`${prefix}.`));
}

function isI18nCall(name) {
  return I18N_CALL_NAMES.has(name);
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
      "contents",
      "inherit",
      "initial",
      "unset",
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

function hasNaturalLanguageShape(text) {
  const compact = text.replace(/\s+/g, "");
  if (!compact) return false;

  const alphaNum = (compact.match(/[a-z0-9]/gi) || []).length;
  const ratio = alphaNum / compact.length;
  if (ratio < MIN_ALPHA_NUMERIC_RATIO) return false;

  if (!/[a-z]/i.test(text) && !/\d/.test(text)) return false;

  const words = text.match(WORD_PATTERN) || [];
  if (words.length === 0) return false;

  return true;
}

function shouldKeepPhrase(text) {
  const normalized = normalizeText(text);

  if (!normalized) return false;
  if (normalized.length > MAX_PHRASE_LENGTH) return false;
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

function extractStringFromExpression(expression, add, context = {}) {
  if (!expression) return;

  const direct = stringFromLiteralNode(expression);
  if (direct != null) {
    add(direct, "expression_literal", expression, context);
    return;
  }

  if (expression.type === "ConditionalExpression") {
    const consequent = stringFromLiteralNode(expression.consequent);
    const alternate = stringFromLiteralNode(expression.alternate);

    if (consequent != null) add(consequent, "fallback_literal", expression.consequent, context);
    if (alternate != null) add(alternate, "fallback_literal", expression.alternate, context);
    return;
  }

  if (expression.type === "LogicalExpression") {
    const leftValue = stringFromLiteralNode(expression.left);
    const rightValue = stringFromLiteralNode(expression.right);

    if (expression.operator === "&&" || expression.operator === "||" || expression.operator === "??") {
      if (leftValue != null) add(leftValue, "fallback_literal", expression.left, context);
      if (rightValue != null) add(rightValue, "fallback_literal", expression.right, context);
    }
    return;
  }

  if (expression.type === "CallExpression") {
    const calleeName = getCalleeName(expression.callee);
    if (isI18nCall(calleeName)) {
      const firstArg = expression.arguments?.[0];
      const directArg = stringFromLiteralNode(firstArg);

      if (directArg != null) {
        add(directArg, "i18n_literal", firstArg, context);
        return;
      }

      if (firstArg?.type === "ObjectExpression") {
        for (const prop of firstArg.properties) {
          if (prop.type !== "ObjectProperty" || prop.computed) continue;
          const keyName = objectPropertyName(prop.key);
          if (keyName === "defaultMessage" || keyName === "message") {
            const value = stringFromLiteralNode(prop.value);
            if (value != null) add(value, "i18n_literal", prop.value, context);
          }
        }
      }
    }
  }
}

function ensurePhraseEntry(map, normalizedText, rawText) {
  if (!map.has(normalizedText)) {
    map.set(normalizedText, {
      text: normalizeText(rawText),
      normalizedText,
      paths: new Set(),
      kinds: new Set(),
      components: new Set(),
      props: new Set(),
      occurrences: [],
      occurrenceCount: 0,
    });
  }
  return map.get(normalizedText);
}

function isInsideRenderedJsx(pathRef) {
  return Boolean(pathRef.findParent((p) => p.isJSXElement?.() || p.isJSXFragment?.()));
}

function isLikelyRenderedObjectProperty(pathRef) {
  return Boolean(
    pathRef.findParent((p) => p.isJSXExpressionContainer?.() || p.isArrayExpression?.() || p.isReturnStatement?.()),
  );
}

function addPhraseFactory({ phraseMap, seenOccurrenceKeys, stats, relativePath }) {
  return function addPhrase(rawText, kind, node, context = {}) {
    const text = normalizeText(rawText);
    if (!shouldKeepPhrase(text)) return;

    const normalizedText = normalizeForLookup(text);
    const start = node?.start ?? -1;
    const end = node?.end ?? -1;
    const occurrenceKey = `${relativePath}:${start}:${end}:${normalizedText}:${kind}`;

    if (seenOccurrenceKeys.has(occurrenceKey)) return;
    seenOccurrenceKeys.add(occurrenceKey);

    const entry = ensurePhraseEntry(phraseMap, normalizedText, text);
    entry.paths.add(relativePath);
    entry.kinds.add(kind);
    if (context.component) entry.components.add(context.component);
    if (context.prop) entry.props.add(context.prop);
    entry.occurrences.push({
      path: relativePath,
      line: node?.loc?.start?.line ?? null,
      column: node?.loc?.start?.column ?? null,
      kind,
      component: context.component ?? null,
      prop: context.prop ?? null,
    });
    entry.occurrenceCount += 1;
    stats.candidatesAccepted += 1;
  };
}

function scanFile(filePath, phraseMap, seenOccurrenceKeys, stats) {
  const relativePath = toRelativePath(filePath);
  const uiLikely = isUiLikelyPath(relativePath);

  stats.filesScanned += 1;
  if (!uiLikely) return;

  const fileContent = fs.readFileSync(filePath, "utf8");

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

  const addPhrase = addPhraseFactory({
    phraseMap,
    seenOccurrenceKeys,
    stats,
    relativePath,
  });

  traverse(ast, {
    JSXText(nodePath) {
      const text = normalizeText(nodePath.node.value);
      if (!text) return;

      addPhrase(text, "text_node", nodePath.node, {
        component: getEnclosingComponentName(nodePath),
        prop: "children",
      });
    },

    JSXAttribute(nodePath) {
      const attr = nodePath.node;
      if (!attr?.name) return;

      const attrName = objectPropertyName(attr.name)?.trim();
      if (!attrName) return;
      if (attrName.startsWith("aria-")) return;
      if (attrName.startsWith("data-")) return;
      if (!VISIBLE_PROP_NAMES.has(attrName)) return;
      if (!attr.value) return;

      const component = getEnclosingComponentName(nodePath);

      if (attr.value.type === "StringLiteral") {
        addPhrase(attr.value.value, "ui_prop_literal", attr.value, {
          component,
          prop: attrName,
        });
        return;
      }

      if (attr.value.type === "JSXExpressionContainer") {
        extractStringFromExpression(
          attr.value.expression,
          (value, kind, node) =>
            addPhrase(value, `ui_prop_${kind}`, node ?? attr.value.expression, {
              component,
              prop: attrName,
            }),
          { component, prop: attrName },
        );
      }
    },

    JSXExpressionContainer(nodePath) {
      if (!isInsideRenderedJsx(nodePath)) return;

      const expression = nodePath.node.expression;
      const component = getEnclosingComponentName(nodePath);

      extractStringFromExpression(
        expression,
        (value, kind, node) =>
          addPhrase(value, kind, node ?? expression, {
            component,
            prop: "children",
          }),
        { component, prop: "children" },
      );
    },

    CallExpression(nodePath) {
      const callNode = nodePath.node;
      const calleeName = getCalleeName(callNode.callee);
      const component = getEnclosingComponentName(nodePath);

      if (isI18nCall(calleeName) && isInsideRenderedJsx(nodePath)) {
        extractStringFromExpression(
          callNode,
          (value, kind, node) =>
            addPhrase(value, kind, node ?? callNode, {
              component,
              prop: "children",
            }),
          { component, prop: "children" },
        );
      }

      const dialogCall = isDialogCall(calleeName);
      const toastCall = isToastCall(calleeName);

      if (!dialogCall && !toastCall) return;

      const kindPrefix = dialogCall ? "dialog_message" : "toast_message";

      for (const arg of callNode.arguments || []) {
        const direct = stringFromLiteralNode(arg);
        if (direct != null) {
          addPhrase(direct, kindPrefix, arg, { component, prop: "message" });
          continue;
        }

        if (arg.type === "ObjectExpression") {
          for (const prop of arg.properties) {
            if (prop.type !== "ObjectProperty" || prop.computed) continue;
            const keyName = objectPropertyName(prop.key);
            if (!keyName || !VISIBLE_OBJECT_KEYS.has(keyName)) continue;

            const value = stringFromLiteralNode(prop.value);
            if (value != null) {
              addPhrase(value, `${kindPrefix}_object`, prop.value, {
                component,
                prop: keyName,
              });
            } else {
              extractStringFromExpression(
                prop.value,
                (found, childKind, node) =>
                  addPhrase(found, `${kindPrefix}_${childKind}`, node ?? prop.value, {
                    component,
                    prop: keyName,
                  }),
                { component, prop: keyName },
              );
            }
          }
        } else {
          extractStringFromExpression(
            arg,
            (found, childKind, node) =>
              addPhrase(found, `${kindPrefix}_${childKind}`, node ?? arg, {
                component,
                prop: "message",
              }),
            { component, prop: "message" },
          );
        }
      }
    },

    ObjectProperty(nodePath) {
      if (!isLikelyRenderedObjectProperty(nodePath)) return;

      const prop = nodePath.node;
      if (prop.computed) return;

      const keyName = objectPropertyName(prop.key);
      if (!keyName || !VISIBLE_OBJECT_KEYS.has(keyName)) return;

      const component = getEnclosingComponentName(nodePath);
      const value = stringFromLiteralNode(prop.value);

      if (value != null) {
        addPhrase(value, "object_visible_prop", prop.value, {
          component,
          prop: keyName,
        });
        return;
      }

      extractStringFromExpression(
        prop.value,
        (found, kind, node) =>
          addPhrase(found, `object_visible_${kind}`, node ?? prop.value, {
            component,
            prop: keyName,
          }),
        { component, prop: keyName },
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
          components: new Set(),
          occurrenceCount: 0,
        });
      }

      const entry = wordMap.get(word);
      for (const sourcePath of phrase.paths) entry.paths.add(sourcePath);
      for (const component of phrase.components || []) entry.components.add(component);
      entry.sourceTexts.add(phrase.text);
      entry.occurrenceCount += phrase.occurrenceCount;
    }
  }

  return Array.from(wordMap.values())
    .map((entry) => ({
      word: entry.word,
      paths: Array.from(entry.paths).sort(),
      pathCount: entry.paths.size,
      sourceTexts: Array.from(entry.sourceTexts).sort(),
      sourceTextCount: entry.sourceTexts.size,
      components: Array.from(entry.components).sort(),
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
      components: Array.from(entry.components).sort(),
      props: Array.from(entry.props).sort(),
      occurrences: entry.occurrences.sort((a, b) => {
        if (a.path !== b.path) return a.path.localeCompare(b.path);
        return (a.line ?? 0) - (b.line ?? 0);
      }),
      visible: true,
    }))
    .sort((a, b) => a.normalizedText.localeCompare(b.normalizedText));

  const repeatedPhraseEntries = phraseEntries.filter(
    (entry) => entry.pathCount > 1 || entry.occurrenceCount > 1,
  );

  const wordEntries = buildWordEntries(phraseEntries);
  const generatedAt = new Date().toISOString();

  const phrasesOutput = {
    generatedAt,
    sourceRoot: "src",
    contractVersion: "visible-ui-text-v1",
    extraction: [
      "jsx text nodes",
      "visible UI props",
      "dialog and toast/snackbar message literals",
      "visible fallback literals in JSX expressions",
      "visible object keys in likely rendered UI structures",
      "i18n wrapper literals rendered in JSX",
    ],
    filters: [
      "reject class/style/internal token shapes",
      "reject aria-* and data-* props",
      "reject CSS-like values and utility-class tokens",
      "reject camelCase/snake_case/kebab-case implementation identifiers",
      "keep only strings with natural language shape",
      "scan only likely UI files",
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
    derivedFrom: "src/features/language/ui-visible-phrases.json#phrases",
    summary: {
      phraseCount: phraseEntries.length,
      wordCount: wordEntries.length,
    },
    entries: wordEntries,
  };

  fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "ui-visible-phrases.json"),
    `${JSON.stringify(phrasesOutput, null, 2)}\n`,
    "utf8",
  );

  fs.writeFileSync(
    path.join(outputDir, "ui-visible-words.json"),
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