# Workspaces

**Install a means with `bun i --no-save`; only a declared dependency goes in `package.json`.**

There is no committed lock file here — `bun.lock` is gitignored on purpose, and CI installs
with `bun i -f --no-save`. So a bare `bun i <pkg>` leaves an unrelated lockfile diff in the
middle of a feature commit, and `npm i` is worse than wrong: it starts, writes nothing to
`node_modules`, and times out, which is a several-minute dead end rather than a fast failure.
When an install exists only to compare the published build against the workspace, or to bring
in a peer of something already present, `bun i --no-save <pkg>` is the command.

**And a workspace package is not the published build.** `node_modules/putout` is a symlink to
`~/putout/packages/putout`, so anything measured through it is the workspace's behaviour.
Stating that is part of a finding, not a footnote — the 🐊**Putout** report at the repo root
carries the caveat because the six defects in it are versioned to what was installed here.

## `--fix` on TypeScript **corrupts an `as` cast**, silently

The worst one, and it is **not a rule** — it reproduces with `plugins: []`, so the damage is in
parse-and-print.

```ts
const b = v as boolean;
```

```sh
$ putout b.js --fix
$ cat b.js
const b = v;
as;
boolean;
```

Three statements, `places: 0`, exit 0. `as` is parsed as an identifier and the annotation is
printed as its own statement. **Without `isTS: true`, `putout --fix` over TypeScript rewrites the
file and says nothing** — and a CI step that checks only the exit code sees a pass.

`isTS: true` selects the TypeScript parser and every case is clean — declaration, argument,
parameter, binary expression, array element, return, `as unknown`. What does **not** work: no
options, and `ts: true` (both throw `Unexpected token, expected ","`), and
`parser: {plugins: ['typescript']}` (`parser.parse is not a function`).

The smaller version of the same trap is a **`.js` fixture holding TypeScript**: a `fixture/*.js`
containing `as boolean` is JavaScript only in name, and `t.transform` fails on it. That is how
`apply-boolean-cast-to-typeof`'s own `-fix` fixture was caught.

## `--fix` emptying a file is the rules working — read the whole set, not one rule

```js
const a = 1;

console.log(a);
```

```sh
$ putout remove-console.js --fix
$ wc -c remove-console.js
1 remove-console.js
```

Zero bytes, and **correct**. `remove-console` takes the `console.log`, which was the only user
of `a`, so `remove-unused-variables` then takes `const a = 1;`. Nothing malfunctioned; the file
had nothing else in it. Neither rule should be "fixed", and it should not be filed.

The control that settles it in one run — give `a` a second user and the file survives:

```js
const a = 1;
console.log(a);
export const b = a + 1;
// → const a = 1;  +  export const b = a + 1;
```

**The mistake is the lesson.** I isolated `remove-console` with its own config, got a clean
reproduction, read the emptied file as data loss, and wrote it up as the worst defect in the
report — with a root cause and a proposed fixture. Isolating a rule makes a reproduction
*cleaner*, not *more complete*: the pipeline still runs everything else. The question to ask is
not "which rule emptied this" but "what else ran, and did it have a reason too".

The same shape has bitten three times in this repo's history, so it is worth stating as a rule:
**a check that passes on a cheaper path than the user takes proves nothing about the expensive
one.** `t.deepEqual` against a re-export of its own source passed while the module was unloadable
by every real consumer; a single-tree keyboard spec passed while the document-scoped listener would
have moved two trees at once; and a round-trip test that parsed with `@babel/parser` and printed
with `putout` "found" two `@putout/printer` bugs that do not exist — **`print()` takes what
`putout`'s own `parse()` produced**, because that one sets `node.raw` and `@babel/parser` does not.

Both reports, with the measured output, are at the repo root: `broken-putout.md` and
`broken-putout2.md`.

---

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
