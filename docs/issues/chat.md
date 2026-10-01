# Chat

**Open only.** What was fixed is in [`../memory/`](../memory/).

## ❌ the `/chat` plan's step 1 breaks the client's coverage gate

`plan-c.chat.md` §0.1 adds two files to `packages/client/src` — `export-tree.ts` and
`export-tokens.ts` — and invariant I3 requires client coverage to stay at 100. Those cannot both
hold. Added exactly as specified, both lint-clean and `tsc`-clean:

```
  export-tokens.ts                |       0 |        0 |       0 |       0 |
  export-tree.ts                  |       0 |        0 |       0 |       0 |
All files                         |   99.89 |    99.81 |   99.47 |   99.89 |
ERROR: Coverage for lines (99.89%) does not meet global threshold (100%)
ERROR: Coverage for functions (99.47%) does not meet global threshold (100%)
ERROR: Coverage for branches (99.81%) does not meet global threshold (100%)
ERROR: Coverage for statements (99.89%) does not meet global threshold (100%)
```

**Expected.** A new file in a `checkCoverage` package either is exercised or is excluded.
**Got** — 0%, and a red gate. `packages/client/.nycrc.json` is `all: true`, so a file nothing
imports is still measured, and nothing imports these two.

**The two files have no consumer in v2.** They existed so chat could alias-import client's
`Tree.tsx`, and v2 removed that: its own text says so twice.

- §3.2: "No `#store` alias required for the tree. **No client imports required.** `AstTree` is
  fully self-contained in `commands/components/`."
- §5.1: "**No client tree imports. No `../client/src/...` relative paths in chat.** … This is the
  key structural change from v1."

`AstBlock.tsx` (§3.2) imports `AstTree` from `commands`, and the one remaining alias, `#store`,
points at **chat's own** store. So §0.1 is a leftover from v1 that §3.2 and §5.1 did not delete —
and it is the only step that edits `client` at all, which is why I1 hangs on it.

**Resolved by decision, not by a fix** — the maintainer chose to keep both files per §0.1 and cover
them with `src/export.spec.ts` (3 tests: the re-export is the same binding as the original, and
`export-tree` exports `Tree` and nothing else). Client is back to 100% ×4 at 1048 tests. The
alternative — dropping both files — would also have satisfied I1 and I3 with no code, since v2 needs
neither. Noted here so the choice is not re-litigated without knowing both options were measured.