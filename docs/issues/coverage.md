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
`master` at `061ee90` (1009 tests, all green):

```
All files  |   98.15 |   96.41 |   97.69 |   98.15
ERROR: Coverage for lines (98.15%) does not meet global threshold (100%)
ERROR: Coverage for functions (97.69%) does not meet global threshold (100%)
ERROR: Coverage for branches (96.41%) does not meet global threshold (100%)
```

Sixteen files are short. The work splits into three tiers, and only the middle one
is expensive:

| File | Lines | Branches | Work |
|---|---|---|---|
| `src/parser/parsers/js/{espree,esprima}.ts(x)` | 100 | 90.9 | one short-circuit each |
| `src/editor-ast-tree/tree/{ElementValue,useFocusEffect}` | 100 | 87–96 | one branch each |
| `src/transformer/index.ts` | 100 | 62.5 | `chooseParser`, four `if`s |
| `src/editor-ast-tree/index.tsx` | 100 | 83.3 | three branches |
| `src/app.tsx` | 100 | 60 | the error and mobile layouts |
| `src/editor-ast-json/index.tsx` | 98.7 | 90 | the MutationObserver callback |
| `src/ui/PasteDropTarget.tsx` | 93.4 | 81.8 | drag events, 88% of functions |
| `src/menu/Menu.tsx` | 91.4 | 81.8 | 66% of functions |
| `src/parser/parsers/js/babel.ts` | 94.0 | 69.2 | plugin remapping, `getNodeName` |
| `src/editor-ast-tree/tree/useHighlight.ts` | 90.3 | 80 | |
| `src/editor-ast-tree/tree/RecursiveTreeElement.tsx` | 90.9 | 64.3 | **no spec** |
| `src/editor-ast-tree/tree/Element.tsx` | 85.2 | 87.5 | 71% of functions |
| `src/editor-ast-tree/Tree.tsx` | 88.2 | 87.5 | **no spec**, 70% of functions |
| `src/editor-ast-tree/tree/types.ts` | 0 | 0 | type-only, no statements to run |

`src/types.ts` was on this list at 0% and is now covered: moving the
`SourceRange` primitives into it in `a1cfb2d` gave the file code, and something
imports it at runtime. That is the argument for doing the rest the same way
rather than re-excluding. `tree/types.ts` is the one entry where there is nothing
to write a test for — it is types only, so the answer is either a real importer or
an explicit, justified exclusion, and that is a decision rather than a chore.

**Expected** — either the exclusions go and the gate goes red until those files
are covered, or the gate is documented as what it is: 100% of the files somebody
chose to measure.

Per `MEMORY.md`, the response to a gate is a test, not a lower threshold and not
another `--exclude`. `src/parser/parsers/js/**` is now close to done — the
acorn, espree and esprima adapters are covered and the acorn spec found a real
bug, `parsers.acorn.JSXParser` does not exist in acorn-jsx 5 — which is the
argument for doing the rest the same way rather than re-excluding.
