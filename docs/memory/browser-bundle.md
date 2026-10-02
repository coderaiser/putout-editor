# A browser bundle must be opened, not built

The gate for a page is not `bun run build` and it is not the unit suite. It is
opening the built page and looking at it.

`packages/chat` had a green build, a clean `tsc`, 128 passing tests and 100%
coverage, and the served page threw `TypeError: homedir is not a function` before
React mounted — an empty document, every gate satisfied. Nothing in a build
reports it, because the failure is a module *evaluating*, not a module resolving.

## What 🐊Putout costs a browser, and why each piece is there

Every item below was found by opening the page, one at a time, not by reading a
report:

| Symptom on the page                                 | Cause                                                                                                 | Fix                                               |
|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| `Y.homedir is not a function`                       | `env-paths` calls `os.homedir()` **at module scope**, via `cosmiconfig` from `putout`'s config reader | `IgnorePlugin`                                    |
| `fileURLToPath … not found in 'node:url'`           | `globby` / `unicorn-magic`; the `url` shim has no `fileURLToPath`                                     | `IgnorePlugin`                                    |
| `Cannot resolve 'v8'`, `'inspector'`                | `import-meta-resolve`                                                                                 | `fallback: false`                                 |
| `Cannot find module '@putout/operator-match-files'` | a **dynamic** `require` still resolves at runtime                                                     | `NormalModuleReplacementPlugin` → an empty module |
| 🐊Putout loaded on every visit anyway               | `splitChunks` `chunks: 'all'` made its chunk an *initial* script                                      | `chunks: 'async'`                                 |

Two of those are worth their own lines. **An `IgnorePlugin` is not enough for a
dynamic `require`** — the call site resolves when it runs, so ignoring the module
turns a build error into a page error. And **`chunks: 'all'` is a lie about
laziness**: it moves the chunk out of the entry's graph but still lists it in
`chat.html`.

## A barrel export is enough to put a module in the graph

`commands` re-exported `compilePlugin`, whose module calls `createRequire` at the
top level. Every consumer importing the barrel — for the parser, for the commands
— carried 🐊Putout with it. The fix was not a config change: it was taking the
export out of the barrel and asserting its absence, so it is not helpfully added
back:

```js
test('index: does not re-export compilePlugin, which drags in putout', (t) => {
    const result = 'compilePlugin' in api;
    const expected = false;
    
    t.equal(result, expected);
    t.end();
});
```

The same shape is why `commands` exports no React component and why
`index.spec.ts` filters the barrel for `/^(Ast|use)/`: the mcp imports that
package and has no DOM.

## A testid is an identity, not a decoration

`AstBlock` put `data-testid="ast-output"` on a wrapper around `AstTree`, which
already carried it. The page rendered two elements with one identity and
Playwright refused in strict mode. A component that has a testid does not get
another from its parent.

## The lesson worth keeping

**A passing build is evidence about the build.** The page is a different program
from the bundle, and it only runs in a browser. The cheapest possible check is
three lines, and it found everything above:

```js
await page.goto('http://localhost:8080/chat.html');
await page
    .getByRole('textbox')
    .fill('/source\nconst a = 1;');
await page.keyboard.press('Enter');
```

Two bugs in this work were found the same way and neither was in a bundle: `Enter`
completing a fully-typed command instead of sending it (the autocomplete still
showed one row), and the `↑` recall walking the wrong direction (`cursor`
clamped with `Math.max(at - 1, 0)` started at 0 and never moved). Both were
green in every unit test.
