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


## Destructuring a method off a parameter: happy-dom lies, the browser throws

`AstBlock.spec.tsx` hit this first and the answer was **nonsense** rather than an
error — a destructured `getAttribute` returned `undefined` under happy-dom and the
spec failed on the assertion rather than on the cause. The same line inside
`page.evaluate`, in real Chromium:

```js
const rows = [...document.querySelectorAll('.ast-row[data-category]')];

rows.map(({getAttribute}) => getAttribute('data-category'));
```

```
Error: page.evaluate: TypeError: Illegal invocation
    at eval (eval at evaluate (:311:30), <anonymous>:5:11)
```

Destructuring a parameter takes the **value** out of the object, so a method taken
that way is a bare function and calling it binds `this` to `undefined`. Which
element it was called on is then irrelevant.

**The two halves together are the reason to care.** One environment fails the
assertion, the other throws at the call site — so a spec that passes says nothing
about whether the code is right, and only the e2e caught it. `page.evaluate` runs
in the page, not in the test, which is what makes it the honest one.

The rule that would have caught it is
[idea 12](../ideas.md#12-a-rule-for-calling-a-method-with-no-receiver-rejected-putout-blocks-the-fix)
— **rejected**, with the measured blocker: putout refuses a replacement that
introduces a name the pattern does not bind. The call site is a `for..of`, with
the reason written down beside it.
