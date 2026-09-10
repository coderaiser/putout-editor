# @putout/mcp

MCP server for writing putout rules with Claude. Runs in two modes:
- **Local** (default): calls `putout` functions directly — no server needed
- **Remote** (opt-in): calls the putout-editor HTTP API

## Installation

```bash
npm install @putout/mcp
```

## Usage

### Claude Desktop config (local mode, default)

```json
{
    "mcpServers": {
        "putout": {
            "command": "node",
            "args": ["/absolute/path/to/packages/mcp/dist/index.js"]
        }
    }
}
```

### Remote mode (HTTP API)

```json
{
    "mcpServers": {
        "putout": {
            "command": "node",
            "args": ["/absolute/path/to/packages/mcp/dist/index.js"],
            "env": {
                "USE_HTTP": "true",
                "BASE_URL": "https://putout.cloudcmd.io"
            }
        }
    }
}
```

### Tools

| Tool          | Description                           | Inputs              | Response type |
|---------------|---------------------------------------|---------------------|---------------|
| `docs`        | Full putout-editor reference          | none                | text          |
| `parse`       | Parse source → Babel AST              | `source`, `query?`  | json          |
| `find_places` | Find plugin matches without modifying | `fixture`, `plugin` | json          |
| `transform`   | Apply plugin, return transformed code | `fixture`, `plugin` | text          |

### Environment

- `USE_HTTP` — Set to `true` to use the HTTP API (default: `false`, direct putout calls)
- `BASE_URL` — API base URL, only used when `USE_HTTP=true` (default: `http://localhost:8080`)

## Development

```bash
# Install dependencies
npm install
# Run tests
npm test
# Run coverage
npm run coverage
# Lint
npm run lint
# Fix lint
npm run fix:lint
# Type-check
npm run test:dts
# Build
npm run build
```
