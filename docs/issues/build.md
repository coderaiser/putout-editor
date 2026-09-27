# client build findings

Status: ✅ resolved, ❌ open.

---

## ❌ a fresh `bun i` breaks the client build

The client bundles 🐊**Putout** for the browser, so anything 🐊**Putout** reaches statically
ends up in the bundle - and several of its processors are Node-only. After re-installing
dependencies, `packages/client`'s build fails:

```sh
$ cd packages/client && bun run build
ERROR in ../../node_modules/cosmiconfig/dist/loaders.js 12:26-34
  x Module not found: Can't resolve 'crypto' in '.../node_modules/cosmiconfig/dist'
ERROR in ../../node_modules/fast-glob/out/providers/stream.js 3:26-34
  x Module not found: Can't resolve 'stream' in '.../fast-glob/out/providers'
```

`@putout/processor-css` pulls in `stylelint`, which pulls in `cosmiconfig` and `fast-glob`,
and both import Node builtins. The bundler has fallbacks for some (`fs`, `net`, `os`,
`path`, ...) but not for `crypto`, `stream`, `worker_threads`, `perf_hooks`, `async_hooks` or
`zlib`, so resolution fails.

**Part of it is fixed here.** Those six are added to `resolve.fallback` in `rspack.config.js`
as `false`, which is the pattern already in that file and is safe - the code is unreachable in
a browser. That removes the stylelint/cosmiconfig class of error.

**What is still open.** Two deeper packages still reach the bundle - `typescript` and
`import-meta-resolve`, which imports `v8` - and the honest fix is to stop the browser bundle
reaching the processors at all, rather than to keep adding fallbacks for whatever a given
install happens to resolve.

**`IgnorePlugin` does not work here, and the reason matters.** The instinct - the editor does
not lint css, so drop the css processor - is right, and I tried it three ways:

| ignored | build | app |
|---|---|---|
| `@putout/processor-css` + `stylelint`, `cosmiconfig`, `globby`, ... | compiles | does not render |
| `stylelint` only | compiles | `F.homedir is not a function` |
| `stylelint`, `config-loader`, `cosmiconfig` | compiles clean, no warnings | `Cannot find module 'stylelint'` |

Each failure is the next layer of the same thing. `@putout/processor-css` imports `stylelint`
and `cosmiconfig` at the top of `css.js`; `cosmiconfig` reaches `env-paths`, which calls
`os.homedir()` **at import time**, and `os` is `false` for the browser, so the module graph
dies on load. Ignoring any one of them just moves the error to the next import.

Then the last one gives it away: `Cannot find module 'stylelint'`, and `Cannot find module
'@putout/processor-css'` when the whole processor was ignored. **`IgnorePlugin` makes a module
unresolvable, and 🐊**Putout** resolves processors by name at *runtime*** - `putout.json`'s
`processors` list is loaded lazily through the loader's `customRequire`. In a bundle that
`require` has to find the module by its real name, so a processor cannot simply be dropped from
the graph: something still asks for it by name and the `require` throws.

So the real decision is not which packages to ignore, it is **which processors the editor
should ask for at all**. The client only ever runs 🐊**Putout** over JavaScript and JSON, so
`processors` should be narrowed to those at the client's call sites - `initPlugin` in
`src/transformer/init-plugin.ts` already passes a custom `require` to `compileRule`, so there is
a seam to hang it on. That is a behaviour change to the editor and worth its own change, not a
line smuggled into a lint fix.

Until that lands, a green build is not available here and `out/` is stale, so the e2e suite
cannot be run. The last known-good e2e result is the run before the dependency reinstall: 76/76
desktop and 49/49 mobile.

**What I expected.** `bun i` to be reproducible, and the browser bundle to be independent of
which versions a Node-only processor resolves to.

**Proposal.** Two parts. Add a committed `bun.lock` - the repo gitignores `*.lock`, so a
monorepo that bundles 🐊**Putout** for the browser has no pinned resolution at all, and root
and `packages/client` ask for different TypeScript majors. Then, with versions pinned, work
out what the browser build genuinely needs from the processors and exclude exactly that,
verified by the e2e suite rather than by the build succeeding.

Until then `putout .` and the unit suites are the gates that still work, and a `bun i` here is
not free.
