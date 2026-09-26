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
import {Client} from '@modelcontextprotocol/sdk/dist/esm/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/dist/esm/client/stdio.js';

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
