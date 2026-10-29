# Frontend

Browser bundle, CSS layout, the chat page, the editor.

## Open the page, not only the build

A green build, `tsc`, tests and coverage do not prove that the page runs. A module can throw
when it loads. After a bundle change:

1. `bun run build`.
2. Open the page (`bun run start` at the root, or run the e2e).
3. Make sure the UI renders and a command works.

## 🐊**Putout** in a browser

| Symptom on the page | Cause | Fix in `rspack.config.js` |
|---|---|---|
| `homedir is not a function` | `env-paths` calls `os.homedir()` at module scope (via `cosmiconfig`) | `IgnorePlugin` |
| `fileURLToPath … not found in 'node:url'` | `globby`, `unicorn-magic` | `IgnorePlugin` |
| `Cannot resolve 'v8'`, `'inspector'` | `import-meta-resolve`, `typescript` | `fallback: false` |
| `Cannot find module '@putout/operator-match-files'` | a dynamic `require` resolves at run time | `NormalModuleReplacementPlugin` to an empty module |

- `IgnorePlugin` does not help a dynamic `require`. The build passes and the page fails.
- 🐊**Putout** resolves processors by name at run time. Do not ignore a processor that a rule can
  ask for.
- The same config edit can be correct in one package and wrong in another. The chat runs no
  `matchFiles` rules, so it can stub `operator-match-files`. The client runs them, so it cannot.
- An operator must not import a processor: every rule loads the operator, so the processor goes
  into every bundle.
- A barrel export puts its module in the graph of every importer. `commands` does not re-export
  `compilePlugin`, and `index.spec.ts` asserts it.
- A new bundler-only module (for example `src/shims/empty.js`) needs a spec, not a coverage
  exclude.

### Chunks

- `splitChunks` `chunks: 'all'` makes a chunk an initial script. Use `chunks: 'async'` for a lazy
  module.
- `chunks: 'async'` splits only modules reached through `import()`. `enforce: true` makes a group
  unconditional, but it cannot defer a module that the first render needs.
- To check a payload change, sum the `<script>` files that the built `index.html` loads, before
  and after. A `grep` over one chunk proves nothing about the others.

## Chat page

- Root `bun run build` builds the client, then the chat. The order matters: the client build
  replaces `out/` and the chat writes `out/chat/`.
- The page is `out/chat/index.html`, URL `/chat`.
- The server answers an unknown path with the editor `index.html` and status 200. To check that
  an asset exists, request a path that cannot exist and read the content type.
- `nanoid` comes from `@reduxjs/toolkit`, not a separate dependency.
- The composer is CodeMirror (`src/CodeMirrorBox.tsx`), loaded with `React.lazy`.
- `Enter` inserts a newline. `Ctrl+Enter` sends. A spec that sends must press the chord.
- A command line starts with `/` (`src/sigil.ts`). When the command grammar changes, search for
  the old spelling in strings too: hint messages name commands.

## CSS layout

- `width: 100%` with horizontal padding needs `box-sizing: border-box`. Rule
  `apply-box-sizing-to-sized-element` checks this.
- `min-width: 0` must be on the grid or flex **item**. On a child of the item it does nothing.
- `inset` is `top right bottom left`. Write all four values.
- `position: absolute` uses the nearest positioned ancestor. Give the intended box
  `position: relative`.
- A `white-space: pre` block in an `overflow-x: auto` box can be wider than the screen. That is
  correct. A probe for overflow must skip elements inside a scroll box.
- The `@lezer` grammar is in the initial chat payload, because `@putout/editor-commands` imports
  🐊**Putout**'s parser tree statically. See [`backlog.md`](./backlog.md).

## Editor

- Vim blockwise visual (`Ctrl+v`) needs more than one selection range. `qword` does not use
  `basicSetup`, so `create-editor.ts` adds `EditorState.allowMultipleSelections`. Without it the
  block cannot grow.
- `Control+q` is bound to the same action. Use it to test blockwise visual with no paste event.
- The paste handler on `document` is not the cause of vim problems. The paste target is a span
  inside `.cm-content`.
