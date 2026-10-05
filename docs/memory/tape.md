# tape and supertape

**The essence: nothing is wrong with the types.** `stub` is typed and `supertape` re-exports it,
so this just works:

```ts
import {stub} from 'supertape';

const get = stub().resolves<number[]>([]);
```

`@cloudcmd/stub@5.1.0` declares `resolves<T>(value: T) => Stub<Args, Promise<T>>`, and
`supertape@13.6.1` has `export {Stub, stub} from '@cloudcmd/stub'`.

**What is missing is the two rules that would write that for you** —
`tape/apply-stub` and `tape/extract-result-from-assertion` live in `packages/plugin-tape/lib/`
upstream and are **not** in the published `eslint-plugin-putout` (which ships only
`tape-add-newline-before-assertion`, `tape-add-newline-between-tests` and
`tape-remove-newline-before-t-end`), so nothing reproduces them here. Re-check by looking for
those two directories upstream, not by running the fixer.

**Two lines by hand, until it lands.** `import {stub} from 'supertape';` and the type, worked
out and written down — never `typeof result`, which hands the typing back to the compiler and
tells a reader nothing:

```ts
const expected: string[] = [];
```

A missing rule is an argument, not a reason for a lenient spec.

## A silent suite prints nothing, and coverage still prints a number

`supertape`'s emitter lives in a **module-level** `mainEmitter`. So if the CLI and
the specs end up importing **two different copies** of `supertape`, the tests
register on one and the CLI drains the other — and the run is a clean exit 0 with
**zero bytes on stdout and stderr**. Not `1..0`: nothing at all, so "read the
count, not the exit code" has no count to read.

It happens when `@putout/test` holds a nested `supertape` the root does not have:
`bin/test.js` imports `supertape/bin/supertape`, which resolves *nearest first*,
while a spec's bare `import {test} from 'supertape'` resolves to the root copy.
Two instances, one `mainEmitter`.

Check they are one before trusting a green suite — `NESTED` is
`node_modules/@putout/test/node_modules/supertape/lib/supertape.js` and `ROOT` is
`node_modules/supertape/lib/supertape.js`:

```sh
node -e "Promise.all([import('NESTED'), import('ROOT')]).then(([a, b]) => console.log(a.default === b.default))"
```

`false` means the suite ran nothing. Fix with a root `overrides` pin rather than
deleting the directory — `node_modules` is gitignored, so an edit there is not a
change, it is a rumour.

**The trap worth remembering** is that `c8`'s `all: true` then reports coverage
for files **no test imported** — 41.76% lines that read as "coverage is low"
rather than "coverage is measuring nothing". Both streams silent, exit code 0,
and a percentage that looks like a measurement. See
[`../issues/scripts.md`](../issues/scripts.md).

