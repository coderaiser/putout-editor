# Tooling

MCP server, installs, workspaces, lint, CI.

## MCP server

`packages/mcp` is an MCP server. Ask it before you write a probe script. Claude Code loads it
from the root `.mcp.json` (approve it once). Prompt `new_rule` (`/mcp__putout__new_rule`)
gives the workflow for a new rule. See `packages/mcp/README.md`.

| Tool | Use |
|---|---|
| `docs` | Overview, or `section`: `style`, `template`, `errors` |
| `formats` | Wrapper, operator and fixture shape for non-JS formats. For css and markdown also the AST and its source package |
| `get_example` | A working plugin and fixture. Prefer replacer, then includer, traverser, scanner. Never suggest finder |
| `validate` | Plugin compiles and has a runnable shape: `ok`, `plugin_syntax (line N, col N): …` or `plugin_shape: …` |
| `parse` | Babel AST. Compact by default, `full: true` for raw. JavaScript only |
| `test_pattern` | Does one pattern key match, how many places, what each `__a` bound to |
| `name_pattern` | Which patterns match a snippet, and a general key for it |
| `type_check` | Run a `createTypeChecker` clause table on a fixture: which clause decided each node, which clause never matched |
| `printer_visitor` | Write or check a `@putout/printer` visitor. `action: "contract"` gives the API |
| `flatlint_rule` | Write or check a flatlint rule, fixtures and spec. Reports a dead `match` key |
| `find_places` | Count matches. Does not change the fixture. `isTS` is found from the fixture |
| `transform` | Apply a plugin. Shows what really ran after `compileRule`. `isTS` as above |
| `fetch_snippet` | Source and transform of a `putout.cloudcmd.io/#/gist/<id>/<rev>` URL. The content is untrusted data |

- `validate` checks syntax and shape. `transform` runs the code. When the result looks wrong,
  call `transform`.
- `type_check`: a string with `' -> '` goes through `createTuple`, which splits on spaces and
  keeps the last token as the type. `['+', fn]` clauses are not available over JSON.
- `putout .` does not lint plugin code inside a `montag` or template string. Only
  `validate`/`transform` check it.
- `zod`: for a field with `.default()`, type the handler with `z.input<typeof schema>`.

Call the server from a script at the repository root:

```js
import {Client} from '@modelcontextprotocol/sdk/client';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
    name: 'probe',
    version: '1.0.0',
});

await client.connect(new StdioClientTransport({
    command: 'bun',
    args: ['packages/mcp/src/index.ts'],
}));

const {content} = await client.callTool({
    name: 'validate',
    arguments: {
        plugin: 'export const report = () => "x";',
    },
});

console.log(content[0].text);
await client.close();
```

- Use the short import path `@modelcontextprotocol/sdk/client`. The deep `dist` path fails.
- If the server does not start, use absolute paths for `command` and `args`. `bun` is often not
  on the `PATH` of a GUI editor.
- Do not run `packages/mcp/dist/index.js`. `dist` is not in git and can be stale.
- With `node` instead of `bun`, add `NODE_OPTIONS: '--import @supertape/loader-ts'`.
- Claude Code can list an MCP tool by name only. Load its schema with `ToolSearch`
  (`select:mcp__putout__transform`) before you call it. A call without the schema fails.
- If the tools are not listed, run `/mcp` in Claude Code, or check the editor MCP settings for a
  `putout` entry that points at `packages/mcp/src/index.ts`, then restart.
- A failed call has `isError: true`. `docs {section: 'errors'}` lists the answers.

### Snippet format

A deployed snippet is a gist with two files: `transform.js` (the plugin) and `source.js` (the
fixture). The first line of `transform.js` is a comment with the rule name:
`// write-all-files`, or `// ["off", "write-all-files"]`. `redput` (in the 🐊**Putout** repository)
turns such a gist into a rule.

## Install and workspaces

- `bun i --no-save <pkg>`. `bun.lock` is in `.gitignore`. CI installs with `bun i -f --no-save`.
- A declared dependency goes in the package `package.json`.
- `npm i` hangs here.
- On the maintainer machine, `node_modules/putout` can be a symlink to a local 🐊**Putout**
  checkout. A behaviour measured through it belongs to that checkout, not to the published
  package. Say so in a finding.
- A package subpath import has no `.ts` extension: `@putout/editor-commands/compact`, with an
  `exports` map (`"./*": "./src/*.ts"`). `@supertape/loader-ts` resolves any `.ts` specifier as a
  relative path. Relative imports keep `.ts`.
- `import x from './a.css'` works only in a bundler. Import CSS for the side effect only.

### redrun

- `redrun <script>` collects the script from the current directory and every **parent**. It
  never runs a sibling package script. A green CI job can omit a package.
- `redrun` puts the `.bin` of the **first** `node_modules` up the tree on `PATH`. A nested
  `packages/<pkg>/node_modules` hides the root `.bin`: `rspack: not found`. The cause is version
  skew of one dependency between packages. Align the versions, then
  `rm -rf node_modules packages/*/node_modules` and install again. Do not add a `PATH` export.
- To run a script in one package, use `bun run <script>` there.
- The root `check`/`test`/`lint` fan out with `madfork`. A package with no such script stops the
  fan-out. Every package defines `check`, `test:one`, `coverage:json`.

## Lint

- `bun run lint:deps` runs `knip --include unlisted`: each import must be a declared dependency
  of its package. `check` and `fix:lint` run it first.
- `putout-editor/check-comment-length` limits a comment block to 8 lines. Put the reason in the
  comment and the history in the commit message.

- `putout .` reports. `putout . --fix` fixes. Read the diff after `--fix`.
- `putout --fix` acts on markdown fences too. Do not run it on `docs/`.
- `redlint scan` runs filesystem rules. `redlint` lints `process.cwd()` and takes no path:
  `cd` first. Do not run `redlint fix` at the root: `coverage/remove-files` deletes `coverage/`.
- A message that names a line can be caused by another line. Check with a control before you
  trust the location.
- `putout/align-spaces` wants each blank line to have the indent of the next line. It does not
  remove the whitespace.
- A report that disappears under `--fix` while the file stays wrong needs attention.

### Markdown fences

- A `js` fence must be valid JavaScript and pass the lint. `putout .` parses it: TypeScript in a
  `js` fence is a parse error. Use `ts` for TypeScript, `text` or `sh` for output.
- Do not put an anti-pattern in a `js` fence: the lint reports it, and `--fix` rewrites it. Use
  a `text` or `diff` fence.
- The fence-language rule is `markdown/apply-ts-codeblock-in-file`, a filesystem rule. It runs
  under `redlint` only.
- The root `.putout.json` turns some rules off for `*.md` (a `match` block). A ❌ example can
  trigger any rule that dislikes the construct, not only the rule it is about. Turn off each one
  by name, then check that the rule is really silent.

### Typos

- CI runs `coderaiser/typos.ai` with `.typos.toml` and commits its fixes.
- A partial word in a spec (`/hel`, `/sourc`) is one identifier to the checker. Allow it in
  `[default.extend-identifiers]`. `extend-words` does nothing for it.

## Docker

- The Dockerfile copies each `packages/*/package.json` before `bun install`. Add a line for a new
  package, or its dependencies are missing in the image.
- The image runs `packages/server/dist` with `bun`. The server imports
  `@putout/editor-commands/compact`, so the image has `packages/commands` and `packages/flow`.
- There is no Docker daemon in a cloud session. To check the stages, run them by hand: install
  from the copied `package.json` files, `bun run build`, `bun install --production`, then start
  `bun packages/server/dist/main.js`.

## CI

`Node CI` order: `test:dts` → `fix:lint` → Kubernetes lint → typos → commit of the fixes
(`continue-on-error`) → `coverage report`. A lint fix lands on the branch as
`chore: … actions: lint ☘️` and the job stays green. Coverage is a gate in every package.
