# Vim blockwise selection in CodeMirror 6

**The essence.** Blockwise visual is the one vim mode that needs *more than one selection
range*. CodeMirror 6 throws all but the main one away unless the state carries the
`allowMultipleSelections` facet — and `qword` builds its own extension list instead of
`EditorView.basicSetup`, which is where that facet normally comes from. The symptom is
`Ctrl-v` entering a block that can never grow: `j`/`k` slide it down one line at a time and
`x` deletes one character.

`packages/client/src/editor/create-editor.ts` adds the facet. It is `static`, so it belongs
in the state rather than being toggled per keystroke.

## A wrong root cause, kept so it is not re-investigated

This was first reported as a `PasteDropTarget` problem: the `paste` listener on `document`
calls `preventDefault()` when the event is not aimed at a text field, and the claim was that
in vim normal mode `Ctrl-v` fires a `paste` whose target is the `.cm-editor` container, so
`closest('[contenteditable="true"]')` misses the `.cm-content` child.

**That does not happen, and it was measured.** On a `paste` listener registered on `document`
after the app's own, the event target is a syntax-highlight span *inside* `.cm-content`, so
the existing guard already returned `true` and `defaultPrevented` was `false`. The e2e output
was byte-identical with and without the check.

Two things made the report look right, and both are worth keeping:

1. **`page.keyboard.press('Control+V')` is not what a browser sends for Ctrl+V.** It delivers
   `event.key === 'V'`, which matches no codemirror-vim binding — the mapper holds `<C-v>`.
   Nothing handled the key, the browser fired its `paste`, and vim landed in **insert mode**,
   so the following `j`, `j`, `x` were *typed* into the buffer. A real Ctrl+V reports `'v'`.
   That measurement is now the rule
   [`apply-press-modifier-case`](../../packages/plugin-putout-editor/README.md#apply-press-modifier-case),
   so a `press('Control+V')` cannot come back.
2. **The block is broken with `Control+q` too**, which is bound to the same
   `toggleVisualMode {blockwise: true}` action and fires no paste event at all. That single
   control rules out the whole paste path.

Charwise `v j j` and linewise `V j j y p` both work, which is consistent with the real cause:
they need only one selection range.

## The measurement, if you ever need to re-check it

After `Ctrl-v`, `j`, `j` in a three-line document, `state.selection.ranges` was `1-0`, `5-4`,
`9-8` — one range each time — while `vim.sel` correctly held 2 and then 3 ranges with the
last as primary. `setSelections` really is handed them; they are lost inside `view.dispatch`,
at `resolveTransaction` in `@codemirror/state`:

```js
const selection = tr.startState.facet(allowMultipleSelections) ? tr.newSelection : tr.newSelection.asSingle();
```

See also [`e2e.md`](./e2e.md) for the `write()`-under-vim trap, which is the other half of
writing e2e tests against this editor.

