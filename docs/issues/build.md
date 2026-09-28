# Build

**Open only.** What was fixed is in [`../memory/build.md`](../memory/build.md) — an operator
importing a processor, and why `IgnorePlugin` is the wrong answer.

## ❌ `server` has no `nest` binary

`madfork` runs `redrun build` in each workspace and **exits on the first failure**, so the first
one hides the rest. `server` declares `@nestjs/cli` and no `nest` is installed anywhere in this
tree, so it is the only workspace still failing.

| workspace | `redrun build` |
|---|---|
| `client` | ok since `@putout/operator-match-files@12.12.0` |
| `mcp` | ok — 2065 modules, 17.56 MB |
| `plugin-putout-editor` | ok — it imports itself and prints its rules |
| `server` | fails — `nest: not found` |

A workspace needs a `build` script for `madfork`, and `.madrun.js` only reaches `package.json`
through `madrun --init`.

## ❌ nothing is pinned

`*.lock` is gitignored, so a monorepo that bundles 🐊**Putout** for the browser has no pinned
resolution, and root and `packages/client` ask for different TypeScript majors. Committing
`bun.lock` is what would make a reinstall reproducible.

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
