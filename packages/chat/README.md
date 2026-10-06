# 🐊**Putout** Editor — Chat

The chat half of the editor. A message thread where a command runs
🐊**Putout** over the source you set, and — behind `ast` or `console` — the AST
tree beside it.

## A command is its first word

There is no slash. The first word of what you type **is** the command, so `ast`
is `ast` and `/ast` is a first word that names nothing:

```
ast
source [the code]
find [a plugin]
```

Every command declares what it takes, in the shell's brackets, and `help` prints
it. The thread opens with a worked example and the help, so there is something to
read before anything is typed.

| Command | Takes |
|---|---|
| `source` | the code every other command reads |
| `ast` | `--full`, `--query type` |
| `find` / `transform` / `validate` | a plugin |
| `test-pattern` | a key · `name-pattern` a snippet |
| `console` | `off` to close · `clear` · `reset` · `help` |

A `source` body ends at the next line whose **first word is a command**, so
`source` and `ast` can be sent as one input.

## Keys

| Key | What it does |
|---|---|
| `Enter` | Newline. Also completes a name while the dropdown is open. |
| `Shift+Enter` | Newline, always — including while the dropdown is open. |
| `Ctrl+Enter` | Send. `Cmd+Enter` on macOS. |
| `Tab` | Complete the picked name. |
| `↑` / `↓` | Walk the history when the box is empty; move the pick when it is not. |
| `Escape` | Close the dropdown and empty the box. |

`Enter` is a newline rather than a send because `source` takes a multi-line body,
and a `source` line is not something you can finish on one keystroke. The `↑`
button is there for the same reason: a keybinding nobody can see is not a
keybinding, so it carries the chord in its tooltip.

## What is where

| Path | What it is |
|---|---|
| `src/index.tsx` | The entry: `<Provider><App/></Provider>`. |
| `src/App.tsx` | Header, chat panel, and the console panel when it is open. |
| `src/Chat.tsx` | The message thread and the input area. |
| `src/Input.tsx` | Textarea, name autocomplete, `↑` history recall, and `growTo`. |
| `src/Message.tsx` | Switches on `result.type` and renders the block. |
| `src/messages/` | One component per result type. |
| `src/components/` | The AST tree — six components, self-contained, no Redux. |
| `src/console/ConsolePanel.tsx` | The tree beside the thread, and the `✕` that closes it. |
| `src/ThemeToggle.tsx` | Light/dark, on the editor's `localStorage` key. |
| `src/css/chat.css` | The palette and every rule. Claude's colours, both themes. |
| `src/store/` | The redux store: one `chat` slice. |
| `test/store.ts` | `makeStore(overrides)` — the one store factory, for specs. |

## Colours

Claude's palette, in the client's token *names* — so `--color-accent` means the
same thing on both pages and the tree restyles with the page. Warm cream in
light, warm charcoal in dark, and one terracotta accent used sparingly: nothing
is pure white, pure black or fully saturated.

The AST's eight category colours are **measured, not eyeballed**: `src/components/tokens.spec.ts`
recomputes the WCAG contrast of every dark category against the background the
tree is painted on, and fails below 4.5:1. The light values are tuned for cream
and the dark ones for `#1f1e1d`, and the weakest category is 6.29:1.

Dark and light are driven by `data-theme` on `<html>`, exactly as
`ThemeButton` in `packages/client` does it, and the key in `localStorage` is the
same `theme` — so a choice made on one page is already in force on the other.
With no stored choice the page follows `prefers-color-scheme`, which is what the
client's own `tokens.css` does.

**Changing a colour means adding a token, not writing a hex in a rule.** The
rules read `var(--color-…)` throughout, and `AstTree.css` falls back to the same
light values so a tree on its own matches the page. The eight category tokens are
the one deliberate exception — they have no `--color-*` counterpart to inherit,
and `tokens.spec.ts` is what holds them to the contrast floor.

## The commands come from elsewhere

Nothing here implements a command. `@putout/editor-commands` owns the eleven of
them and the `parseCommand` parser; this package is the page around them. The
dependency arrow is one-way — `chat → commands`, and `commands` is a Node
library that exports no component, because the mcp uses it too and has no DOM.
`index.spec.ts` there asserts that absence.

**The tree is here rather than in the client's `Tree.tsx`.** The client exports
`export-tree.ts` for consumers that want its own tree; this package uses
`src/components/AstTree.tsx`, which is self-contained — props in, events out,
each instance binding its keydown listener to its own root div so a chat message
and the console panel cannot fight over a keypress.

## Three commands need a server

`find`, `transform` and `validate` reach 🐊**Putout** through a dynamic
`import()`. 🐊**Putout** cannot be bundled for a browser — it calls
`os.homedir()` at module scope — so that chunk is fetched only when one of them
is typed. In a browser the three answer that they need the server. `ast`,
`source`, `console` and `help` work with no server at all.

See [`docs/memory/browser-bundle.md`](../../docs/memory/browser-bundle.md) for
what `rspack.config.js` ignores and why, and
[`docs/issues/chat.md`](../../docs/issues/chat.md) for the client's own build
failure.

## `out/` is shared

`bun run build` writes `out/chat/` next to the editor's own files and **does not
delete `out`** — the client's build does that, and the two would otherwise race.
The root `build` script runs the client first and chat second for the same
reason; the ordering is verified in both directions in the commit that added it.

**The page is `out/chat/index.html`, not `out/chat.html`.** The chunks already go
to `out/chat/`, and a page *beside* a directory of the same name loses: `/chat`
resolves to the directory, and with no `index.html` inside it, the server answers
with a 302 to `/chat/` and then a file listing. Inside the directory, `/chat` and
`/chat/` both serve the app. The stylesheet moved with it for the same reason — a
`href` to a file in the parent directory is one more relative path to break.

## The gate

```bash
bun run check    # putout . && tsc --noEmit && coverage, in that order
bun run test     # unit
bun run build    # then `bun run start` and open /chat
bun run test:e2e # playwright, against the built bundle
```

`e2e/` serves the **prebuilt** bundle in `../../out`, not `src/`. A change under
`src/` is invisible to those tests until `bun run build`.

## Read the count, not the exit code

`bun run test` here prints `1..368 / # tests 368 / # pass 368`, and those three
numbers are the result. **The exit code is not**, and there is a setup on this
machine where every package in the repository reports **no TAP output at all**
and exits `0`: a `tape` from the sibling 🐊**Putout** checkout is earlier on
`PATH`, it resolves its own `supertape` from there, and it matches no spec files
under this tree. Written up in [`docs/issues/scripts.md`](../../docs/issues/scripts.md).

To run a suite with a known binary:

```bash
node ./node_modules/supertape/bin/tracer.js "src/**/*.spec.{ts,tsx}"
```
