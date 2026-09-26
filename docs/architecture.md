# Architecture

A map, not prose. Read the file you are about to edit; look here only for
where things live and which seam owns what.

## Packages

| Package | What it is |
|---|---|
| `packages/client` | The editor. The app, the redux store, the CodeMirror panels, and all unit + e2e tests. |
| `packages/server` | HTTP API behind `putout.cloudcmd.io` (`/api/v1/*`). |
| `packages/mcp` | MCP server for agents. See its `README.md`; it is independent of the client. |

## Client data flow

```
parser category  →  parse (src/parser)          →  workbench.code / parseResult
transform plugin →  transform (src/transformer) →  workbench.transform
                     ↓
        panels read the store, never each other
```

- `src/store` — the redux slice, selectors, operations. `putoutEditor` is the reducer;
  `revive()` derives `initialCode`/`parserSettings` from other state (see its JSDoc).
- `src/parser` — one directory per parser category, each exporting
  `id`/`displayName`/`mimeTypes`/`fileExtension`. `fileExtension` is what decides the
  source filename for a stored snippet.
- `src/transformer` — compiles a plugin string and runs it. `init-plugin.ts` is the
  compile entry.
- `src/panel-*` — render only. They read the store and dispatch actions; they never
  reach into each other. Each has its own spec.
- `src/snippet` — New-menu templates + fixtures, the share dialog, and
  `storage/` (the `gist.ts` backend plus `api.ts`, which is just
  ``fetch(`${API_HOST}/api/v1${path}`)``). A stored snippet is
  `astexplorer.json` (manifest) + `transform.js` + the source — `code.js` when
  `v === 1`, `source.<ext>` when `v === 2`.

## Tests

| Location | Runner | Scope |
|---|---|---|
| `src/**/*.spec.{ts,tsx}` | tape / supertape | unit. One assertion per test, so bind both sides to consts first. |
| `test/**/*.spec.ts` | tape | specs for the shared test helpers. `test/**` is excluded from coverage. |
| `e2e/**/*.ts` | Playwright | end to end, against the **prebuilt** bundle in `../../out`. |

Shared fixtures belong in `test/store.ts` (`#test/store`), not in a per-spec copy.

### e2e projects

Each Playwright project runs a specific set of files — a test in the wrong file
silently never runs:

| Project | Files |
|---|---|
| `desktop-chrome` | `desktop.ts`, `editor-desktop.ts`, `snippet.ts`, `visual.ts` |
| `desktop-chrome-dark` | `visual.ts` |
| `mobile-safari` | `mobile.ts`, `editor-mobile.ts` |
| `mobile-chrome` | (currently matches nothing) |

`e2e/desktop/` and `e2e/mobile/` are helper modules, not test files. They do not
match any project's `testMatch`, so putting a spec there would run it zero times.
