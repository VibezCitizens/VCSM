import { readText, relativePath } from "./fs.js";
import { classifyPath, layerFromPath } from "./ownership.js";
import { parseSourceAst } from "../parsers/ast/parser.js";
import { extractImportsFromAst } from "../parsers/ast/importExtractor.js";
import { extractRoutesFromAst } from "../parsers/ast/routeExtractor.js";
import { extractTestsFromAst } from "../parsers/ast/testExtractor.js";
import { extractWritesFromAst } from "../parsers/ast/writeExtractor.js";
import { extractCallsFromAst } from "../parsers/ast/callExtractor.js";
import { extractReexportsFromAst } from "../parsers/ast/reexportExtractor.js";
import { extractScreensFromAst } from "../parsers/ast/screenExtractor.js";

export async function createSourceRecords(config, sourceFiles) {
  return Promise.all(sourceFiles.map(async (filePath) => {
    const source = await readText(filePath);
    const relative = relativePath(config.repoRoot, filePath);
    const owner = classifyPath(relative);
    const { ast, parseError } = parseSourceAst(source, filePath);
    const astData = ast ? {
      imports: extractImportsFromAst(ast),
      routes: extractRoutesFromAst(ast),
      tests: extractTestsFromAst(ast),
      writes: extractWritesFromAst(ast),
      callSymbols: extractCallsFromAst(ast),
      reexports: extractReexportsFromAst(ast),
      screens: extractScreensFromAst(ast),
    } : {
      imports: [],
      routes: [],
      tests: [],
      writes: { writes: [], rpcs: [], edgeCalls: [] },
      callSymbols: { declarations: [], imports: [], calls: [] },
      reexports: [],
      screens: [],
    };

    return {
      filePath,
      relative,
      appId: owner.appId,
      root: owner.root,
      feature: owner.feature,
      owner: owner.owner,
      layer: layerFromPath(relative),
      source,
      ast,
      parseError,
      ...astData
    };
  }));
}
