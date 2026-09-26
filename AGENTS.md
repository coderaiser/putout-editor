# AGENTS.md

Guidance for AI agents working in this repo.

## Use the MCP server to investigate putout behaviour

**This repo ships an MCP server: `packages/mcp`. Before writing throwaway probe
scripts, throwaway `.spec.ts` files, or one-off `node -e` harnesses to answer a
question about putout, ask the server.** It already exposes the answers as tools.

The failure mode this prevents: dumping a 6 KB Babel `NodePath` to the console,
writing temp spec files into a package to inspect internals, or hand-rolling
`initPlugin` calls — when a single `validate` call answers the question in
milliseconds.

### Tools

| Tool | Use it to |
|---|---|
| `validate` | Check a plugin string compiles. Returns `ok` or `plugin_syntax (line N, col N): ...` |
| `parse` | Get the AST for source. Compact by default; `full: true` for raw (with `loc`) |
| `find_places` | Count/inspect where a plugin matches. No fixture mutation |
| `transform` | Apply a plugin to a fixture and see the real output |
| `get_example` | Get a known-good plugin + fixture for `replacer`/`traverser`/`includer`/`finder`/`declarator`/`scanner` |
| `docs` | Reference. `section: 'api'` or `'errors'`; overview when omitted |

### Running it

Prefer **source mode** — no build step, and never stale:

```js
import {Client} from '@modelcontextprotocol/sdk/client';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
    command: 'bun',
    args: ['packages/mcp/src/index.ts'],
    env: {...process.env, NODE_OPTIONS: '--import @supertape/loader-ts'},
});

const client = new Client({name: 'probe', version: '1.0.0'});
await client.connect(transport);

const {tools} = await client.listTools();
const call = async (name, args) => (await client.callTool({name, arguments: args})).content[0].text;

console.log(await call('validate', {plugin: 'export const report = () => "x";'}));
await client.close();
```

The SDK's `exports` map rewrites `./client` to `./dist/esm/client/index.js`. Reaching for
the deep path yourself double-nests it and fails with
`Cannot find module '.../sdk/dist/esm/dist/esm/client/index.js'`. Use the short subpath form
everywhere — the same one `packages/mcp/src` itself uses.

The `args` path is relative, so run the probe from the repo root. To be independent of cwd
altogether, pass absolute paths (and the absolute path to `bun`, which lives outside the
default `PATH`):

```js
const transport = new StdioClientTransport({
    command: '/home/coderaiser/.local/share/bun/bin/bun',
    args: ['/home/coderaiser/putout-editor/packages/mcp/src/index.ts'],
    cwd: '/home/coderaiser/putout-editor',
    env: {...process.env, NODE_OPTIONS: '--import @supertape/loader-ts'},
});
```

`cwd` is not needed for the server to start — `--import @supertape/loader-ts` resolves from
the entry file, not the working directory — but set it anyway if you want to be explicit.

`packages/mcp/dist` is **gitignored** — if you spawn `node packages/mcp/dist/index.js`
you may be testing a stale build. Source mode via `bun` avoids that entirely.

### Things that will bite you

- **supertape allows exactly one assertion per test.** Two `t.equal` calls in one
  test fails with *"Only one assertion per test allowed"*. Split them.
- **A plugin that fails to compile is not the same as a plugin that compiles but
  misbehaves.** `validate` only covers the former. Use `transform` to check behaviour.
- **Plugin source is transformed before it runs.** `compileRule` pipes code through
  `@putout/plugin-putout`, so what you wrote may not be what executes. E.g. a bare
  `path.remove()` gets rewritten to `remove(path)` with `path` auto-declared as a
  parameter. When behaviour looks impossible, check what the compiler emitted
  rather than assuming the source is literal.
- **`tsc` and `zod`**: for a schema field with `.default()`, use `z.input<typeof schema>`
  in the handler signature, not `z.infer` — `z.infer` yields the *output* type and makes
  the field required, which breaks callers that omit it.
- `putout` lint exits 0 on plugin code inside `montag`/template literals — it parses the
  string, not the code. Only `validate`/`transform` see through that.

## Writing `packages/client` specs

`test/store.ts` exposes one shared `makeStore(overrides?, options?)` returning
`{store, actions}`. Use it instead of hand-rolling `configureStore` — import it as
`#test/store`. Specs that need a listener middleware, `immutableCheck: false`, or a thunk
`extraArgument` pass them via the second argument and keep a thin local wrapper.

### Things that will bite you

- **`makeStore` calls `revive()`, so some `workbench` overrides are silently ignored.**
  `revive` *derives* `workbench.parserSettings` (from `parserSettings[parser]`),
  `workbench.initialCode` (from `workbench.code`) and `workbench.transform.initialCode`.
  Setting those derived fields directly gets clobbered with no error. Set the top-level
  source instead:
  `makeStore({parserSettings: {babel: {...}}})`, not `makeStore({workbench: {parserSettings: ...}})`.
  Only `workbench` is merged shallowly over the initial state; top-level keys are replaced.
- **A passing test is not the same as a covered test.** A spec whose assertion is too weak
  will keep passing while the code it names stops running — that is how branch coverage
  silently fell to 99.88% during a refactor. When you change what a store helper preloads,
  check the assertions actually observe the effect, and run `bun run coverage`. Likewise,
  when you add a *regression* test, stash the fix and confirm the test fails without it —
  a test that passes either way pins nothing.
- **supertape allows one assertion per test**, and `putout` enforces
  `tape/extract-result-from-assertion`: bind both sides to consts first
  (`const result = ...; const expected = ...; t.deepEqual(result, expected);`).
- **e2e runs against the prebuilt bundle in `../../out`, not against `src/`.** Playwright's
  `webServer` serves that directory, so your change is invisible until you `bun run build`.
  A fix that "does nothing" in e2e is nearly always a stale bundle. Clipboard tests also
  need `context.grantPermissions(['clipboard-read', 'clipboard-write'])`, which is
  Chromium-only — keep them in `e2e/desktop.ts`, not the mobile projects.
- **In e2e, `write()` clicks the editor, which drops vim out of insert mode.** The default
  keymap is `vim`, so a `press('Enter')`/`press('Tab')` that must indent has to come *after*
  `write()`, and the text that follows must be `page.keyboard.insertText(...)` — a second
  `write()` re-clicks and cancels the mode again. See `e2e/desktop.ts`.

## Verify before claiming done

Run from `packages/mcp` unless you changed something else:

```bash
bun run test        # tape
bun run test:dts    # tsc --noEmit
bun run coverage    # 100% branches/lines/functions/statements enforced
bun run lint        # putout .
```

For `packages/client`, prefer `bun run test` over calling `tape` directly. `.madrun.ts`
sets `dom: true, css: true, jsx: true` via `NODE_OPTIONS`; without it, `.tsx`/DOM specs
(e.g. `src/snippet/GistBanner.spec.tsx`) fail to load. Pure `.ts` specs happen to run under
bare `tape`, so a green run on those does not mean the package is green.

`bun run coverage` is a required gate for `packages/client`, not optional: `.nycrc.json`
sets `checkCoverage` with 100 for branches/lines/functions/statements, and the root
`coverage` script fans out through `madfork` so `nodejs.yml` runs it on every push. Do not
claim a client refactor is done without it. `bun run fix:lint` (`putout . --fix`) autofixes
most style errors and also rewrites relative imports to their `package.json` alias.
