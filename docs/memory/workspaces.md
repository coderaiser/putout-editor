# Workspaces

**A package subpath import must not carry a `.ts` extension.**

Moving the four pure modules into `@putout/editor-commands` and having `mcp` delegate to them
(plan-c §4) means an import across a package boundary for the first time. The obvious form,
matching every relative import in the repo, fails:

```ts
import {compactAST} from '@putout/editor-commands/src/compact.ts';
```

```
Error: ENOENT: no such file or directory, open
'/home/coderaiser/putout-editor/packages/mcp/src/@putout/editor-commands/src/compact.ts'
    at getSourceSync (node:internal/modules/esm/load:41:17)
    at load (…/@supertape/loader-ts/lib/ts.js:15:26)
```

**Why.** `@supertape/loader-ts` short-circuits resolution for anything matching `/.tsx?$/`:

```js
export function resolve(specifier, context, nextResolve) {
    if (/\.tsx?$/.test(specifier)) {
        return {
            url: new URL(specifier, context.parentURL).href,
            shortCircuit: true,
        };
    }
    
    return nextResolve(specifier, context);
}
```

`new URL('@putout/editor-commands/src/compact.ts', parent)` is not a package resolution at all —
it is a *relative* path, so the bare specifier becomes a file under the importer's own `src/`.
Plain `node` and `bun` both resolve it correctly, so the same import passes outside the test
runner and dies only under `tape`. That is the trap: a green `node` run is not evidence about the
mode the suite actually uses.

**The fix** is an extensionless subpath plus an `exports` map on the package:

```jsonc
"exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
}
```

```ts
import {compactAST} from '@putout/editor-commands/compact';
```

Verified under loader-ts, plain `node` and `bun`. The map is the load-bearing half — without it
the extensionless form has no entry to resolve to.

**Relative imports inside one package keep the `.ts` extension.** They resolve on disk and the
loader handles them; this only applies to a specifier that crosses into `node_modules`.

## A `.css` file has no default export, and declaring one hides that

`packages/client/src/export-tokens.ts` shipped the shape its own plan specified —
`export {default as tokensUrl} from './css/tokens.css'` — and **no runtime can load it**:

```
$ bun -e "import './css/tokens.css'"
error: Cannot find module './css/tokens.css'
```

Three things made it look right, and each is worth checking for separately:

- **`tsc` passes.** `packages/client/src/types/supertape.d.ts` is `declare module '*.css'`, so
  the module is `any` and a `default` off it typechecks. The type system is not evidence here.
- **The spec passed.** It imported `tokens.css` as a value and compared it to the module's own
  re-export — both sides through supertape's CSS loader. Comparing a re-export to its own source
  is the tautology to watch for: it can only fail if resolution fails, and the loader was
  providing resolution.
- **The package builds.** rspack has `css-loader`, so the bundler is the one environment where
  this works.

A `.css` import is bundler-only. `import './x.css'` for the side effect is the shape the other
ten client files use, and the only one that a test runner or a plain `node` can load. So a
"public export" of a stylesheet is only meaningful to a bundler, which is worth asking about
before writing one — see the plan's own §8, where chat carries its own `tokens.css` and the
client one is "if chat imports it in the future".

## The coverage exclude list, and the one shape that earns an entry

`packages/commands/.nycrc.json` excludes `**/*.types.ts` — not to make the gate pass, but because
a file of type declarations has no statement to execute. `src/state.types.ts` is 60 lines of
`interface`/`type` and no runtime code, so no test can ever cover it.

That is the whole test for an exclusion: *is there a statement here that a test could execute?*
`src/index.ts` in the same package is four re-export statements — real code — so it got a spec
instead, and is at 100%. The line between the two is not "small" or "boring", it is "has runtime
code", which is the same distinction `packages/mcp/.nycrc.json` and `packages/client/.nycrc.json`
already draw.
