# tape findings

## The types are fine

`stub` is typed and `supertape` re-exports it, so there is nothing to configure and nothing
wrong to fix:

```ts
import {stub} from 'supertape';

const get = stub().resolves<number[]>([]);
```

`supertape@13.6.1`'s `lib/supertape.d.ts` has `export {Stub, stub} from '@cloudcmd/stub'`, and
`@cloudcmd/stub@5.1.0`'s `lib/stub.d.ts` declares
`resolves: <T>(value: T) => Stub<Args, Promise<T>>`. Neither package sets a `types` field;
TypeScript finds the `.d.ts` beside the `.js`.

## What is actually wrong: two rules that do not ship

`tape/apply-stub` would add that import when a rule introduces `stub(...)`, and
`tape/extract-result-from-assertion` would type the const it hoists. Both are in the 🐊**Putout**
repo at `packages/plugin-tape/lib/`, and **neither is in the published `eslint-plugin-putout`** -
the installed plugin ships only `tape-add-newline-before-assertion`,
`tape-add-newline-between-tests` and `tape-remove-newline-before-t-end`. So `putout . --fix`
changes nothing here, and neither rule can be reproduced in this repository.

**So do it by hand.** Two lines:

1. the import, when a rule introduces `stub` - `import {stub} from 'supertape';`
2. the type, when the expected value gives the const nothing to infer from - a bare `[]` in an
   `unknown` position has no element type, so borrow the left operand's:

```ts
const result = categories.filter((c) => !fixtures[c]);
const expected: typeof result = [];

t.deepEqual(result, expected);
```

Always bind both sides to consts and assert `(result, expected)`. See the `AGENTS.md` note on
one-assertion-per-test for why the house style is the way it is, and
`docs/issues/putout-plugins.md` for where a rule gap like this gets filed.
