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
and `@putout/operator-keyword` are all the same packages. Nineteen of the 33
shipped plugins are exactly these two exports; the other fourteen add the
`match` described below.

All 33 open with `report`, and `replace` is present in every one — so
`packages/plugin-putout-editor`'s "`report` is the first export of every rule"
holds in a codebase that shares no lint config with this one.

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
- `report` **first**, then `match` (if any), then `replace` — the convention
  already in `AGENTS.md` ("`report` is the first export of every rule"), and all
  33 shipped plugins put it there;
- a `fixCount`-style **bound**, because an unfixed oscillation is a hang;
- a `match` key must be a `replace` key, or it does nothing — and the negative
  fixture is the only thing that tells you it works.

## And it DOES have a `match` — 14 of the 33 plugins

> **Correction, twice.** An earlier version of this file said *"flatlint has no
> `report` concept at all"*, then *"there is no `match`"*. Both came from reading
> `lib/flatlint.js` and **never opening a plugin**. Measured by importing every
> plugin in `/home/coderaiser/flatlint/lib/plugins` and calling `match()` and
> `replace()`: **14 of 33 plugins (42%) export `match`, 49 keys in all.**
>
> The `report` correction was in the direction that mattered — `report` is the one
> thing flatlint shares with putout — so this second one is worse, because
> `match` is the thing a rule author reaches for when a token pattern is too
> broad, and the doc told them not to.

The whole mechanism is one line of `lib/runner/replacer.js`, quoted verbatim. It
is a `text` fence and not a `js` one because a `js` fence is linted as real
JavaScript here, and this repo's own `optional-chaining` rule would demand a
rewrite of a quote that has to stay exactly as it is:

```text
const match = plugin.match?.() || returns({});
```

`match` is not a putout-shaped `match` that flatlint happens to ignore. It is
**the same contract, one unit lighter**, and it is keyed by *the same key it
guards*:

```js
import {
    closeRoundBrace,
    colon,
} from '#types';

export const report = () => 'Add missing round brace';

export const match = () => ({
    '__a(__args': (vars, path) => !path.isNextPunctuator(closeRoundBrace),
    '__a;': (vars, path) => !path.isPrevPunctuator(colon),
});

export const replace = () => ({
    '__a(__args': '__a(__args)',
    '__a;': '__a);',
});
```

Two facts that decide how you write it, both measured rather than read off:

| | |
|---|---|
| a `match` key that is **not** a `replace` key | **0 of 49** — the convention holds in every shipped plugin |
| `replace` keys acting with **no** guard | **51 of 100** — so `match` is per-key, not per-plugin |

The second number is the one that changes the advice. A guard is not the norm; a
`replace` key with no guard is the *majority*, so "add a `match`" is a decision
about one key and not a requirement of the plugin.

### What a `match` fn actually gets

`(vars, path) => boolean`. `vars` is the `__a`/`__b` bindings the key declared;
`path` is a **token** path with **22** methods — `getPrev`, `getAllPrev`,
`getAllNext`, `isPrevKeyword`, `isNextKeyword`, `isPrevIdentifier`,
`isNextIdentifier`, `isPrevPunctuator`, `isNextPunctuator`,
`isCurrentPunctuator`, `isPrevDeclarationKeyword`, `isPrevAnyDeclarationKeyword`,
`isNextCompare`, `isNextCompareAll`, `isNextDeclarationKeyword`,
`isNextTemplateHead`, `isNextTemplateTail`, `isInsideTemplate`, `isPrevInvalid`,
`isNext`, and the two raw `tokens`/`start`/`end` reads.

There is no `parentPath` and no `node`, because there is no AST — which is the
one place flatlint is genuinely lighter than putout rather than the same.

Returning false skips that occurrence **entirely**: no fix *and* no report, so a
guarded-out shape produces no `places` either. That is what makes a guard a
guard, and it is why the negative fixture is the only proof one exists.

### The failure mode worth knowing, because nothing catches it

A `match` key that is not a `replace` key is **dead**: the runner looks the
guard up by the replace key it is iterating, so that guard is never called and
the rule fires on every occurrence its author believed they had excluded. Run it
with the guard returning `false` and `const a = 1;` still becomes
`const a = 1 = 0;` — silently, with exit 0, and with every test green if there
is no negative fixture.

No shipped plugin has this bug, which is exactly why it is worth naming: it is
invisible from the code and only a `match`-key-vs-`replace`-key comparison finds
it. The `flatlint_rule` MCP tool now does that comparison, off the AST — a key
is a *pattern*, so `'(__args) {'` ends in a brace and a brace-counting reader
calls a fourteen-key plugin an empty one.

## Reuse, concretely

- **`fixCount` as a loop bound.** 🐊**Putout**'s runner has no bound; adding one
  there is a one-line change that turns a hang into "did not converge". This is
  the single most transferable idea here.
- **The token-level idea for the editor's own parser** (`packages/client/src/parser`).
  The editor's `apply-batch` runs on *parsed* source, so a file with a syntax
  error cannot be transformed at all. A token pass that can still fix
  `import {a, from 'b'}` is reachable where a plugin is not.
## A check written from the *name* of a thing cannot know what it does

`flatlint_rule` answered `✗ has a match export … a match is putout's shape and is
ignored here` — for a language that **honours `match`**. An author following that
advice would have deleted a guard the engine runs, so this was a tool that was
*wrong* rather than silent, which is the expensive kind.

The check read the **exports** — `report`, `replace`, `match` — and decided
correctness from the *presence of a name*. It never asked what the name means, so
it could only encode the belief it was written from. Two reasons the whole suite
stayed green while it rejected 42% of the rules it exists to help write:

- there was no fixture carrying a `match`, and
- the one real fixture, `remove-useless-assign`, is a two-export plugin that
  looks **identical** under both beliefs.

The replacement check reads the two maps and compares **keys**: a guard whose key
is absent from `replace` is dead, because the runner looks a guard up by the
replace key it is iterating. It has to be on the AST, since a key is a *pattern* —
`'(__args) {'` ends in a brace, and a brace-counting first attempt called a
fourteen-key plugin an empty one.

**The generalisable half**, which is not flatlint-specific: *a check cannot be
written from the name of a thing; it has to be written from what the thing does.*
Both halves of that were violated — the claim came from the entry point, and the
check was written from the claim.

**The pin that catches this class** is one loop: feed the checker **every** rule in
the target codebase and assert none is rejected. 33 files, and it answers "is this
tool fit for purpose" instead of "does this rule have three exports". A doc which
says a thing *cannot* happen needs its evidence to be a measurement and not an
omission.
