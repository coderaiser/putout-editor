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
