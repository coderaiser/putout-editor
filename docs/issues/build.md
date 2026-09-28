# Build

**Open only.** What was fixed is in [`../memory/build.md`](../memory/build.md) — an operator
importing a processor, and why `IgnorePlugin` is the wrong answer.

## ❌ `nest build` reports 279 errors that `tsc` does not

The `server` workspace builds through `nest build` (`.madrun.ts`). It fails, and the errors are
not in the code:

```sh
$ npx tsc --noEmit        # in packages/server
$                        # clean, 0 errors

$ npx nest build
src/parse/compact.ts:3:27 - error TS2583: Cannot find name 'Set'.
  Found 279 error(s).
```

**Expected.** Two tools, one answer. **Got** — `tsc` accepts the source and `nest build`
rejects it, on `Map` and `Set` that `tsconfig.json` targets at `ES2022` for. The counts, so the
shape is visible rather than "it fails":

| Code | Count | |
|---|---|---|
| TS2583 | 64 | Cannot find name `Map`/`Set` |
| TS2304 | 64 | Cannot find name |
| TS2697 | 56 | Non-relative import cannot be resolved |
| TS18046 | 32 | `catch` is `unknown` |
| TS2339 | 30 | Property does not exist |

So `lib` is not resolving under the nest build, and the import errors follow from it rather
than being 279 separate mistakes. `nest-cli.json` only sets `deleteOutDir`, and `tsconfig.json`
is shared, so the difference is in how nest invokes tsc rather than in either file.

This is the finding to re-check by running `npx nest build` in `packages/server` — the two
numbers to compare are `tsc --noEmit` and the `Found N error(s)` line.

## ❌ nothing is pinned

`*.lock` is in `.gitignore`, and `git check-ignore bun.lock` confirms it, so a monorepo that
bundles 🐊**Putout** for the browser has no pinned resolution and root and `packages/client`
ask for different TypeScript majors. `bun.lock` exists on disk and is not committed, so a fresh
checkout resolves whatever is current. Committing it is what would make a reinstall
reproducible.

## ❌ do not reach for `IgnorePlugin`

Three attempts, all of which compiled and then broke the app:

| ignored | build | app |
|---|---|---|
| `@putout/processor-css` plus several packages | compiles | does not render |
| `stylelint` only | compiles | `F.homedir is not a function` |
| `stylelint`, `config-loader`, `cosmiconfig` | clean, no warnings | `Cannot find module 'stylelint'` |

`IgnorePlugin` makes a module unresolvable, and 🐊**Putout** resolves processors **by name at
runtime** through the loader's `customRequire`. In a bundle that `require` must find the module
by its real name, so a processor cannot be dropped while something still asks for it. Each
attempt only moved the error to the next import.
