# @putout/plugin-putout-editor [![NPM version][NPMIMGURL]][NPMURL]

[NPMIMGURL]: https://img.shields.io/npm/v/@putout/plugin-putout-editor.svg?style=flat&cacheBust=1
[NPMURL]: https://npmjs.org/package/@putout/plugin-putout-editor "@putout/plugin-putout-editor"

> 🐊**Putout** rules for the 🐊**Putout Editor** repository itself.
>
> (c) 🐊[**Putout**](https://github.com/coderaiser/putout)

Rules that only make sense here: the Editor's own source, its specs and its CSS. Anything
that would help any 🐊**Putout** user belongs in the [🐊Putout](https://github.com/coderaiser/putout)
repo instead - see `docs/issues/putout-plugins.md` in the Editor for where each one ended up.

## Install

The plugin is private and wired in through `plugins` in the repository's root `.putout.json`,
so `putout .` and `redlint scan` already run it. It is not published to npm.

## Rules

- ✅ [apply-press-modifier-case](#apply-press-modifier-case);
- ✅ [check-main-imports-only](#check-main-imports-only);
- ✅ [remove-comments](#remove-comments);
- ✅ [remove-duplicated-receiver](#remove-duplicated-receiver);
- ✅ [remove-rgb-outside-tokens](#remove-rgb-outside-tokens);
- ✅ [remove-undefined-token](#remove-undefined-token);
- ✅ [remove-z-index-outside-tokens](#remove-z-index-outside-tokens);

***

## apply-press-modifier-case

A browser reports Ctrl+V as `v`. Playwright's `press('Control+V')` sends `V` with no Shift
keydown, which is a chord no keyboard produces: it matches no binding and fails silently,
because the browser just fires a paste instead.

The rule is off in the `*.md` match in the repository's root `.putout.json`, because this very
section is a fence the rule would otherwise correct — see `docs/issues/markdown.md`.

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

***

## check-main-imports-only

`main.css` is an entry point: `@import` lines and nothing else. The stylesheet layout and
the reasons for it are in [`packages/client/css/README.md`](../client/css/README.md).

This is a **filesystem** rule, so it runs under `redlint`, not under `putout .`. A 🐊Putout
rule sees one AST and knows nothing about filenames, which is why "only in this file" has to
be expressed against the tree.

Report-only: which file a rule belongs in is a judgement call, so the file is returned
unchanged.

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

A rule in this directory says what the code already says. The name and the README section are
where the *why* belongs; the code keeps the what. A comment explaining a chord no keyboard
produces is the rule restated in prose, and it goes stale without failing.

`leadingComments`, `trailingComments` and `innerComments` are all on the AST, so this is an
ordinary rule - no script, no separate lint step.

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

## remove-duplicated-receiver

`a && a.b()` calls `a` twice. That is only safe when `a` is a plain read, and it usually is not:
`getState() && getState().value` runs the store getter twice, and a second read can disagree with
the first.

This is what a mechanical `?.` expansion leaves behind — `a?.b()` becomes `a && a.b()` — so it
arrives in batches rather than one at a time. See `docs/issues/putout-plugins.md`.

The matcher only fires when the receiver **contains a call**, so `q.r && q.r.s()` and
`p && p.toString()` are left alone: reading a property is not a side effect, and a rule that
flagged those would be noise.

It **fixes**, because a rule that only reports is the thing this package exists to replace.
There are three statement contexts and all three are handled:

A **declaration** is split — the receiver is bound once, above it. A **return** gets the binding
inserted before it. A concise **arrow body** is turned into a block, which is the only way a
declaration fits inside an expression:

```js
const arrow = (el) => {
    const {text} = el();
    return text && text.trim();
};
```

```js
const arrow = (el) => {
    const {text} = el();
    return text && text.trim();
};
```

The name is a property of the receiver, never a callee — deriving it from a bare call produced
`const f = f()`, a temporal-dead-zone self-reference that throws on the first line. It is also
checked against the scope, so a name that is already taken is **reported and left alone** rather
than shadowed.

Rewriting an arrow into a block is a bigger change than the line it replaces, and that is the
point: a fixer that stops at "I cannot express this" leaves the reader with work, and work is
what the rule was supposed to remove.

### ❌ Example of incorrect code

```js
const value = getState().workbench && getState().workbench.code;
```

### ✅ Example of correct code

```js
const {workbench} = getState();
const value = workbench && workbench.code;
```

***

## remove-rgb-outside-tokens

Colours are tokens. `css/tokens.css` holds them, and every other stylesheet reaches for a
`var()`. A hardcoded colour is a second place to change a theme.

This is a **filesystem** rule, built on `matchFiles`, so it sees the tree rather than one
file - and therefore runs under `redlint`, not under `putout .`.

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

Report-only: which token a colour becomes is a human decision, so the replacement is the
node printed back unchanged.

***

## remove-undefined-token

A `var(--x)` that no stylesheet defines is a declaration that renders nothing. The browser
drops the whole property, so the rule exists because the cost is invisible: a selector that
looks styled, and is not.

This is the other half of `remove-rgb-outside-tokens` and `remove-z-index-outside-tokens`. Those
say a value belongs in `tokens.css`; this says you thought you put it there and did not. It is
a **filesystem** rule, built on `matchFiles`, so it sees the tree rather than one file — and
therefore runs under `redlint`, not under `putout .`.

Report-only: a missing token needs a value, and a value is a human decision. The one it found
in this repository was `var(--color-selection-bg)` in `codemirror.css`, next to a
`--color-selection-focused` that did exist — the dark-theme unfocused selection background had
been renamed on one side of a pair, and the dead rule was the symptom.

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

## remove-z-index-outside-tokens

The same rule for the stacking order. Seven raw `z-index` numbers across three stylesheets
are now a `--z-*` scale in `tokens.css`.

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

`docs/issues/putout-plugins.md` has what each rule found, plus the one thing that is not a
rule here: `apply-type-check` also fires on domain types that share a name with a node type.
