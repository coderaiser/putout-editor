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

I tried the obvious version of that: `rspack.IgnorePlugin` for
`@putout/processor-(css|filesystem)` plus `stylelint|cosmiconfig|globby|...`. **It compiled and
then the app did not render** - the whole `e2e/desktop.ts` suite went red on a fresh build,
including `renders the editor application`. So that approach is wrong as it stands, and
guessing at the list is worse than leaving it failing loudly.

**What I expected.** `bun i` to be reproducible, and the browser bundle to be independent of
which versions a Node-only processor resolves to.

**Proposal.** Two parts. Add a committed `bun.lock` - the repo gitignores `*.lock`, so a
monorepo that bundles 🐊**Putout** for the browser has no pinned resolution at all, and root
and `packages/client` ask for different TypeScript majors. Then, with versions pinned, work
out what the browser build genuinely needs from the processors and exclude exactly that,
verified by the e2e suite rather than by the build succeeding.

Until then `putout .` and the unit suites are the gates that still work, and a `bun i` here is
not free.
