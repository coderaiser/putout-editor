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

- `src/store` — the redux layer, in three concerns. `state.ts` holds the state types
  and `initialState`, `revive.ts` the persistence (`persist`/`revive`, and `revive()`
  derives `initialCode`/`parserSettings` from other state — see its JSDoc), and
  `reducers.ts` the slice itself. **`reducers.ts` is also the barrel**: the 30-odd files
  that need a type or an action import it from there and re-export what `state.ts` and
  `revive.ts` own, so those two can move without touching a single importer.
  `parserSelectors.ts` and `parserMiddleware.ts` live here too, not under `parser/`,
  because they take a `RootState` — that is what keeps `store → parser` one-way.
- `src/app` — the composition root, one concern per file: `createStore.ts` builds the
  store and its middleware chain, `persistence.ts` the debounced write, `handlers.ts`
  the hash and unload handlers, `debounce.ts` the debouncer. Each takes what it needs
  as an argument, so `src/app.tsx` is a thin entry and every piece is spec-able without
  a DOM or a real store.
- `src/parser` — one directory per parser category, each exporting
  `id`/`displayName`/`mimeTypes`/`fileExtension`. `fileExtension` is what decides the
  source filename for a stored snippet. `parsers/index.ts` registers the adapters;
  each one has a spec beside it.
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

**Every spec shares one process and one DOM.** tape runs the whole glob in a single
node process, so a spec that mounts a tree or installs a global leaks into every spec
after it. `src/app.spec.tsx` imports the real entry, so it removes its container and
restores `onhashchange`/`onbeforeunload` when it finishes; without that teardown the
suite went from green to 104 failures ("multiple elements with the role button",
`ECONNREFUSED` from a live snippet load).

## Coverage

`.nycrc.json` — **not** `.c8rc`; `c8` reads nyc config, so that is where the client's
thresholds live (`checkCoverage`, 100% on all four metrics, `all: true`).

Its `exclude` list currently names twelve source paths, and they are the files that
were uncovered, so `bun run coverage` reports 100% over the 123 files left. The honest
number with those entries removed is 97.11%. See `docs/issues/coverage.md` before
quoting a coverage figure for this package.

### e2e projects

Each Playwright project runs a specific set of files — a test in the wrong file
silently never runs:

| Project | Files |
|---|---|
| `desktop-chrome` | `desktop.ts`, `editor-desktop.ts`, `snippet.ts`, `visual.ts` |
| `desktop-chrome-dark` | `visual.ts` |
| `mobile-safari` | `mobile.ts`, `editor-mobile.ts` |

`e2e/desktop/` and `e2e/mobile/` are helper modules, not test files. They do not
match any project's `testMatch`, so putting a spec there would run it zero times.
