# DependencyMap Contract

File: `maps/dependency-map.json`

Purpose: discover imports between feature and engine ownership areas.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `dependencies`: array

Dependency entry:

- `from`: owner id
- `fromKind`: owner kind
- `to`: owner id
- `toKind`: owner kind
- `relationship`: relationship label such as `Feature->Feature`, `Feature->Engine`, or `Engine->Engine`
- `imports`: array of import observations

Import observation:

- `file`: repository-relative importing file
- `importPath`: literal source import path
- `resolvedPath`: scanner-resolved repository path
