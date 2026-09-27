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

- ✅ [apply-type-check](#apply-type-check);
- ✅ [press-modifier-case](#press-modifier-case);
- ✅ [remove-rgb-outside-tokens](#remove-rgb-outside-tokens);
- ✅ [remove-z-index-outside-tokens](#remove-z-index-outside-tokens);

***

## apply-type-check

`node.type === 'CallExpression'` says the same thing as `isCallExpression(node)` in fewer
characters, and the `is*` helpers live in `types` where they are tested once instead of in
every rule that needs a node kind. The optional-chaining form goes too: `arg?.type` is not
shorter than `isStringLiteral(arg)`, it is a second thing to read.

### ❌ Example of incorrect code

```js
const isCall = isCallExpression;
const isString = isStringLiteral;
const isProgram = (node) => !isProgram(node);
```

### ✅ Example of correct code

```js
import {types} from 'putout';

const {
    isCallExpression,
    isStringLiteral,
    isProgram,
} = types;

const isCall = isCallExpression;
const isString = isStringLiteral;
const isProgramNode = (node) => !isProgram(node);
```

The rule only rewrites a comparison whose value has a real helper behind it, which is what
keeps `action.type === 'snippet/save'` - a redux action type, not an AST node - out of scope.

***

## press-modifier-case

A browser reports Ctrl+V as `v`. Playwright's `press('Control+V')` sends `V` with no Shift
keydown, which is a chord no keyboard produces: it matches no binding and fails silently,
because the browser just fires a paste instead.

### ❌ Example of incorrect code

```js
await page.keyboard.press('Control+v');
await page.keyboard.press('ControlOrMeta+v');
```

### ✅ Example of correct code

```js
await page.keyboard.press('Control+v');
await page.keyboard.press('ControlOrMeta+v');
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

`docs/issues/putout-plugins.md` has what each rule found, plus the two things that are not
rules: a putout rule cannot see comments, so `scripts/check-comments.js` covers that, and
`apply-type-check` also fires on domain types that share a name with a node type.
