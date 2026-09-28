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

