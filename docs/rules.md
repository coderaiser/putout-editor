# Rules in `packages/plugin-putout-editor`

How to write and test a 🐊**Putout** rule for this repository, and the traps that are not
visible from the types. Upstream conventions are in [`putout-style.md`](./putout-style.md).
Each rule has its ❌/✅ pair in the plugin [`README.md`](../packages/plugin-putout-editor/README.md).

## Where a rule goes

- About this repository: `packages/plugin-putout-editor`.
- Useful to any 🐊**Putout** user: an idea in [`backlog.md`](./backlog.md), with a repro. It
  becomes a rule in the 🐊**Putout** repository.
- First run `putout . --fix`. Do not write by hand what a rule already does.

## Wiring

- The root `.putout.json` loads the plugin by the bare name `putout-editor`. Config merges up
  the tree, so every rule runs in every package.
- **A new rule is on in the whole repository.** If a rule is about one package, turn it `off`
  in the root `.putout.json` and `on` in that package `.putout.json`. Check both directions.
- Scope a rule off for specs in the **root** config (`*.{spec,test}.{js,jsx,ts,tsx}`). A `match`
  in a package config does not reach other packages.
- Check the scope with `putout .` at the root. The plugin test suite cannot see other packages.

## Package shape

Match `@putout/plugin-tape` and the plugins in the 🐊**Putout** repository. Do not change it.

```text
packages/plugin-putout-editor/
├── .madrun.js  .nycrc.json  .putout.json  README.md  package.json
├── lib/
│   ├── index.js              rules map
│   └── <rule>/
│       ├── index.js          the rule
│       ├── index.spec.js
│       └── fixture/          one <name>.js + <name>-fix.js pair per shape
└── test/
    ├── putout-editor.js      one test per rule: is it on or off
    ├── <rule>.js             one file per -file rule
    └── fixture/
```

Steps for a new rule:

1. Load the MCP tools with `ToolSearch`. Run `transform` and `find_places` on your edge cases.
   See [`tooling.md`](./tooling.md#mcp-server).
2. Name it verb first: `apply-`, `remove-`, `add-`, `check-`, `convert-`. The name is a claim
   about what the rule checks. Make it true.
3. Write `lib/<rule>/index.js`. Export `report` first, then the action.
4. Add one fixture pair per shape. Generate the `-fix` file with `UPDATE=1`. A fixture with no
   `-fix` file is a no-transform case.
5. Write `index.spec.js`: `t.transform(name)` per fixed shape, `t.noTransform(name)` per shape
   to leave alone, `t.report(name, 'message')`, and a `t.noReport` on a fixture with nothing to
   find.
6. Add the rule to `lib/index.js`, `test/putout-editor.js` and the README.
7. `bun run coverage` at 100%, then `putout .` at the root.

No comments in the plugin. The name and the README section are the documentation. The one
exception is the `remove-comments` fixture and README example.

## Code rule or filesystem rule

| Kind | Sees | Runs under | In the map |
|---|---|---|---|
| code | one AST | `putout .` | on |
| filesystem (`*-file`) | the file tree as JSON | `redlint` | `['off', rule]` |

A 🐊**Putout** rule cannot see file names. A statement about a tree (for example "colours only in
`tokens.css`") needs a filesystem rule. `redlint` builds the tree as
`__putout_processor_filesystem(...)` and runs the rules on it. `packages/client` runs
`redlint fix` in its `fix:lint`, so CI enforces filesystem rules.

A filesystem rule needs all three parts. If one is missing, the rule never runs and nothing
reports it:

1. The name ends in `-file`.
2. The map has `['off', rule]`.
3. The root `.putout.json` has a `.filesystem.json` match that turns it `on`.

The map is the only source of on/off. Do not repeat it per rule in `.putout.json`.

### `matchFiles` or `scan`

Ask: does the verdict need a second file?

| Rule | Needs a second file | Uses |
|---|---|---|
| `remove-rgb-outside-token-file` | no | `matchFiles` |
| `remove-z-index-outside-token-file` | no | `matchFiles` |
| `check-main-imports-in-file` | no | `matchFiles` |
| `remove-undefined-token-file` | yes: `tokens.css` | `scan` |
| `check-documented-scripts` | yes: `package.json` | `scan` |

- `matchFiles` runs the inner plugin once per file, alone, with static options. The inner plugin
  gets no root and no other file. A cross-file rule written with `matchFiles` reports 0 places
  and all tests stay green.
- `scan(root, {push, crawlFile, trackFile})` gets the root. Use `crawlFile(root, [names])` when
  you know the names. `trackFile` is a generator for progress output.
- A `scan` can pass data to an inner matcher through `options`, for example `{known}` tokens.
- `matchFiles` reports one place per file, but its fix changes every match in the file. Assert
  the fixed text, not the count.
- `matchFiles` reads an empty file as `{}`. The CSS processor makes `raw('{}')` from it. Filter
  `raw` out and add an `empty` fixture.
- Export `report` from the `matchFiles` result: `export const {report, scan, fix} = matchFiles(…)`.
  A `scan` rule writes its own `report`.

### Two-level rules

When the inner half of a `matchFiles` rule needs its own tests, move it to
`lib/<rule>/<inner>/` with its own `index.js`, `index.spec.js` and `fixture/`. Do this only when
the spec must build a filesystem by hand to reach the matcher.

- The inner spec registers the **outer** name. `t.report`/`t.transform` use the **inner** name.
- `replace` takes `(vars, path)`. The one-argument form fails with "wrong type".
- Reference: `apply-namespace-to-imported-file` in the 🐊**Putout** repository.

### Testing a filesystem rule

- `test/<rule>.js`: `createTest(import.meta.url, {rules: {'putout-editor/<rule>': 'on'}, plugins: [['putout-editor', plugin]]})`.
  Without `rules`, the rule is off and the test passes on nothing.
- Fixtures use the object form `__putout_processor_filesystem({...})`. It round-trips byte for
  byte.
- `t.report` needs the full message. A filesystem message has no `☝️ file:` prefix unless the
  rule writes one.
- **`getFilename` is absolute under `redlint`** (`/home/you/repo/AGENTS.md`). `parseFilesystem`
  fixtures use `/AGENTS.md`. Use `basename(getFilename(file))`. Add one fixture with an absolute
  tree, built like `buildTree(process.cwd())`.
- A `crawlFile` mask matches the basename, so `package.json` finds every `package.json`. Take
  the one in the same directory as the document (`dirname`).

## Rule traps

Each of these fails silently: the rule reports nothing, or fixes nothing, and exits 0.

- **Visit every node.** `enter`/`exit` at the top of `traverse` fire 0 times. `$` matches nothing.
  `*` is a syntax error. `__` is `Identifier`. Use an includer with Babel aliases
  (`['Statement', 'Expression', 'ObjectProperty']`; `'Node'` is invalid), or a `Program` visitor
  that calls `traverse` imported from `putout` (alias it: `import {traverse as babelTraverse}`).
- **`include` takes type names, not template values.** `__` in `include` is `Identifier`.
- **An includer `fix` gets a bare `path`**, not `{path, key}`.
- **Bound values (`__a`) arrive in the `match` callback** `(vars, path)`, not in `report`.
- **A pattern binding is `__a`…`__z` only.** `__error` is not a binding and matches 0 places.
- **`{a,b}` unions work in `include`, not in a `match` key.** Build the `match` map in a loop.
- **In a `match` callback, `__a` is a node**, not an array.
- **To change a literal, replace the node.** `node.value = 'x'` keeps `extra.raw`, so the printer
  emits the old text. Use `node.key = types.stringLiteral(x)`.
- **A replacer must have `replace`**, even if it never fixes. Without it the loader fails with
  `Cannot determine type of plugin`.
- **Report-only:** the loader needs one of `find`, `traverse`, `replace`, `include`, `exclude`,
  `rules`, `declare`, `scan`, and `find` without `fix` throws. Use an identity
  `replace: () => ({[key]: key})`. Test that the file comes back byte for byte.
- **Do not import what `compileRule` declares:** `remove`, `rename`, `types` members,
  `getFilename`, other operator helpers. This applies to client templates and mcp plugins.
- **`apply-type-check` (upstream)** rewrites `node.type === 'X'` to `isX(node)` but does not add
  the import. Expect one `no-undef`.
- **A guard in `match` must not repeat the key.** If the key already decides a case, the guard is
  dead code and coverage shows it.
- **A naming guard belongs in the fixer, not in `match`.** A guard there hides real places.

## The CSS and markdown ASTs

`happy-style` (css) and `happy-mark` (markdown) convert a document to JS call expressions. There
is no `Declaration` node with `property`: a rule matches the call and reads `arguments`.

```js
rule(selector([classSelector('input')]), [
    declaration('box-sizing', 'border-box'),
]);
```

- `rule(__a, __b)`: `__a` is the selector, `__b.elements` are the declarations.
- `functionValue` arguments have an `operator(...)` node for each separator.
  `calc(100% - 10px)` has three arguments.
- To rewrite a property, change `value`, `raw` and `extra.rawValue` together.
- Nodes: `dimension`, `percentage`, `color`, `string`, `valueList`, `functionValue`, `brackets`,
  `parentheses`, `unicodeRange`. Anything else is a bare string (`color: red` is `'red'`), so a
  rule cannot look inside it. There is no `Ratio` node. A comma is an `Operator`.
- A bare `0` can come back as an empty string.
- A parser change and a printer change need fixtures in both `lib/parser/…/fixture/` and
  `lib/printer/fixture/`. A parser spec does not run the printer.
- Ask the mcp `formats` tool for these ASTs. `parse` is Babel only.

## `UPDATE=1`

- `UPDATE` is `Boolean(Number(value))`. `UPDATE=1` is on, `UPDATE=0` is off.
- `t.transform` writes the `-fix` file.
- `t.noTransform` with `UPDATE=1` **rewrites the source fixture** in place.
- Keep `git checkout -- lib/*/fixture/` ready and read the diff.

## TypeScript and `--fix`

- `putout` exports the plugin types (`Fix`, `Match`, `Traverse`, `Report`, `PutoutPlugin`) from
  `@putout/types`. The plugin stays `.js` to match upstream.
- **`putout --fix` on TypeScript without `isTS: true` breaks `as` casts:**
  `const b = v as boolean;` becomes three statements, with `places: 0` and exit 0.
  `ts: true` does not work. A `.js` fixture with TypeScript in it fails the same way.
- A scoped run (`putout packages/mcp`) prints nothing for `.ts` files. Use `isTS: true` and read
  the count.
- A file that `--fix` empties can be correct: `remove-console` removes the only use of a
  variable, then `remove-unused-variables` removes the variable.

## Upstream fixer traps

These are upstream rules. They exit 0 on a lossy fix. `tsc` or the tests find the damage.

- `optional-chaining/convert-optional-to-logical` (on here): `a()?.b` becomes `a() && a().b`.
  The call runs twice and the type narrowing is lost. `tsc` reports it. On a multi-line TS cast
  the output does not parse. In statement position, `f && f();` fails `no-unused-expressions`.
- `logical-expressions/apply-destructuring`: on a `return`, it drops the `&&` guard.
  `return el().text && el().text.trim()` becomes `const {text} = el(); return text.trim();`.
- A fixer turns `isUndefined(x) ? f() : x` into `x || f()`. For a boolean `x`, `false` then
  calls `f()`. Write `if (isBoolean(x)) return x;` instead. Found in `packages/mcp/src/language.ts`.
- `apply-type-check`: when the file declares `const isX = (node) => node.type === 'X'`, the fix
  writes `const isX = isX;`. The module throws on load.
- `objects-braces-inside-array`: adds a blank line between consecutive comment lines inside an
  array element. Keep such comments to one line.
- `for-of/remove-useless` once turned `remove-comments` into a different rule. Only a negative
  fixture found it.
- `tape/convert-equal-to-ok` changes `t.equal(result, false)` to `t.notOk(result)`, which passes
  for any falsy value.
- `tryCatch` returns `[error]` on a throw: the result element is absent. Destructuring with a
  default fails on `null` (`JSON.parse('null')`). Bind first, then guard:
  `const [error, parsed] = tryCatch(JSON.parse, s); const {scripts = {}} = parsed || {};`.
  `check-try-catch-destructure` reports the bad form.
