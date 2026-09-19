# CSS

The styles are split into focused files — one concern per file. If you're
about to put something in `main.css` directly, don't: it's an entry point,
not a home for rules.

## Files

| File | What goes here |
|------|----------------|
| `main.css` | `@import` statements only. Nothing else, ever. |
| `tokens.css` | Every CSS custom property. Colors, spacing, `--toolbar-height`, etc. Dark-mode overrides live here too. |
| `reset.css` | Base `html` styles, `box-sizing`, font stack. |
| `layout.css` | Top-level structure: `#root`, split panes, `.output`, `.editor`. |
| `toolbar.css` | `#Toolbar` and everything inside it. |
| `dialog.css` | `.dialog`, `.cover`, `.dropIndicator`, `.banner`. |
| `codemirror.css` | All `.cm-*` overrides. CodeMirror internals only. |
| `highlight.css` | Syntax highlight color tokens. |
| `mobile.css` | Responsive breakpoints and mobile-specific layout. |

Component styles (loading spinner, error message, share dialog, etc.) live
next to their component and are imported directly by the `.tsx` file.

## Rules

**All colors are tokens.** No color literals outside `tokens.css` — no hex,
no named colors, no `rgb()`, no `hsl()`. Use `var(--color-*)` everywhere.
Exception: `transparent`, `currentColor`, and `inherit` are semantic values,
not palette colors — they're fine anywhere.

**Dark mode is `[data-theme='dark']`, not `@media`.** The theme toggle sets
`data-theme` on `<html>` — that's the only mechanism. A `@media
(prefers-color-scheme: dark)` block outside `tokens.css` is always wrong.

**Component styles stay with their component.** Adding styles for `Foo.tsx`?
Create `Foo.css` next to it and import it there. Don't touch global files.

**Selectors are flat.** Deep nesting or high specificity means the rule
belongs somewhere else.

## Finding things

Lost a class? `grep -r "class-name" src/` shows which component owns it —
the CSS file will be right next to it. For global styles, the file names
above map directly to what's inside.

## Automated checks

Architecture rules are enforced by `scripts/check-css.js` (run as part of
CI). A failing check means a rule was broken — fix the CSS, not the check.
