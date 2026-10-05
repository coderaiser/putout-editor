# Scripts

**Open only.** What was fixed is in [`../memory/`](../memory/).

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
