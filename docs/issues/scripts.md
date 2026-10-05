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
## ❌ a nested `supertape` under `@putout/test` makes every suite run **0 tests** and exit 0

The entry above is a wrong binary on `PATH`. This one is the right binary, and it
is the same failure with no `PATH` involved at all — so the check it names does
not catch it.

**The minimum**

```sh
$ cd packages/chat
$ bun run test
$ echo $?
0
# no TAP output at all
```

**Expected** — `1..368 / # tests 368 / # pass 368`. **Got** — no output, exit 0.
Worse than the case above: [`tape.md`](../memory/tape.md) says read the **count**,
not the exit code, but there is no count either — **both streams are 0 bytes**, so
the one defence that document offers has nothing to read.

**Why.** `@putout/test` declares `supertape: ^13.0.0` and had installed
**13.6.1** nested under itself, while the root `supertape` is **13.6.2**:

```
node_modules/@putout/test/node_modules/supertape/lib/supertape.js   13.6.1
node_modules/supertape/lib/supertape.js                            13.6.2
```

`@putout/test/bin/test.js` does `import 'supertape/bin/supertape'`, which resolves
to the **nested** copy. That copy's `cli.js` calls `supertape.createStream()` and
`supertape.run()` on *its own* module instance — while every spec does
`import {test} from 'supertape'`, which resolves to the **root** copy. Two
instances of a module with a module-level `mainEmitter`, so the tests register on
one emitter and the CLI drains the other:

```sh
$ node -e "Promise.all([import('NESTED'), import('ROOT')]).then(([a, b]) => console.log(a.default === b.default))"
false
```

**Why it is invisible.** Nothing throws. The nested CLI reports success for a run
with nothing in it, so `check`, `coverage` and CI's test step all pass — and
`coverage` then prints a *number*, which is what makes it convincing:

```
All files | 41.76 | 100 | 1.26 | 41.76
ERROR: Coverage for lines (41.76%) does not meet global threshold (100%)
```

41.76% is `all: true` instrumenting files **no test ever imported**. It reads as
"coverage is low" rather than "coverage is measuring nothing", so the obvious
next step — write more tests — is the wrong one.

**The fix** is a root `overrides` pin, so one `supertape` serves both — in
`package.json`, beside `workspaces`:

```js
const overrides = {
    supertape: '13.6.2',
};
```

Verified with `bun i --no-save --force`: the nested directory is not created, and
`chat` 368, `client` 1050 pass with `All files 100 / 100 / 100 / 100`.

**The check that catches it** is that the count is non-zero *and* the suite is the
one you meant. `bun run test` printing nothing is the finding; a green run is not
evidence the tree was tested at all.
