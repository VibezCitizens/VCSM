# Scanner AST Architecture

Scanner AST precision uses `@babel/parser` inside `src/parsers/ast`.

The AST layer parses JavaScript, JSX, TypeScript, and TSX syntax with a single source pass per file. Extractors then read source reality from AST nodes:

- imports and exports from `ImportDeclaration`, `ExportNamedDeclaration`, `ExportAllDeclaration`, dynamic `import()`, and `require()`
- routes from JSX `<Route />` nodes and route object `path` properties
- writes from Supabase mutation call expressions
- RPCs from `rpc()` call expressions
- edge function calls from `functions.invoke()` and mutating `fetch()` calls
- test declarations from `describe()`, `it()`, and `test()`

The scanner remains discovery-only. Confidence means extraction confidence, not architectural approval.
