# Plan: format on `keydown` instead of `blur`

Goal: make the 4 new e2e tests in `e2e/desktop.ts` pass without editing them, keep all
827 unit tests green with **100% coverage of every touched file**, and keep all e2e
projects (desktop-chrome, mobile-safari, mobile-chrome) green.

- Repo: `/home/coderaiser/putout-editor` (package: `packages/client`)
- Tests are the spec: `e2e/desktop.ts:248-317`

```
editor-source: cursor stays on same line after format on keydown   (248)
editor-source: content is formatted after keydown                  (270)
editor-transform: cursor stays on same line after format on keydown(284)
editor-transform: content is formatted after keydown               (305)
```

## 1. Current state (verified)

Formatting pipeline today (blur-based):

```
Editor.js          on(editor, 'blur', onBlur)          <- qword event on contentDOM
editor-source      onBlur={() => dispatch(editorBlur())}
editor-transform   onBlur={() => dispatch(transformBlur())}
formatMiddleware   editorBlur    -> formatInput(source, parseResult.ast) -> setCode({code, cursor: 0})
                   transformBlur -> formatRule(source) -> setTransformState({code})
```

Problems found by running `npm run build` + `npx playwright test --project=desktop-chrome`
(ground truth, 19 pass / 3 fail):

| e2e test | result | root cause |
|---|---|---|
| 248 source: cursor line | FAIL 30s timeout | `.cm-activeLine` **does not exist**: qword's `createEditor` never adds `highlightActiveLine()`; e2e `cursorLine()` waits for it forever |
| 270 source: formatted | FAIL assertion | editor is **not focused** after `goto()`, so `press('i')`/`Ctrl+A` go to `<body>`; `pressSequentially` focuses mid-typing and vim normal-mode keys eat chars (`cons` + `/` gone, received `t x=1**...`). Also nothing formats on keydown yet, and blur-format would reset the cursor anyway (`setCode cursor: 0` + full-doc `setValue`) |
| 284 transform: cursor line | FAIL 30s timeout | same `.cm-activeLine` cause |
| 305 transform: formatted | PASS (vacuous) | passes because mangled rule text fails `formatRule` parse -> no-op -> default transform content (already containing `report = ()`) is read |

Additional facts checked:

- `qword/client/events.js`: `on/off` are plain `contentDOM.addEventListener` wrappers ->
  `on(editor, 'keydown', fn)` works.
- `qword/client/content.js`: `setValue` replaces `[0, doc.length]` -> CM6 maps the selection
  through the whole replacement -> cursor lands on the wrong line. A **minimal-diff** change
  dispatch lets CM6 map the cursor onto the same line by itself.
- `parseCode(parser, code, parserSettings)` already exists in `src/store/operations.ts`
  (used by `parserMiddleware`) — parser-aware fresh parse, no staleness.
- `store.cursor` is intentionally not overwritten by `setCode` when cursor is falsy
  (`reducers.ts:198`).
- innerText behaviour: a doc ending with `\n` renders one extra `\n` in `.cm-content`
  innerText (confirmed via the failure diff of test 270: default example ends with `\n`,
  received ends with two). So for `read() === 'const x = 1;'` the doc must be exactly
  `const x = 1;` — the printer's trailing newline must be **adapted to the doc's own
  trailing-newline state**.
- Timing: `press('Escape')` happens ~30ms after the last typed char, but the
  `onContentChange` debounce is 200ms -> at keydown time the store is stale. The keydown
  handler must **flush** the pending content change before dispatching the format action.
- CI (`.github/workflows/nodejs.yml`) runs: `test:dts`, `fix:lint`, `coverage`
  (`c8 tape "src/**/*.spec.{js,ts,tsx}"`), `build`, `test:e2e`.

## 2. Design

"Instead of blur we use keydown":

```
Editor.js (contentDOM keydown)
  1. flush: cancel 200ms timer, push {value: getValue(editor), cursor: getCursorIndex(editor)}
     through onContentChange  -> store always fresh at format time
  2. skip format dispatch for printable keys (event.key.length === 1)
     -> typing never triggers a mid-word reformat (deterministic, no races);
        Escape / arrows / Enter / Tab / Home... do trigger it
  3. onKeyDown(event) -> editor-source: dispatch(editorKeydown())
                        editor-transform: dispatch(transformKeydown())

formatMiddleware
  editorKeydown:    parseCode(parser, source, parserSettings)   <- fresh, parser-aware
                    -> formatInput(source, ast)                 <- printer, adapted trailing \n
                    -> staleness guard (code unchanged?)        <- same pattern as parserMiddleware
                    -> setCode({code: formatted})
  transformKeydown: formatRule(source)                          <- parses itself, already fresh
                    -> staleness guard
                    -> setTransformState({code: formatted})

Editor.js value-effect
  apply external value changes with a MINIMAL DIFF (src/editor/changes.ts)
  -> CM6 maps the selection through the small change -> cursor stays on the same line
```

Key decisions:

1. **Fresh parse inside the middleware, not `parseResult.ast`** — the store's ast lags
   200ms+ behind the doc; printing a stale ast would clobber newer edits.
2. **Trailing-newline convention in `format.ts`**: `print(ast)` always ends with `\n`;
   the result is trimmed iff the source does not end with `\n`. Keeps a user-typed
   trailing newline (test 248 types 3 lines; the Enter-keydown format must not eat the
   newline) and makes test 270 exact-match (`const x = 1;`).
3. **Printable-key skip** (`event.key.length === 1`): Escape still fires before `l`, so
   all 4 tests are satisfied; humans never get their in-progress line reformatted
   mid-word.
4. **Staleness guard after every await** in the middleware: if `getCode(state)` changed
   while formatting, bail out (prevents clobbering; mirrors `parserMiddleware`).
5. **`highlightActiveLine()`** appended after `createEditor` via
   `StateEffect.appendConfig.of(highlightActiveLine())` (qword has no extensions option).
   Required for `.cm-activeLine` -> `cursorLine()`.
6. **Auto-focus the source editor on mount** (`autoFocus` prop -> `editor.focus()`), so
   `press('i')` + `Ctrl+A` in the e2e reach the editor right after `goto()` (tests 8-11
   already prove vim `Ctrl+A` = select-all works when focused). The transform editor is
   not auto-focused; its tests only need the `pressSequentially` focus, which is enough.
7. **Warm up `@putout/printer`** at middleware module load (`import('@putout/printer')`
   fire-and-forget): the first Escape-format must finish before `read()` (~100ms). The
   parser is already warm (initial parse at boot); this removes the printer chunk-load
   from the critical path.

## 3. File changes

### 3.1 `src/editor/changes.ts` (new)

```ts
export const getDocChanges = (oldValue: string, newValue: string) => {
    // common prefix / common suffix -> single {from, to, insert} change
};
```

Returns `{from, to, insert}` (or `null` when equal). Pure function -> trivially 100% covered.

### 3.2 `src/editor/format.ts`

- `formatInput(source, ast)`: keep `!ast` and `formatted === source` guards; adapt the
  trailing newline of `print(ast)` to `source.endsWith('\n')`; wrap `print` in
  `tryToCatch` (exotic asts — glsl/json — degrade to `[error]` instead of rejecting).
- `formatRule(source)`: same trailing-newline adaptation after `normalizeRule`.
- Both keep the `[error, value]` tuple protocol.

### 3.3 `src/editor/Editor.js`

- props: drop `onBlur`, add `onKeyDown = noop`, `autoFocus = false`.
- mount effect:
  - `const [keyDownEv, keyDownFn] = on(editor, 'keydown', handleKeyDown);`
  - `handleKeyDown(event)`: flush pending debounce (clear `timerRef`, read fresh
    value+cursor, update `valueRef`, call `onContentChange`), then
    `if (event.key.length !== 1) onKeyDown(event);`
  - `if (autoFocus) editor.focus();`
  - `editor.dispatch({effects: StateEffect.appendConfig.of(highlightActiveLine())});`
  - cleanup: `off(editor, keyDownEv, keyDownFn)` (blur wiring removed).
- value-effect (`[value]`): replace `setValue` with

```js
const changes = getDocChanges(valueRef.current, value);

if (changes) {
    valueRef.current = value;
    editor.dispatch({changes});
}
```

  CM6 maps the selection through the diff -> cursor stays on the same line.

### 3.4 `src/editor-source/index.js`

- `onBlur={() => dispatch(editorBlur())}` ->
  `onKeyDown={() => dispatch(editorKeydown())}`, `autoFocus`.

### 3.5 `src/editor-transform/index.js`

- same: `transformBlur()` -> `transformKeydown()` (no autoFocus).

### 3.6 `src/store/reducers.ts`

- rename actions `editorBlur` -> `editorKeydown`, `transformBlur` -> `transformKeydown`
  (both stay `noop`), update the export list.

### 3.7 `src/store/formatMiddleware.ts`

```ts
startAppListening({
    actionCreator: editorKeydown,
    effect: async (_, api) => {
        const state = api.getState();
        const source = getCode(state);
        const parser = getParser(state);
        const parserSettings = getParserSettings(state);
        
        if (!parser || source == null)
            return;
        
        const [parseError, result] = await tryToCatch(parseCode, parser, source, parserSettings);
        
        if (parseError)
            return;
        
        const [formatError, formatted] = await tryToCatch(formatInput, source, result.ast);
        
        if (formatError)
            return;
        
        if (getCode(api.getState()) !== source)
            return; // staleness guard
        
        api.dispatch(setCode({code: formatted, cursor: 0}));
    },
});
```

- same shape for `transformKeydown` with `formatRule` + `getTransformCode` guard.
- selectors: reuse `getParser` (`../parser/store/parserSelectors.ts`) and
  `getParserSettings` (`./selectors.ts`) — same imports `parserMiddleware` uses.
- module-level printer warmup: `import('@putout/printer');` (unhandled-safe).

### 3.8 `src/types.ts`

- `EditorProps.onBlur: () => void` -> `onKeyDown: (event: KeyboardEvent) => void`.
- keep `tsc --noEmit` (`npm run test:dts`) clean.

### 3.9 no changes

- `e2e/*` (spec, must not be edited), `qword` (external), `app.js` (middleware already
  registered), `css/style.css` (`filter: blur` is the error effect — unrelated).

## 4. Unit tests (100% coverage of every touched file)

Run with `npm test` / `npm run coverage` (`c8 tape "src/**/*.spec.{js,ts,tsx}"`).

1. **`src/editor/changes.spec.js`** (new) — `getDocChanges`:
   - equal strings -> `null`; pure insert (middle/end); pure delete; replace;
   - common-prefix, common-suffix, both, empty old/new.
2. **`src/editor/Editor.spec.js`**:
   - `fireEvent.keyDown(content, {key: 'Escape'})` calls `onKeyDown` with the event;
   - `key: 'l'` (length 1) does **not** call `onKeyDown`;
   - keydown flushes: stale `value` prop + changed doc -> `onContentChange` receives
     fresh doc value (spy prop);
   - `autoFocus` focuses editor (`document.activeElement` is `.cm-content`);
   - value-effect minimal diff: render `const x=1`, move selection to end, rerender with
     `const x = 1;` -> doc updated and `view.state.selection.main.head` still on line 1
     (`doc.lineAt` assert) — unit mirror of e2e 248/270;
   - identical value rerender -> no dispatch (no history churn).
3. **`src/store/formatMiddleware.spec.js`** (rename + extend, keep `makeStore`/`makeAST`):
   - `editorKeydown` with valid ast formats code — new expectation `const x = 1;`
     (trailing-newline convention, source w/o `\n`);
   - source **with** trailing `\n` -> formatted keeps it;
   - without ast/parse error -> no-op; already formatted -> no-op;
   - staleness guard: dispatch `editorKeydown`, then `setCode` with new code before
     `setImmediate()` -> new code survives (guard branch covered);
   - `transformKeydown` equivalents: valid formats (`export const replace = () => ({});`),
     empty/invalid no-op, no-change no-op, comment blank-line tests (kept, expectations
     updated to trimmed output), staleness guard;
   - print-throw branch: ast that `@putout/printer` cannot print -> no-op.
4. **`src/editor-source/index.spec.js`** / **`src/editor-transform/index.spec.js`**:
   - replace the two blur tests with: `fireEvent.keyDown(view.contentDOM, {key: 'Escape'})`
     -> dispatched action `putoutEditor/editorKeydown` / `putoutEditor/transformKeydown`.

Coverage gate: `npm run coverage` must report 100% lines/branches for `Editor.js`,
`changes.ts`, `format.ts`, `formatMiddleware.ts`, `editor-source/index.js`,
`editor-transform/index.js` (the only files with logic changes; reducer changes are noop
renames covered by existing dispatch assertions).

## 5. Implementation order

1. `changes.ts` + spec (pure, no deps).
2. `format.ts` trailing-newline + tryToCatch.
3. `reducers.ts` renames + `types.ts`.
4. `formatMiddleware.ts` rewrite (fresh parse, guards, warmup).
5. `Editor.js` (keydown flush, printable skip, autoFocus, activeLine, diff-apply) +
   `Editor.spec.js`.
6. `editor-source` / `editor-transform` wiring + specs.
7. `npm test` -> all green; `npm run coverage` -> 100% on touched files;
   `npm run test:dts`; `npm run lint` (putout style: no semicolons, 4 spaces).
8. `npm run build` + `npx playwright test` (all 3 projects) — iterate on any e2e timing.

## 6. Risks / notes

- **e2e timing**: format chain (flush -> parse -> print -> dispatch -> CM apply) must
  finish before `read()`. Printer warmup + warm parser keep it at tens of ms; if flaky,
  the fallback is warming both imports in `app.js` before render (still no e2e edits).
- **Mid-typing formats**: impossible for printable keys (skip); Enter/Tab keydowns flush
  *after* CM processed the key (listeners run in registration order, CM first), so the
  flushed doc already contains the edit and the trailing-newline convention keeps it.
- **Test 305 keeps passing** for the right reason now: mangled rule text fails
  `formatRule` parse -> no-op -> content (containing `report = ()`) unchanged.
- **Mobile**: no mobile e2e touches editor typing/formatting; `autoFocus` only affects
  the source editor on load (harmless in the tabbed mobile layout).
- The old blur behaviour is fully removed per the feature idea; `formatMiddleware.spec.js`
  blur tests are replaced, not kept.
