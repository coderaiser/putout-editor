# Scripts

**Open only.** What was fixed is in [`../memory/`](../memory/).

## ❌ `AGENTS.md` documents three scripts that were not at the root

`AGENTS.md` § "Verify before claiming done" tells every agent to run these from the repo root.
At `fcd6171` none of them was in the root `package.json`:

```sh
$ bun run check
error: Script not found "check"

$ npx madrun test:one
one of scripts not found: test:one
```

**Expected.** Three commands, at the root, as written. **Got** — each exits 1. The root
`package.json` had exactly `build`, `start`, `start:dev`, `test`, `test:e2e`, `coverage`, `lint`,
`test:dts`, `fix:lint`, `report`, `gen:diagrams`; `check`, `test:one`, `coverage:json` and
`test:json` existed **only** in `packages/client`, and `packages/mcp`, `packages/server` and
`packages/plugin-putout-editor` had none of them.

The gate is the one that hurts: `AGENTS.md` calls `bun run check` "the gate, not the four
commands", and it is the one a reader runs last.

`npx madfork test:one` showed the shape. The client's 1029 tests passed, and the fan-out then
aborted on the first package that lacked the script:

```
1..1029
# tests 1029
# pass 1029

🌿 /home/coderaiser/putout-editor/packages/client
One of scripts not found: test:one
Command failed: .../node_modules/redrun/bin/redrun.js test:one
🦀 /home/coderaiser/putout-editor/packages/mcp
```

**A workspace fan-out that aborts on the first package missing a script reports the missing
script, not the packages that passed** — the same "a check that passes on a cheaper path than the
user takes" ([`../../AGENTS.md`](../../AGENTS.md)): 1029 green tests and a non-zero exit are the
same run, and the exit is the one the reader sees.

**Being fixed in a parallel change**, which adds the scripts to every workspace package and to
the root. Re-check by running the three commands and confirming none of them prints `one of
scripts not found` — not by reading this line. **Verified still reproducing at `fcd6171`**, and
already resolved in the working tree, where `npx madrun check` now runs
`putout . && madfork test:dts && madfork coverage`.

## ❌ a `tape` from another checkout on `PATH` makes every suite report **0 tests** and exit 0

Found while running the gate at the end of a long session, and it is the most
dangerous kind of failure here because it looks like success.

**The minimum**

```sh
$ cd packages/commands
$ bun run test
$ echo $?
0
# no TAP output at all
```

**Expected** — `1..123 / # tests 123 / # pass 123`. **Got** — no output, exit 0, in
*every* package: `client` reported 1050 passing tests minutes earlier and then
reported nothing at all.

**Why.** `tape` is not a binary in this repository's terms — it is
`@putout/test`'s `bin/test.js`, which wraps `supertape` and wires 🐊**Putout**'s
clause coverage. On this machine `type tape` resolves to

```
/home/coderaiser/putout/node_modules/.bin/tape
```

— the sibling 🐊**Putout** checkout, which has the same bin name. Run from
`putout-editor`, that binary resolves its own `supertape` from
`/home/coderaiser/putout/node_modules`, matches no spec files under this tree,
and exits 0 having run nothing. `packages/mcp/node_modules/.bin/tape` is a
**dangling** symlink to a `supertape` that is not installed there at all.

This is [`../memory/tape.md`](../memory/tape.md)'s "read the **count**, not the
exit code" arriving in a new form: the trap there is a suite that ran 284 tests
with the wrong reporter, and the trap here is a suite that ran **none**. Both are
invisible to `$?`.

**The check that catches it** is a second `PATH` entry pointing at another repo —
so the fix is to resolve the binary rather than to trust the name:

```sh
node ./node_modules/supertape/bin/tracer.js "src/**/*.spec.ts"
```

Verified with that, and the same numbers came back: `commands` 123, `chat` 368,
`mcp` 236, all passing. `putout .` is unaffected — it resolves its own plugins
from this tree — so the lint was clean while every test suite was silent.
