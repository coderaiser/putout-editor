# flatlint — a token-based linter that fixes syntax errors, and what it teaches about 🐊Putout

Read from `node_modules/flatlint@5.10.2` (a real dependency of this repo, via
`redlint`). Not a 🐊**Putout** plugin ecosystem — it is **a separate engine** that
borrows two packages from it. Worth reading because it is the smallest complete
instance of the same three-layer shape.

## The shape

```
lib/flatlint.js      lint(source, overrides) -> [source, places]
  lib/parser/        js-tokens  ->  tokens[]        (no AST)
  lib/runner/        tokens + plugins -> places[]   (fixCount loop)
  lib/printer/       tokens -> source             (no AST)
  lib/traverser/     tokens walk
  lib/compare/       token equality, __args/__expr/__tmpl/__array matchers
  lib/plugins/       33 plugins, one directory each
```

`lint()` is nine meaningful lines: `parse → run → print`. Compare
`putout`'s own `lint(source, options)` — **same four steps, same order**,
because `lib/flatlint.js` is a deliberate miniature of it.

## What is genuinely different, and it is the whole lesson

**There is no AST.** The unit is a `js-tokens` token: `{type, value}`. A plugin
matches a *token sequence*, not a node. That is why the whole thing is 33
plugins instead of 116, and why its name is honest.

The consequence worth carrying: **every rule that can be written against a token
sequence is a rule that works on a file that does not parse.** That is the
thing 🐊**Putout** cannot do — `putout .` on `const b = v as boolean;` produces
three statements (`docs/issues/build.md` §1, and `AGENTS.md`'s note that this
is parse-and-print with `plugins: []`).

```js
// lib/runner/runner.js
while (--fixCount >= 0) {
    const fixed = [];
    
    for (const {rule, plugin} of plugins) {
        const [isFixed, newPlaces] = replace(tokens, {fix, rule, plugin});
        
        fixed.push(isFixed);
        places.push(...newPlaces);
    }
    
    // a pass where nothing moved is a fixed point: the source is stable
    if (!fixed.filter(Boolean).length)
        break;
}
```

`fixCount = fix ? 10 : 1` — **ten passes, then stop.** Not a `while(true)`. A
rule that oscillates is bounded rather than hung, which is the cheapest possible
answer to "two rules that undo each other". 🐊**Putout** has no equivalent bound
in the runner, so an oscillating pair there hangs.

## The two packages it borrows, and the one it drops

| Borrowed | For |
|---|---|
| `@putout/engine-loader` | `loadPlugins({pluginNames})` — **identical API and identical call shape** |
| `@putout/operator-keyword` | the `KEYWORD` table a token rule matches against |

Dropped: `@putout/printer`. `lib/printer/` is its own. Because there is no AST,
printing is `tokens.map(({value}) => value).join('')` — and whitespace *is* a
token, so the printer has to decide what to do with it.

## Where this changes how I write a rule here

**`loadPlugins` is shared, so the plugin *contract* is shared.** A flatlint
plugin is a **matcher over tokens**, and the shape that generalises to
`packages/plugin-putout-editor` is:

- one directory per rule, `index.js` beside a `fixture/`;
- a `match`-style predicate that decides *this token sequence is the rule's*,
  and `report` first in the file — the convention already recorded in
  `AGENTS.md` ("`report` is the first export of every rule");
- a `fixCount`-style **bound**, because an unfixed oscillation is a hang.

The one thing not to import: flatlint has no `report` concept at all — it emits
`places` with a `position` and no message, because the CLI prints the filename
and line. That is why a token-level engine can be 33 rules and 🐊**Putout** is
116: **it never learned to say what is wrong.** The moment a message is needed,
you need a match that has structure, which is `jessy` and the AST.

## Reuse, concretely

- **`fixCount` as a loop bound.** 🐊**Putout**'s runner has no bound; adding one
  there is a one-line change that turns a hang into "did not converge". This is
  the single most transferable idea here.
- **The token-level idea for the editor's own parser** (`packages/client/src/parser`).
  The editor's `apply-batch` runs on *parsed* source, so a file with a syntax
  error cannot be transformed at all. A token pass that can still fix
  `import {a, from 'b'}` is reachable where a plugin is not.