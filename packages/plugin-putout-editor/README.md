# @putout/plugin-putout-editor [![NPM version][NPMIMGURL]][NPMURL]

[NPMIMGURL]: https://img.shields.io/npm/v/@putout/plugin-putout-editor.svg?style=flat&cacheBust=1
[NPMURL]: https://npmjs.org/package/@putout/plugin-putout-editor "@putout/plugin-putout-editor"

> 🐊**Putout** rules for the 🐊**Putout Editor** repository itself.
>
> (c) 🐊[**Putout**](https://github.com/coderaiser/putout)

Rules that only make sense here: the Editor's own source, its specs and its CSS. Anything
that would help any 🐊**Putout** user belongs in the [🐊**Putout**](https://github.com/coderaiser/putout)
repo instead - see `docs/issues/putout-plugins.md` in the Editor for where each one ended up.

## Install

The plugin is private and wired in through `plugins` in the repository's root `.putout.json`,
so `putout .` and `redlint scan` already run it. It is not published to npm.

**A rule named `*-file` is a filesystem rule and is `off` by default**, the same as
`esm/apply-namespace-to-imported-file` and the other file rules in the 🐊**Putout** repo. It is
enabled by the `.filesystem.json` match in the root `.putout.json`, which is the file `redlint`
reads, and that is the only place it runs. A rule without the suffix is a code rule and runs
under `putout .` as usual.

## Rules

- ✅ [apply-press-modifier-case](#apply-press-modifier-case);
- ✅ [check-main-imports-in-file](#check-main-imports-in-file);
- ✅ [remove-comments](#remove-comments);
- ✅ [remove-rgb-outside-token-file](#remove-rgb-outside-token-file);
- ✅ [remove-undefined-token-file](#remove-undefined-token-file);
- ✅ [remove-z-index-outside-token-file](#remove-z-index-outside-token-file);

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

## check-main-imports-in-file

`main.css` is an entry point: `@import` lines and nothing else. The stylesheet layout and
the reasons for it are in [`packages/client/css/README.md`](../client/css/README.md).

This is a **filesystem** rule, so it runs under `redlint`, not under `putout .`. A 🐊**Putout**
rule sees one AST and knows nothing about filenames, which is why "only in this file" has to
be expressed against the tree.

`check-main-imports-in-file/` is the rule that decides what is wrong with the file, as an
**includer** over the CSS calls: everything is included, `cssImport` is filtered out, and
anything left standing is a rule in an entry point. The wrapper itself is filtered out too —
an empty `main.css` reaches the rule as `raw('{}')`, which is an upstream fallback and is
recorded in `docs/memory/putout-rules.md`. See `docs/plugins.md` for when a rule should be
split that way.

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

Colours are tokens. `css/tokens.css` holds them, and every other stylesheet reaches for a
`var()`. A hardcoded colour is a second place to change a theme.

This is a **filesystem** rule, so it sees the tree rather than one file - and therefore runs
under `redlint`, not under `putout .`. What is wrong with a given stylesheet is a separate
rule, `remove-rgb/`, with its own fixtures and its own spec; this file only picks the files and
prefixes the message with the filename. See `docs/plugins.md` for when a rule should be split
that way.

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

## remove-undefined-token-file

A `var(--x)` that no stylesheet defines is a declaration that renders nothing. The browser
drops the whole property, so the rule exists because the cost is invisible: a selector that
looks styled, and is not.

This is the other half of `remove-rgb-outside-token-file` and `remove-z-index-outside-token-file`. Those
say a value belongs in `tokens.css`; this says you thought you put it there and did not. It is
a **filesystem** rule and therefore runs under `redlint`, not under `putout .`.

`check-token/` is the rule that decides what is wrong with one stylesheet, as a **Matcher**
over `functionValue('var', …)` with the defined names passed in as `options`. The outer `scan`
is what makes it a filesystem rule: it reads `tokens.css` to build the list, converts each
stylesheet with the CSS processor, and hands it over. It stays a `scan` rather than
`matchFiles` because `matchFiles` gives its inner plugin no root and no sibling file, so it
cannot know what `tokens.css` declares — see `docs/memory/putout-rules.md`.

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

## remove-z-index-outside-token-file

The same rule for the stacking order. Seven raw `z-index` numbers across three stylesheets
are now a `--z-*` scale in `tokens.css`.

This is a **filesystem** rule built on `matchFiles`, so the mask and the `exclude` are data.
What is wrong with a given stylesheet is a separate rule, `apply-z-index-token/`, with its own
fixtures and its own spec; this file only picks the files and prefixes the message with the
filename. See `docs/plugins.md` for when a rule should be split that way, and
`apply-namespace-to-imported-file` in the 🐊**Putout** repo for the same shape.

Report-only: which `--z-*` name a number becomes is a human decision, so the replacement is the
node printed back unchanged, and a spec runs the fix to prove the file comes back byte for byte.

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
