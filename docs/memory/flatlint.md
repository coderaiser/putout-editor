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

## A flatlint plugin is a **putout rule** — `report` and all

Measured from `/home/coderaiser/flatlint` (v5.10.3, the source checkout;
v5.10.2 is what is installed here):

```js
export const report = () => `Remove useless '='`;

export const replace = () => ({
    'import __a = from "__b"': 'import __a from "__b"',
    'import {__a} = from "__b"': 'import {__a} from "__b"',
    'function __a = (': 'function __a(',
});
```

So: **a plain `🛩 PutoutScript` `replace` map, and a `report` that returns a
constant string.** The same contract `@putout/plugin-*` uses — which is the whole
of "it is backed in putout": the *plugin* shape, `@putout/test`, `loadPlugins`
and `@putout/operator-keyword` are all the same packages.

> **Correction.** An earlier version of this file said *"flatlint has no `report`
> concept at all"*, from reading `lib/flatlint.js` and never opening a plugin.
> That is wrong, and it is wrong in the direction that matters: `report` is the
> one thing flatlint shares with putout, so the claim also produced a false
> reason for the size difference below. The real reason is the **unit**.

## How it is tested — an adapter, not a framework

`lib/test/test.js` in full:

```js
import {createTest as createPutoutTest} from '@putout/test';
import {lint} from '#flatlint';

const tupleToObject = (fn) => (...a) => {
    const [code, places] = fn(...a);
    
    return {
        code,
        places,
    };
};

export const createTest = (url, options) => {
    return createPutoutTest(url, {
        lint: tupleToObject(lint),
        ...options,
    });
};
```

**Seven lines, and that is the whole story.** `putout` returns `{code, places}`
and flatlint returns the **tuple** `[code, places]`, so the adapter's only job is
to reshape one into the other and hand `lint` to the same `createTest`. Every
`t.*` operator — `t.report`, `t.transform`, `t.noReport` — is therefore
**`@putout/test`'s**, unchanged.

And `@putout/test` is what `samadhi` reaches:

```
putout ──▶ @putout/test ──▶ @putout/cli-process-file ──▶ samadhi
                                 │                            │
                                 └─ injects eslint,           └─ mocking, which is how
                                    putoutAsync, printer         the overridable deps
                                    via `overrides`             are replaced in tests
```

`initProcessFile` destructures `eslint`, `putoutAsync`, `simpleImport` and
`printer` out of its own `overrides` — that is the seam `samadhi` mocks. So
**flatlint is tested by putout's own harness, with a `lint` swapped in**, and
that is the piece worth knowing before writing a rule in it.

The spec is the standard shape, fixtures beside the rule:

```js
// lib/plugins/remove-useless-assign/index.spec.js
import {createTest} from '#test';
import * as plugin from '#plugin-remove-useless-assign';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-useless-assign', plugin],
    ],
});

test('flatlint: remove-useless-assign: report', (t) => {
    t.report('remove-useless-assign', `Remove useless '='`);
    t.end();
});

test('flatlint: remove-useless-assign: transform', (t) => {
    t.transform('remove-useless-assign');
    t.end();
});
```

```text
lib/plugins/remove-useless-assign/
├── fixture/
│   ├── remove-useless-assign.js        the shape, unfixed
│   ├── remove-useless-assign-fix.js    the expected output
│   ├── function.js                     one shape per fixture
│   └── function-fix.js
├── index.js
└── index.spec.js
```

**One fixture pair per shape, and `t.transform` is named after the *fixture*,
not the rule** — `t.transform('function')` reads `fixture/function.js` against
`fixture/function-fix.js`. That is the same convention as
`packages/plugin-putout-editor`, and it is the part you get wrong first.

## Where this changes how I write a rule here

- one directory per rule, `index.js` beside a `fixture/` of `name.js` +
  `name-fix.js` pairs;
- `report` **first**, then `replace` — the convention already in `AGENTS.md`
  ("`report` is the first export of every rule");
- a `fixCount`-style **bound**, because an unfixed oscillation is a hang.

The one difference from a 🐊**Putout** rule: **there is no `match`.** A
`replace` map *is* the match — the key is the pattern and the presence of the key
is the condition. So a rule whose shape should not fire can only be excluded by
the pattern not matching, and a `t.noReport` fixture is how you prove it.

## Reuse, concretely

- **`fixCount` as a loop bound.** 🐊**Putout**'s runner has no bound; adding one
  there is a one-line change that turns a hang into "did not converge". This is
  the single most transferable idea here.
- **The token-level idea for the editor's own parser** (`packages/client/src/parser`).
  The editor's `apply-batch` runs on *parsed* source, so a file with a syntax
  error cannot be transformed at all. A token pass that can still fix
  `import {a, from 'b'}` is reachable where a plugin is not.