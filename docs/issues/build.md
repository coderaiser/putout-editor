# build findings

---

## ✅ the cause was an operator importing a processor

A fresh `bun i` broke `packages/client`'s build. The client bundles 🐊**Putout** for the
browser, so anything it reaches statically lands in the bundle:

```sh
$ cd packages/client && bun run build
ERROR in ../../node_modules/cosmiconfig/dist/loaders.js 12:26-34
  x Module not found: Can't resolve 'crypto' in '.../node_modules/cosmiconfig/dist'
```

`@putout/operator-match-files` imported `@putout/processor-css` to get a css parser, and that
processor imports `stylelint` and `cosmiconfig`. `cosmiconfig` reaches `env-paths`, which calls
`os.homedir()` **at import time**, and `os` is `false` for the browser - so the module graph
died on load, before anything ran.

**An operator must not import a processor.** That is fixed upstream: `operator-match-files` no
longer imports `@putout/processor-css`, and the other processor imports are being moved to
operators too. It arrives with the next release.

## ✅ what was fixable here

`resolve.fallback` in `rspack.config.js` gained `crypto`, `stream`, `worker_threads`,
`perf_hooks`, `async_hooks` and `zlib` as `false` - the pattern already in that file for `fs`,
`net` and `os`. That is correct regardless: the code is unreachable in a browser.

## ❌ what is still open

**Do not reach for `IgnorePlugin` here.** Three attempts, all of which compiled and then broke
the app:

| ignored | build | app |
|---|---|---|
| `@putout/processor-css` plus several packages | compiles | does not render |
| `stylelint` only | compiles | `F.homedir is not a function` |
| `stylelint`, `config-loader`, `cosmiconfig` | clean, no warnings | `Cannot find module 'stylelint'` |

`IgnorePlugin` makes a module unresolvable, and 🐊**Putout** resolves processors **by name at
runtime** through the loader's `customRequire`. In a bundle that `require` must find the module
by its real name, so a processor cannot be dropped while something still asks for it. Each
attempt only moved the error to the next import.

**Also open: nothing is pinned.** `*.lock` is gitignored, so a monorepo that bundles 🐊**Putout**
for the browser has no pinned resolution, and root and `packages/client` ask for different
TypeScript majors. Committing `bun.lock` is what would make a reinstall reproducible.

Until the operator fix ships, `out/` is stale and the e2e suite cannot run. The last
known-good result is from before the reinstall: 76/76 desktop, 49/49 mobile. The gates that
still work are `putout .`, the unit suites and `redlint scan`.
