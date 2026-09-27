# qword

The editor layer. See [`putout-plugins.md`](./putout-plugins.md) for the rules that came out of
this, and `create-editor.ts` for the fix.

***

## ✅ vim blockwise visual never extends — `qword` omits `allowMultipleSelections`

`keyMap: 'vim'` was half-broken: `Ctrl-v` entered a visual block, but the block could
never grow. `j`/`k` slid it down the buffer one line at a time instead of extending it,
and `x` deleted a single character rather than the selected column.

**Cause.** Blockwise visual is the one vim mode that needs **more than one selection
range** — `makeCmSelection` in `codemirror-vim-core` returns one range per line of the
block. CodeMirror 6 discards every range but the main one unless the state carries that
facet. In `@codemirror/state`, `resolveTransaction` reduces the selection to a single
range unless the facet is present:

```js
const selection = tr.startState.facet(allowMultipleSelections) ? tr.newSelection : tr.newSelection.asSingle();
```

`qword/client/create.js` builds its own extension list rather than using
`EditorView.basicSetup`, which is where `EditorState.allowMultipleSelections.of(true)`
normally comes from. So the facet was never present, and each transaction flattened the
block to its main (bottom) range.

**Minimum repro** — no application code, just the editor:

```js
import {EditorView} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {vim} from '@replit/codemirror-vim';

new EditorView({
    state: EditorState.create({
        doc: 'abc\ndef\nghi',
        extensions: [vim()],
    }),
    parent: document.getElementById('editor'),
});
```

Then, in vim normal mode on the first line: `Ctrl-v`, `j`, `j`, `x`.

**Got.** `abc\ndef\nhi` — one character deleted. Instrumenting the CM6 state shows why:

| after | `state.selection.ranges` | `vim.sel` |
|---|---|---|
| `Ctrl-v` | `1-0` | `anchor 0,0 / head 0,0` |
| `j` | `5-4` | `anchor 0,0 / head 1,0` |
| `j` | `9-8` | `anchor 0,0 / head 2,0` |

`vim.sel` and the `setSelections` call are both **correct** — `setSelections` really is
handed 2 and then 3 ranges, with the last as primary. They are lost inside
`view.dispatch`, which is where the `asSingle()` above applies.

**Expected.** `bc\nef\nhi` — the whole column gone.

**Solution.** Add the facet. It is `static`, so it has to be in the state rather than
toggled per keystroke; `packages/client/src/editor/create-editor.ts` wraps qword's
`createEditor` and reconfigures the history compartment (which `qword` exposes on
`QwordEditorView` and nothing here reconfigures) to include it. Both packages are at
their latest published versions, so there is no upstream release to wait for.

***

## ❌ a wrong root cause worth not re-investigating

This bug was first reported as a `PasteDropTarget` problem: the `paste` listener on
`document` (capture phase) calls `preventDefault()` when the event is not aimed at a
text field, and the claim was that in vim normal mode `Ctrl-v` fires a `paste` event
whose target is the `.cm-editor` container, so `closest('[contenteditable="true"]')`
missed the `.cm-content` child and the keystroke never reached vim.

**That does not happen.** Measured on a `paste` listener registered on `document` after
the app's own: the event target is a syntax-highlight span (`hl-name`) *inside*
`.cm-content`, so the existing guard already returned `true` and
`defaultPrevented` was `false`. The e2e output was byte-identical with and without the
`activeElement` check.

Two things actually made the report look right, and both are worth writing down:

1. **`page.keyboard.press('Control+V')` is not what a browser sends for Ctrl+V.** It
   delivers `event.key === 'V'`, which matches no codemirror-vim binding — the mapper
   holds `<C-v>`. Nothing handled the key, the browser fired its `paste`, and vim
   landed in **insert mode**, so the following `j`, `j`, `x` were *typed* into the
   buffer (`ajjxbc`). A real Ctrl+V reports `'v'`.
2. **The block is broken with `Control+q` too**, which is bound to the same
   `toggleVisualMode {blockwise: true}` action but fires no paste event at all. That
   single control rules out the whole paste path.

Charwise `v j j` and linewise `V j j y p` both work, which is consistent with the real
cause: they need only one selection range.
