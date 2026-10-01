# @putout/plugin-putout-editor [![NPM version][NPMIMGURL]][NPMURL]

[NPMIMGURL]: https://img.shields.io/npm/v/@putout/plugin-putout-editor.svg?style=flat&cacheBust=1
[NPMURL]: https://npmjs.org/package/@putout/plugin-putout-editor "@putout/plugin-putout-editor"

Rules that only make sense here: the Editor's own source, its specs and its CSS. A rule that
would help any 🐊**Putout** user belongs in the [🐊**Putout**](https://github.com/coderaiser/putout)
repo instead, and where each one ended up is in
[`docs/issues/putout-plugins.md`](../../docs/issues/putout-plugins.md).

## Install

The plugin is private and wired in through the root `.putout.json`, so `putout .` already runs
it. It is not published to npm.

A `*-file` rule is a filesystem rule: `off` by default, and enabled by the `.filesystem.json`
match that `redlint` reads. Every other rule is a code rule and runs under `putout .`.

Writing one is in [`docs/plugins.md`](../../docs/plugins.md).

## Rules

- ✅ [apply-boolean-cast-to-typeof](#apply-boolean-cast-to-typeof);
- ✅ [apply-linked-pattern-value](#apply-linked-pattern-value);
- ✅ [apply-press-modifier-case](#apply-press-modifier-case);
- ✅ [check-documented-scripts](#check-documented-scripts);
- ✅ [check-main-imports-in-file](#check-main-imports-in-file);
- ✅ [check-try-catch-destructure](#check-try-catch-destructure);
- ✅ [hoist-arrow-callback](#hoist-arrow-callback);
- ✅ [remove-comments](#remove-comments);
- ✅ [remove-rgb-outside-token-file](#remove-rgb-outside-token-file);
- ✅ [remove-undefined-token-file](#remove-undefined-token-file);
- ✅ [remove-z-index-outside-token-file](#remove-z-index-outside-token-file);

***

## apply-boolean-cast-to-typeof

`Boolean(a) && typeof a === 'object'` is a type guard written with a call, and
`logical-expressions/simplify` rewrites it to `a && typeof a === 'object'` — which returns the
first falsy **operand**, not `false`. The `Boolean()` was doing the coercion and the
simplification deletes it:

```
$ node -e "…"
null      before: false boolean | after: null      object
undefined before: false boolean | after: undefined undefined
0         before: false boolean | after: 0         number
```

In TypeScript that is `TS2322: Type 'unknown' is not assignable to type 'boolean'`, and for a
`value is T` predicate the narrowing is simply wrong downstream. The measured report is in
`~/broken-putout2.md` §1.

`a as boolean && typeof a === 'object'` is what survives. The cast is not a logical expression, so
there is nothing for the simplification to remove, and the result is a `boolean` for the
type-checker. This is the shape `packages/client/src/editor/stringify.ts` already uses.

**The key is `Boolean(__a) && typeof __a === "object"`, and that is not obvious.** `__a` is bound
once and reused, so both sides must name the same placeholder, and a placeholder's name has to be
a single letter. `__a() && typeof __a === "object"` does **not** match — that reads as calling
whatever `__a` bound to. Verified with the mcp `test_pattern` tool rather than by reading.

**Two things a replacer has to know, both learned here.**

`match` is the gate and `replace` is unconditional, so the replacer repeats the same guard — but
returning the path unchanged is **not** how a replacer declines: it still replaces, with whatever
the operator does with the empty return. `isCoercionCall` is what keeps a cast out, and it checks
the left side is a `Boolean()` call and *nothing else*, because `(value as boolean) && …` has the
same shape and would otherwise have its cast stripped.

The cast is built as a **node**, not printed from a string. `path.replaceWithSourceString()` does
not exist on `NodePath` — the operator throws by name if you reach for it — and the string form
that does re-parses as plain JavaScript and fails on the `as` outright:

```
SyntaxError: Unexpected token, expected "," (1:7) - make sure this is an expression.
```

## ❌ Example of incorrect code

```ts
const isObject = (value) => Boolean(value) && typeof value === 'object';
```

## ✅ Example of correct code

```ts
const isObject = (value) => value as boolean && typeof value === 'object';
```

The rule matches the `object` guard only. A guard on another type — `typeof value === 'string'` —
needs a key of its own, and is left alone here.

***

## apply-linked-pattern-value

A pattern value with two underscores binds nothing. `'f(__a__)'` matches **zero** places, and a
replacement written the same way emits the source back unchanged — so the rule reports success
and fixes nothing at all. That is the worst failure in this package: there is no error, no
diff, and an exit code of 0.

The fix is one underscore, and it is always safe: `__a` is a linked value, so the same pattern
starts matching and starts carrying its value into the replacement.

The rule only looks at the **key** of a property, because the key is where a pattern lives. A
string that merely contains `__a__` in a value — a fixture, a report message — is left alone.

The fix **replaces** the string node rather than writing to its `value`. A `StringLiteral`
caches its source text in `extra.raw`, so mutating `value` leaves what the printer emits
completely unchanged — the rule reports, `fix` runs, and the file comes back identical. That is
the same shape of failure as the bug the rule is about, one layer down, and it cost a round trip
to find.

Found while writing `test_pattern` for the mcp: `'f(__a__)' → 'g(__a__)'` came back as the input,
unchanged, exit 0. See `docs/putout-style.md` § Pattern strings.

### ❌ Example of incorrect code

```js
export const replace = () => ({
    'f(__a__)': 'g(__a)',
});
```

### ✅ Example of correct code

```js
export const replace = () => ({
    'f(__a)': 'g(__a)',
});
```

***

## apply-press-modifier-case

A browser reports Ctrl+V as `v`, so a `press('Control+V')` is a chord no keyboard produces. It
matches no binding and fails silently — the browser just fires a paste.

The rule is off for markdown, because this section is a fence it would otherwise correct:
[`docs/memory/fence-gate.md`](../../docs/memory/fence-gate.md).

Found: six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing —
[the finding](../../docs/issues/putout-plugins.md).

### ❌ Example of incorrect code

```js
await page.keyboard.press('Control+V');
await page.keyboard.press('ControlOrMeta+V');
```

### ✅ Example of correct code

```js
await page.keyboard.press('Control+v');
await page.keyboard.press('ControlOrMeta+v');
```

## check-documented-scripts

`AGENTS.md` tells every agent to run `bun run check`, `bun run test:one` and
`bun run coverage:json`. A rule is only as good as the instruction that invokes it, so a command
the documentation promises and the root `package.json` does not define is a defect in the docs
that no test catches.

This rule reads the root `scripts` and reports every `bun run` / `madrun` command written in
`AGENTS.md` or `MEMORY.md` that is not one of them. Only commands inside a code span or a fenced
block count, so the prose "any script madrun does not own" is not read as a command called
`does`, and `madrun --init` is a flag rather than a script name.

It found three: `check`, `test:one` and `coverage:json` were all documented and all missing.
That is [`docs/issues/scripts.md`](../../docs/issues/scripts.md).

It is a `scan` and not a `matchFiles` rule, because the verdict needs a second file: the answer
lives in `package.json` and the question is asked of a `.md`. `matchFiles` hands its inner plugin
one file at a time with no root and no siblings, so the port reports nothing and stays green. The
measurement is in [`docs/plugins.md`](../../docs/plugins.md#matchfiles-cannot-be-made-to-work-for-check-documented-scripts).

**It only worked once, and did not.** The rule reported nothing on the real repository while
every unit test passed, for two reasons that the tests could not see: `getFilename` returns an
**absolute** path under `redlint`, so `isDoc` was false for every file, and `package.json` matched
all five packages, so the root docs were compared against `packages/client`'s scripts. Both are
fixed — `basename` and the nearest `package.json` — and the two regression tests that pin them are
in `index.spec.js`. The story is in [`docs/issues/putout-plugins.md`](../../docs/issues/putout-plugins.md#-check-documented-scripts-never-matched-a-file-redlint-builds-absolute-paths).

## ❌ Example of incorrect code

`AGENTS.md` names a script the root `package.json` does not define: `bun run check`.

## ✅ Example of correct code

The same document, naming only scripts that exist: `bun run lint`, `bun run test`.

***

## check-try-catch-destructure

`try-catch` returns `[e]` when it catches — a **shorter array**, not `[e, undefined]`. So the
mechanical rewrite of a `try`/`catch` into the obvious destructuring throws on the very input it was
written to survive:

```js
import {tryCatch} from 'try-catch';

const [error, {
    scripts = {},
} = {}] = tryCatch(JSON.parse, content);
```

A default fires for `undefined`, and `JSON.parse('null')` returns `null`, so the destructure blows up
**outside** the `try` that was meant to catch it. `{"scripts":null}` does the same one level in, and
both are real `package.json` contents.

The whole suite was green with this in place. The rule reports the two shapes and pins them with a
fixture each, because "reports too much" and "reports nothing" being the same green is the failure
that cost the time.

Report-only: the fix is a judgement call about what to do with the value, so there is no automatic
one. The shape to prefer is in
[`docs/memory/putout-rules.md`](../../docs/memory/putout-rules.md#trycatch-returns-a-shorter-array-when-it-catches).

**Worth landing upstream.** The gap is in `@putout/plugin-try-catch` itself — a sibling rule
complimenting it, not a repo-specific concern.

### ❌ Example of incorrect code

```js
import {tryCatch} from 'try-catch';

const [error, {
    scripts = {},
} = {}] = tryCatch(JSON.parse, content);
```

### ✅ Example of correct code

```js
import {tryCatch} from 'try-catch';

const [error, parsed] = tryCatch(JSON.parse, content);
const {scripts = {}} = parsed || {};
```

***

## hoist-arrow-callback

`files.filter((file) => isFile(file))` allocates an arrow and buries the predicate in the call. The
predicate is the thing with a name, and the call is not where you look for it. A named binding is
also testable on its own; an inline one is only reachable through the call that uses it.

A block body is left alone — `filter((file) => { ... })` has statements the move would reformat,
and the predicate is not the point there. A **destructured** parameter is left alone too, and that
is the one judgement call: `places.map(({position}) => position)` hoists perfectly well, but the
name the binding would take is not in the parameter, so the rule reports the shape it can act on
and the naming question belongs to the fixer.

**Scoped off for spec and test files**, at the root `.putout.json` rather than this package's —
a `match` here does not reach `packages/client`, where most of the 69 sites it found on arrival
lived. A spec asserting `find(({type}) => …)` reads better inline, and hoisting it would be noise.

Report-only. The fix needs a **name** for the hoisted callback, and a parameter called `file`
produces `file` — which shadows the parameter it came from, and a callback whose name is taken in an
outer scope is a rename decision, not a mechanical one. That belongs in
[`docs/ideas.md`](../../docs/ideas.md).

The one shape 🐊**Putout** already fixes is `(x) => f(x)` — a callback that only forwards its
parameter, for `filter`, `find`, `findIndex`, `some` and `every`. `remove-useless-functions`
rewrites that to `f`, and it should: nothing is lost but the arrow. This rule is about the rest,
where the callback carries a **predicate the name does not give you**.

### ❌ Example of incorrect code

```js
const packages = names.filter((name) => name.startsWith('@putout/'));
```

### ✅ Example of correct code

```js
const isPutoutPackage = (name) => name.startsWith('@putout/');

const packages = names.filter(isPutoutPackage);
```

***

## check-main-imports-in-file

`main.css` is an entry point: `@import` and nothing else. The layout, and the reasons for it,
are in [`packages/client/css/README.md`](../client/css/README.md).

Report-only — which file a rule belongs in is a judgement call.

Found: a rule in `main.css` —
[the finding](../../docs/issues/putout-plugins.md).

### ❌ Example of incorrect code

```css
@import './tokens.css';

.a {
    color: red;
}
```

### ✅ Example of correct code

```css
@import './tokens.css';
@import './reset.css';
```

***

## remove-comments

A rule in this directory says what the code already says. The name and this section are where
the *why* belongs; the code keeps the what.

Found: the `scripts/check-comments.js` gate, as a rule —
[the finding](../../docs/issues/putout-plugins.md#-a-fixer-can-simplify-a-rule-into-a-different-rule-and-every-test-still-passes).

### ❌ Example of incorrect code

```js
// a browser reports Ctrl+V as "v"
const MODIFIERS = [
    'Control',
    'Shift',
];
```

### ✅ Example of correct code

```js
const MODIFIERS = [
    'Control',
    'Shift',
];
```

***

## remove-rgb-outside-token-file

Colours are tokens. `css/tokens.css` holds them; a hardcoded colour is a second place to change
a theme.

Report-only — which token a colour becomes is a human decision.

Found: the one hardcoded colour outside `css/tokens.css` —
[the finding](../../docs/issues/putout-plugins.md).

### ❌ Example of incorrect code

```css
.a {
    box-shadow: 0 -4px 16px rgb(0 0 0 / 20%);
    color: #ff0000;
}
```

### ✅ Example of correct code

```css
.a {
    box-shadow: 0 -4px 16px var(--color-shadow);
    color: var(--color-accent);
}
```

***

## remove-undefined-token-file

A `var(--x)` that no stylesheet defines renders nothing: the browser drops the whole property, so
a selector looks styled and is not.

The other half of the two rules above — those say a value belongs in `tokens.css`, this says you
thought you put it there and did not. Report-only, because a missing token needs a value.

Found: `var(--color-selection-bg)` in `codemirror.css`, next to a `--color-selection-focused`
that did exist — [the finding](../../docs/issues/putout-plugins.md).

### ❌ Example of incorrect code

```css
.a {
    background: var(--color-selection-bg);
}
```

### ✅ Example of correct code

```css
.a {
    background: var(--color-selection-focused);
}
```

***

## remove-z-index-outside-token-file

The same rule for the stacking order. Report-only — which `--z-*` name a number becomes is a
human decision.

Found: seven raw `z-index` numbers across three stylesheets, now a `--z-*` scale —
[the finding](../../docs/issues/putout-plugins.md).

### ❌ Example of incorrect code

```css
.a {
    z-index: 200;
}
```

### ✅ Example of correct code

```css
.a {
    z-index: var(--z-dialog);
}
```

***

## Findings

Each rule links its own finding above. What is not a rule here is in
[`docs/issues/putout-plugins.md`](../../docs/issues/putout-plugins.md) too:
`apply-type-check` fires on domain types that share a name with a node type, and a fixer that
exits clean on a change it cannot see is a gap rather than a preference.
