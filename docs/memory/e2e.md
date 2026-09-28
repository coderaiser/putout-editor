# e2e tests against the editor

**The essence.** The default keymap is `vim` (`src/store/state.ts`), and codemirror-vim binds
`<C-a>` to `incrementNumber`. So `write()` built on `press('ControlOrMeta+a')` selected
**nothing** — the key never reaches CodeMirror's `selectAll` — and `insertText` appended to
whatever the editor already held.

Use `locator.selectText()`. It goes through the DOM selection rather than a key press, so no
keymap can intercept it. Do not follow it with `Escape`: that re-dispatches the buffer to vim
and undoes the selection.

**Two consequences for writing a test.** An indenting `press('Enter')` or `press('Tab')` has to
come *after* `write()`, because `write()` clicks the editor and drops out of insert mode — and
the text after it must be `page.keyboard.insertText(...)`, not a second `write()`. And a stale
`out/` makes every test fail for a different reason: e2e serves the prebuilt bundle, so a fix
that "does nothing" is usually a bundle that was never rebuilt.

**Why it hid so long:** `write()` still worked for every test that only typed into an *empty*
editor, and the stale bundle was failing everything anyway.

