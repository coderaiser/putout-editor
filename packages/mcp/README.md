# @putout/mcp

MCP server for writing 🐊**Putout** plugins with an agent. It runs `putout` in the same process:
no HTTP server is necessary.

## Claude Code

The repository root has `.mcp.json`:

```json
{
    "mcpServers": {
        "putout": {
            "type": "stdio",
            "command": "bun",
            "args": ["packages/mcp/src/index.ts"]
        }
    }
}
```

1. Run `bun i` at the repository root.
2. Start Claude Code in the repository root.
3. Claude Code asks to use the `putout` server from `.mcp.json`. Approve it.
4. Run `/mcp` to see the server and its tools.
5. Type `/mcp__putout__new_rule` and give the goal of the rule, for example
   "replace var with let". The prompt gives the workflow below.

The same entry, from the command line:

```sh
claude mcp add --scope project --transport stdio putout -- bun packages/mcp/src/index.ts
```

If the server does not start, `bun` is not on the `PATH` of Claude Code. Write the absolute path
of `bun` in `command`.

## Workflow for a new rule

1. `docs {section: 'template'}`: the pattern grammar.
2. `get_example`: a working plugin of the right shape. Replacer first.
3. `name_pattern` on a sample, then `test_pattern`: find a key, see what it matches and binds.
4. `validate`: the answer must be `ok`.
5. `find_places`: on a fixture with the bad code, and on a fixture with nothing to find.
6. `transform`: check the fixed code.

## Tools

| Tool | Does | Inputs |
|---|---|---|
| `docs` | Overview, or a section: `style`, `template`, `errors` | `section?` |
| `get_example` | A working plugin and fixture for a shape | `pattern` |
| `test_pattern` | One pattern key: matches, positions, bound values, replacement | `fixture`, `key`, `to?`, `isTS?` |
| `name_pattern` | Pattern keys that match a snippet | `fixture` |
| `validate` | `ok`, `plugin_syntax (line N, col N): …` or `plugin_shape: …` | `plugin` |
| `find_places` | Places a plugin reports. No change to the code | `fixture`, `plugin`, `isTS?` |
| `transform` | Runs a plugin and returns the code | `fixture`, `plugin`, `isTS?` |
| `parse` | Compact Babel AST; `full: true` for the raw AST | `source`, `query?`, `full?` |
| `formats` | Wrappers and ASTs for json, yaml, toml, markdown, css and more | none |
| `type_check` | Which clause of a `createTypeChecker` table decides each node | `fixture`, `typeNames` |
| `printer_visitor` | Write or check a `@putout/printer` visitor | `action?`, `visitor?`, `type?` |
| `flatlint_rule` | Write or check a flatlint rule | `action?`, `pattern?`, `to?`, `rule?`, `name?` |
| `fetch_snippet` | Source and plugin of a `putout.cloudcmd.io/#/gist/<id>/<rev>` snippet | `snippet`, `include?` |
| `learn_tree` | Outline of the curriculum: ids, labels, summaries | none |
| `learn_node` | One curriculum node: text, example, related ids | `id` |
| `learn_example` | The example source of one curriculum node | `id` |

Prompt: `new_rule` (argument `goal`). Claude Code shows it as `/mcp__putout__new_rule`.

### Behaviour to know

- **TypeScript.** `find_places`, `transform` and `test_pattern` find TypeScript in the fixture
  and parse it with `isTS`. Give `isTS` to override.
- **Errors.** A failed call returns `isError: true` and a text that starts with `Error:`.
  `validate` sets `isError` for `plugin_syntax` and `plugin_shape`. `docs {section: 'errors'}`
  lists all answers.
- **Silent patterns.** A key that matches nothing exits 0 in the CLI. `test_pattern` shows the
  count and, with `to`, `changed: false` and a note. `f(__a__)` binds nothing.
- **`fetch_snippet`.** The id is the only part of the input that is used: the host is fixed.
  The gist is user data. The answer starts with its origin, is marked untrusted, and has at
  most 8000 characters. `include` defaults to `["source", "transform"]`. `"config"` is large.
- **`get_example`.** `finder` is advanced and is returned only when you name it.

## Development

```sh
bun run test         # in packages/mcp
bun run coverage     # 100% on all four metrics
bun run test:dts
bun run lint
```

Do not run `dist/`: it is not in git. Run the source, as `.mcp.json` does.
