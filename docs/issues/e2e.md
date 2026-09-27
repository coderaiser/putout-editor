# e2e

---

## ✅ `write()` never cleared the buffer under the `vim` keymap

`write()` in `e2e/desktop/putout-editor.ts` and `e2e/mobile/putout-editor.ts` replaced the
buffer with `ControlOrMeta+a` then `insertText`. It selected nothing, so the text was appended
to whatever the editor already held.

**Cause.** The default keymap is `vim` (`src/store/state.ts` -> `keyMap: 'vim'`), and
codemirror-vim binds `<C-a>` to `incrementNumber`. The key is consumed by vim and never
reaches CodeMirror's `selectAll`, so the following `insertText` landed at the cursor.

Measured on the app, with the default code example loaded:

```js
await locator.click();
await locator.focus();
await page.keyboard.press('ControlOrMeta+a');
console.log(await page.evaluate(() => String(window.getSelection())));
// ""  - nothing is selected
```

**Got.** 5 `toContainText` timeouts, because the expected text was buried in the previous
buffer rather than replacing it. `syntax error in editor-source renders codeframe` is the
clearest one — the intended `function() {` was spliced into the middle of a comment:

```
   8 | 'Transform your code with 🐊Putout' ?>
   9 |     console.log('Codemods never been as sifunction() {
      |                 ^ Unterminated string constant. (9:16)
  10 |     11 |                 }mple 🎈') :
```

**Expected.** `function() {` as the whole document, so the codeframe reads `Unexpected token`.

**Solution.** `locator.selectText()`, which goes through the DOM selection rather than a key
press, so no keymap can intercept it. `Escape` afterwards would re-dispatch the buffer to vim
and undo the selection, so it must not follow.

Worth knowing: this hid for as long as it did because `write()` still *worked* for every test
that only ever typed into an **empty** editor, and a stale `out/` made all of them fail anyway.
