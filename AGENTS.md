# AGENTS.md

Rules for agents in this repository. This file is short on purpose: read it fully.
Read a `docs/` file only when the task needs it.

## Where to read

| Task | Read |
|---|---|
| Find code, packages, seams, data flow | [`docs/architecture.md`](docs/architecture.md) |
| Write or change a rule in `packages/plugin-putout-editor` | [`docs/rules.md`](docs/rules.md) |
| Write a plugin in the 🐊**Putout** house style (upstream conventions) | [`docs/putout-style.md`](docs/putout-style.md) |
| Write or debug unit specs, coverage, e2e | [`docs/testing.md`](docs/testing.md) |
| Use the MCP server, install packages, lint, CI, markdown fences | [`docs/tooling.md`](docs/tooling.md) |
| Bundle, CSS layout, chat page, editor (vim) | [`docs/frontend.md`](docs/frontend.md) |
| Work on `@putout/printer` visitors or the `type_check` tool | [`docs/printer.md`](docs/printer.md) |
| Work on `flatlint` or the `flatlint_rule` tool | [`docs/flatlint.md`](docs/flatlint.md) |
| Open defects, ideas, rejected ideas | [`docs/backlog.md`](docs/backlog.md) |

## Commits

- Format: `type: scope: message`. Examples: `fix: client: …`, `feature: mcp: …`, `docs: agents: …`.
- **Never add a `Co-Authored-By` trailer or any agent attribution line.** If a tool adds one, remove it.
- Write the message to a file and use `git commit -F <file>`. With `-m`, the shell removes backticks.
- One logical change per commit. Put a docs change in its own commit.

## Gates

```sh
bun run check                              # knip && putout . && tsc --noEmit && coverage
SPEC='src/menu/*.spec.tsx' bun run test:one
bun run lint                               # putout . (fix:lint is putout . --fix)
```

- `bun run check` is the gate. Run it before you say the work is done.
- Coverage is 100% on all four metrics in every package. 99% is a failure.
- Use `bun run test`, not bare `tape`. `.madrun.ts` sets the loaders in `NODE_OPTIONS`.
- Read the test **count**, not the exit code. A suite that ran 0 tests exits 0.
- Run `putout .` before you commit. CI runs `putout . --fix`, then the typos fixer, then commits
  the result as `chore: … actions: lint ☘️`. Unlinted code comes back as a surprise commit.
- `putout --fix` can change specs and docs incorrectly. Read every diff it makes.
  Never run `--fix` on `docs/`.
- When a gate fails, fix the code. Do not disable a rule, widen an exclude, or lower a threshold.
- When you change a gate config, remove the old fix and make sure the gate fails. Then add your
  entry and make sure it passes. Otherwise your entry can do nothing.

## Code style

- No `try`/`catch`. Use `tryCatch` (`try-catch`) or `tryToCatch` (`try-to-catch`).
- No optional chaining. Bind the receiver to a local: `const {x} = a;` then `x && x.y`.
- No `node.type === 'X'`. Use `isX(node)` from `types`, and add the import yourself.
- Name array callbacks: `const notRejected = (name) => …;` then `.filter(notRejected)`.
- Put one-line consts together after the imports. A multi-line const stays near its user.
- Do not write a run of consecutive `//` lines. CI adds a blank line between them.
  Use one long line or a `/** */` block.
- No comments in `packages/plugin-putout-editor` and in `.madrun.ts` files.
- A comment block has at most 8 lines (`putout-editor/check-comment-length`).
- `.madrun.ts` is the source of truth for scripts. After a change, run `madrun --init`.
  `--init` deletes scripts it does not own, so check `package.json` after it.

## Specs

- Test name is `scope: subject`. supertape rejects a name with no colon.
- One assertion per test. Bind both sides: `const result = …; const expected = …;`.
- Give an empty expected value a type: `const expected: string[] = [];`. Never `typeof result`.
- Do not put the message in a variable. Write it in the call: `t.report('x', 'the message')`.
- A regression test must fail without the fix. Stash the fix and check it.
- A rule that reports needs a fixture with nothing to find and a `t.noReport`.

## Install

- Use `bun i --no-save <pkg>`. The repository has no lock file on purpose.
- `npm i` does not complete here. It hangs.

## Investigate

- Ask the MCP server (`packages/mcp`) before you write a probe script. See
  [`docs/tooling.md`](docs/tooling.md).
- Use `transform` and `find_places` before you write a spec for a new rule. Send the edge cases
  to the tool: a `var` used outside its block, a declaration in a `for` header, a `switch` case.
  A spec only checks the cases that you wrote.
- e2e uses the prebuilt bundle in `out/`. Run `bun run build` before e2e.
- Check that the thing you measure is in the state you think. A probe that writes a file must
  check the file changed. A probe that checks a rule is silent must check the rule has
  something to report.
- A check that runs a cheaper path than the user proves nothing about the user path.
  Compile is not run. `find_places` is not `transform`. A unit spec is not a browser.
- Say clearly what you did not verify.

## Docs

- One fact has one place. Before you add a fact, search for it and update the existing place.
- A fact about one piece of code goes in a comment at that code. A map or a trap that crosses
  files goes in `docs/`.
- An open defect or an idea goes in [`docs/backlog.md`](docs/backlog.md): minimum repro, result,
  expected result. When it is fixed, delete it there and keep only the lesson in the topic file.
- Write in simple technical English (ASD-STE100 style): short sentences, active voice, one
  instruction per sentence. No history, no stories.
- A `js` fence must be valid, lint-clean JavaScript. Use `ts` for TypeScript and `text` for
  output. See [`docs/tooling.md`](docs/tooling.md#markdown-fences).
