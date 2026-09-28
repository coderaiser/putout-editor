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

- ✅ [apply-press-modifier-case](#apply-press-modifier-case);
- ✅ [check-main-imports-in-file](#check-main-imports-in-file);
- ✅ [remove-comments](#remove-comments);
- ✅ [remove-rgb-outside-token-file](#remove-rgb-outside-token-file);
- ✅ [remove-undefined-token-file](#remove-undefined-token-file);
- ✅ [remove-z-index-outside-token-file](#remove-z-index-outside-token-file);

***

## apply-press-modifier-case

A browser reports Ctrl+V as `v`, so a `press('Control+V')` is a chord no keyboard produces. It
matches no binding and fails silently — the browser just fires a paste.

The rule is off for markdown, because this section is a fence it would otherwise correct:
[`docs/issues/markdown.md`](../../docs/issues/markdown.md).

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
[the finding](../../docs/issues/putout-plugins.md#💡-a-fixer-can-simplify-a-rule-into-a-different-rule-and-every-test-still-passes).

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
