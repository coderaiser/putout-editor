# Build

**The essence.** A fresh `bun i` broke `packages/client`'s build, and the cause was one import:
`@putout/operator-match-files` imported `@putout/processor-css` to get a css parser, and that
processor imports `stylelint` and `cosmiconfig`. `cosmiconfig` reaches `env-paths`, which calls
`os.homedir()` **at import time**, and `os` is `false` for the browser — so the module graph
died on load, before anything ran.

```sh
$ cd packages/client && bun run build
ERROR in ../../node_modules/cosmiconfig/dist/loaders.js 12:26-34
  x Module not found: Can't resolve 'crypto' in '.../node_modules/cosmiconfig/dist'
```

**An operator must not import a processor.** Fixed upstream in
`@putout/operator-match-files@12.12.0`: the css processor import is replaced by
`@putout/operator-css`, whose only dependency is `happy-style` (pure JS over `css-tree`). Bumping
that one transitive dependency took the build from **90 errors to a clean compile**.

The lesson generalises: an *operator* is loaded by every rule, so anything it reaches statically
lands in every consumer's bundle. That is why `IgnorePlugin` is the wrong tool — see
[`../issues/build.md`](../issues/build.md) for the three attempts that each compiled and then
broke the app.
