# 🐊**Putout** Editor — Chat

The chat half of the editor. A message thread where a slash command runs
🐊**Putout** over the source you set, and — behind `/console` — the AST tree
beside it.

## What is where

| Path | What it is |
|---|---|
| `src/index.tsx` | The entry: `<Provider><App/></Provider>`. |
| `src/App.tsx` | Header, chat panel, and the console panel when it is open. |
| `src/Chat.tsx` | The message thread and the input area. |
| `src/Input.tsx` | Textarea, `/` autocomplete, and `↑` history recall. |
| `src/Message.tsx` | Switches on `result.type` and renders the block. |
| `src/messages/` | One component per result type. |
| `src/console/ConsolePanel.tsx` | The tree beside the thread. |
| `src/store/` | The redux store: one `chat` slice. |
| `test/store.ts` | `makeStore()` — the one store factory, for specs. |

## The commands come from elsewhere

Nothing here implements a command. `@putout/editor-commands` owns the eleven of
them, the `parseCommand` parser, and the `AstTree` renderer; this package is the
page around them. The dependency arrow is one-way — `chat → commands`, and
`commands` knows nothing about this package or about the client.

The tree in particular is *not* the client's. The client exports
`export-tree.ts` for consumers that want its `Tree.tsx`, and chat does not use
it: `commands/components/AstTree.tsx` is self-contained, takes `FlatNode[]` and
`source` as props, and manages its own selection.

## `out/` is shared

`bun run build` writes `out/chat.html` and `out/chat/` next to the editor's own
files and **does not delete `out`** — the client's build does that, and the two
would otherwise race. Build order does not matter; run both.

## The gate

```bash
bun run check    # putout . && tsc --noEmit && coverage, in that order
bun run test     # unit
bun run build    # then `bun run start` and open /chat.html
bun run test:e2e # playwright, against the built bundle
```

`e2e/` serves the **prebuilt** bundle in `../../out`, not `src/`. A change under
`src/` is invisible to those tests until `bun run build`.
