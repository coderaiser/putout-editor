# coverage findings

Status: ✅ resolved, ❌ open.

---

## ❌ The 100% gate is satisfied by excluding the files that are not covered

`packages/client/.nycrc.json` sets `checkCoverage: true` with 100% on all four
metrics and `all: true`, so the gate is real. It is also carved down: the
`exclude` list names twelve source paths, and they are exactly the files that
had no coverage. The report says 100% and the run exits 0 over the 123 files
that remain.

**Repro**

```bash
cd packages/client
bun run coverage            # exits 0, "All files | 100 | 100 | 100 | 100"
```

```json
{
    "checkCoverage": true,
    "all": true,
    "exclude": [
        "src/app.tsx",
        "src/editor-ast-json/index.tsx",
        "src/editor-ast-tree/index.tsx",
        "src/editor-ast-tree/Tree.tsx",
        "src/editor-ast-tree/tree/**",
        "src/parser/parsers/js/**",
        "src/ui/PasteDropTarget.tsx",
        "src/menu/Menu.tsx",
        "src/snippet/GistBanner.tsx",
        "src/parser/parsers/transpilers/typescript.js",
        "src/types.ts",
        "src/transformer/index.ts"
    ]
}
```

**Result** — with those twelve entries removed and nothing else changed, on
`master` at `a1cfb2d` (1009 tests, all green):

```
All files  |   97.11 |   96.33 |   97.47 |   97.11
ERROR: Coverage for lines (97.11%) does not meet global threshold (100%)
ERROR: Coverage for functions (97.47%) does not meet global threshold (100%)
ERROR: Coverage for branches (96.33%) does not meet global threshold (100%)
```

Seventeen files are short, and four of them have no spec at all:

| File | Lines | Notes |
|---|---|---|
| `src/editor-ast-tree/tree/RecursiveTreeElement.tsx` | 90.90 | no spec |
| `src/editor-ast-tree/tree/Element.tsx` | 85.18 | 71% of functions |
| `src/editor-ast-tree/Tree.tsx` | 88.18 | no spec |
| `src/ui/PasteDropTarget.tsx` | 93.42 | |
| `src/parser/parsers/js/babel.ts` | 94.04 | fixed in `a696461`'s predecessor — 69% branches |
| `src/menu/Menu.tsx` | 91.37 | 66% of functions |
| `src/editor-ast-json/index.tsx` | 98.73 | the MutationObserver callback |
| `src/editor-ast-tree/tree/useHighlight.ts` | 90.32 | |
| `src/types.ts`, `src/editor-ast-tree/tree/types.ts` | 0 | type-only modules |
| `src/transformer/index.ts` | 100 | 62% branches, `chooseParser` |
| `src/app.tsx` | 100 | 60% branches, the error and mobile layouts |
| `src/editor-ast-tree/index.tsx` | 100 | 83% branches |
| `src/editor-ast-tree/tree/{ElementValue,useFocusEffect}.ts(x)` | 100 | one branch each |
| `src/parser/parsers/js/{espree,esprima}` | 100 | one branch each |

**Expected** — either the exclusions go and the gate goes red until those files
are covered, or the gate is documented as what it is: 100% of the files somebody
chose to measure.

Per `MEMORY.md`, the response to a gate is a test, not a lower threshold and not
another `--exclude`. `src/parser/parsers/js/**` is now close to done — the
acorn, espree and esprima adapters are covered and the acorn spec found a real
bug, `parsers.acorn.JSXParser` does not exist in acorn-jsx 5 — which is the
argument for doing the rest the same way rather than re-excluding.
