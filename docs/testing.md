# Testing

Unit specs, coverage, e2e. General spec rules are in [`../AGENTS.md`](../AGENTS.md#specs).

## Runner

- `bun run test` and `bun run test:one` (with `SPEC='glob'`). Do not call `tape` directly:
  `.madrun.ts` sets `dom`/`css`/`ts`/`jsx` loaders in `NODE_OPTIONS`.
- `node_modules/.bin/tape` is the `@putout/test` wrapper, not supertape. Only it reports
  🐊**Putout** clause coverage (see [`printer.md`](./printer.md)).
- **A suite can run 0 tests and exit 0.** Read the count:
  - `1..0 / # pass 0` means the glob matched nothing.
  - **No output at all** means two copies of `supertape` are loaded: specs register on one,
    the CLI runs the other. The root `overrides` pins `supertape` to one version. Check:
    `node -e "Promise.all([import('NESTED'), import('ROOT')]).then(([a, b]) => console.log(a.default === b.default))"`
    with `NESTED` = `node_modules/@putout/test/node_modules/supertape/lib/supertape.js` and
    `ROOT` = `node_modules/supertape/lib/supertape.js`. `false` means the suite ran nothing.
  - A `tape` from another checkout on `PATH` gives the same silence. Run
    `node ./node_modules/supertape/bin/tracer.js "src/**/*.spec.ts"` to use a known binary.
- With nothing run, c8 `all: true` still prints a low number (for example 41.76%). That number
  measures nothing.

## Process and DOM

- All specs share one Node process and one DOM (happy-dom). A spec that mounts a tree or sets a
  global must clean it up. `src/app.spec.tsx` in the client removes its container and restores
  `onhashchange`/`onbeforeunload`.
- Stub a global (for example `matchMedia`) around the call, then restore it.
- happy-dom dispatches `selectionchange` synchronously inside `Selection.collapse`. CodeMirror
  then throws `Calls to EditorView.update are not allowed while an update is in progress`.
  `packages/chat/test/dom.ts` has `withAsyncSelectionChange(fn)`.
- React warns `not configured to support act(...)` when a `lazy` chunk resolves outside an act
  scope. `packages/chat/test/warm.tsx` has `warm(ui)`: call it once per spec file, at the top.
- `getComputedStyle` on a detached element returns `''`. Append the element to `document.body`.
- A method destructured from an element (`({getAttribute}) => getAttribute(x)`) loses `this`.
  happy-dom returns nonsense. Chromium throws `Illegal invocation`. Call it on the element.

## Store helpers

- Client and chat: use `makeStore(overrides?, options?)` from `#test/store`. A client spec that
  calls `configureStore` fails on purpose (`src/store/spec-store-guard.spec.ts`).
- Client `makeStore` throws on overrides that `revive()` drops: `workbench.initialCode`,
  `workbench.parserSettings`, `workbench.transform.initialCode`. Set the source field.
- A component that reads Redux needs a `<Provider>`. The chat tree components
  (`src/components/*`) take props and need no store.

## Coverage

- `.nycrc.json` in each package: 100% on all four metrics, `checkCoverage`, `all: true`.
  A new file that no test imports is still measured.
- An `exclude` entry claims that a file cannot be covered. Add one only for a file with no
  runtime statement (for example `*.types.ts`). Write the reason in the commit.
- The client excludes eleven files. Each one wants a real render test, or has an unreachable
  branch: `editor-ast-tree/*`, `menu/Menu.tsx`, `ui/PasteDropTarget.tsx`,
  `editor-ast-json/index.tsx`, `parser/parsers/js/espree.tsx`, `esprima.ts`.
- 100% branches with low functions means a module loaded but not called.
- Coverage shows whether a line ran, not whether a user can reach it. A component with full
  coverage can have no call site. Search for its name outside its directory.
- A coverage drop with no failing test can mean the test data changed, not the code.

## Client templates

`packages/client/src/snippet/templates/` has 13 templates (one per New-menu category) and
fixtures in `fixtures/`.

- Each template is a plugin in a `montag` string. `putout` lints the string, not the plugin.
  Use the mcp `validate`/`transform` tools to check the plugin.
- `initPlugin` runs `compileRule` before the template runs. Use mcp `transform` to see the
  compiled plugin.
- A template that acts must export `fix`. The client runs with `fixCount: 1`, and
  `find`/`scan`/`include` without `fix` throws.
- Shapes: replacer `report` + `replace` (+ `match`); includer `report` + `include` + `filter` +
  `fix`; traverser `report` + `traverse` + `fix`; scanner `report` + `scan` + `fix`; declarator
  `declare`. Do not add a new finder template.
- Each template has `<name>.spec.ts`: transform result and `places.length`. `index.spec.ts`
  only counts the maps. Change a template and its fixture in one commit, then run
  `SPEC='src/snippet/templates/*.spec.ts' bun run test:one`.
- A template must work as written. Do not depend on a rewrite that `compileRule` does.

## e2e

- e2e serves the prebuilt bundle in `out/`, not `src/`. Run `bun run build` first.
- Client projects: `desktop-chrome` (`desktop.ts`, `editor-desktop.ts`, `snippet.ts`,
  `visual.ts`), `desktop-chrome-dark` (`visual.ts`), `mobile-safari` (`mobile.ts`,
  `editor-mobile.ts`). A spec in another file never runs. `e2e/desktop/` and `e2e/mobile/` are
  helpers.
- Chat projects: `desktop-chrome` (`desktop.ts`), `mobile-chrome` (`mobile.ts`, iPhone 12).
- CI runs client e2e with `redrun` and chat e2e with `bun run test:e2e` in `packages/chat`.
  `redrun` does not reach a sibling package (see [`tooling.md`](./tooling.md#redrun)).
- The default keymap is `vim`. `write()` uses `locator.selectText()`, because vim binds `Ctrl+a`.
  Do not press `Escape` after it. `write()` clicks the editor and leaves insert mode: press
  `Enter`/`Tab` after `write()`, and add text with `page.keyboard.insertText(...)`.
- `press('Control+V')` sends key `'V'`, not `'v'`. Use a lowercase key.
  `apply-press-modifier-case` enforces this.
- Clipboard tests need `context.grantPermissions(['clipboard-read', 'clipboard-write'])`.
  Chromium only: keep them in `desktop.ts`.
- **Wait for the page before you measure.** `page.goto` resolves before React mounts. An empty
  document has `scrollWidth` equal to the viewport. Wait for `getByTestId('input')` first.
- Measure geometry in the page: `getBoundingClientRect()` against `window.innerWidth`, or
  `document.documentElement.scrollWidth`. `page.viewportSize()` differs by 18px on iPhone 12.
- A pseudo-element cannot be located. Read it with `getComputedStyle(el, '::before')`.
- If a component renders twice (thread and console panel), its testids are duplicated and
  strict mode fails. Scope the locator: `page.getByTestId('chat').getByTestId(...)`.

### Probe a layout

1. Add a Playwright project with `testMatch: ['**/__probe.ts']` and `...devices['iPhone 12']`.
2. `bun run build`.
3. Dump `getBoundingClientRect()` with `page.evaluate()`.
4. Apply the fix, build, measure again. Put the numbers in the commit body.
5. Delete the probe, or keep it as the regression test.
