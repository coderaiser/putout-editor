# @putout/mcp

MCP server for putout-editor — write putout rules with Claude.

## Installation

```bash
npm install @putout/mcp
```

## Usage

### Claude Desktop config

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

Production:

```json
{
    "mcpServers": {
        "putout": {
            "command": "node",
            "args": ["/absolute/path/to/packages/mcp/dist/index.js"],
            "env": {
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

- `BASE_URL` — API base URL (default: `http://localhost:8080`)

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
# Build
npm run build
```
