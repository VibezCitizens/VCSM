function createScannerState() {
  return {
    inBlockComment: false,
    inSingleQuote: false,
    inDoubleQuote: false,
    inTemplate: false,
  };
}

function scanLineHasCode(line, state) {
  const text = String(line ?? "");
  let hasCode = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1] ?? "";

    if (state.inBlockComment) {
      if (ch === "*" && next === "/") {
        state.inBlockComment = false;
        i += 1;
      }
      continue;
    }

    if (state.inSingleQuote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === "'") {
        state.inSingleQuote = false;
      }
      continue;
    }

    if (state.inDoubleQuote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === '"') {
        state.inDoubleQuote = false;
      }
      continue;
    }

    if (state.inTemplate) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === "`") {
        state.inTemplate = false;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      break;
    }

    if (ch === "/" && next === "*") {
      state.inBlockComment = true;
      i += 1;
      continue;
    }

    if (ch === "'") {
      state.inSingleQuote = true;
      continue;
    }

    if (ch === '"') {
      state.inDoubleQuote = true;
      continue;
    }

    if (ch === "`") {
      state.inTemplate = true;
      continue;
    }

    if (ch.trim().length > 0) {
      hasCode = true;
    }
  }

  return hasCode;
}

export function countCodeLines(source) {
  const lines = String(source ?? "").split(/\r?\n/);
  const state = createScannerState();
  let count = 0;

  for (const line of lines) {
    if (scanLineHasCode(line, state)) {
      count += 1;
    }
  }

  return count;
}
