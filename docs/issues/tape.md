# tape

## ✅ nothing is wrong with the types

`stub` is typed, and `supertape` re-exports it, so this just works:

```ts
import {stub} from 'supertape';

const get = stub().resolves<number[]>([]);
```

- `@cloudcmd/stub@5.1.0` — `lib/stub.d.ts` declares `resolves<T>(value: T) => Stub<Args, Promise<T>>`
- `supertape@13.6.1` — `lib/supertape.d.ts` has `export {Stub, stub} from '@cloudcmd/stub'`

## ❌ two rules that would write it for you do not ship

`tape/apply-stub` (adds the import) and `tape/extract-result-from-assertion` (types the hoisted
const) are in the 🐊**Putout** repo at `packages/plugin-tape/lib/`, and **neither is in the
published `eslint-plugin-putout`**. The installed plugin ships only
`tape-add-newline-before-assertion`, `tape-add-newline-between-tests` and
`tape-remove-newline-before-t-end`, so nothing reproduces here.

**Solution — two lines by hand**, until it lands upstream:

1. `import {stub} from 'supertape';`
2. the type, worked out and written down — never `typeof result`, which hands the typing back
   to the compiler and tells a reader nothing:

```ts
const expected: string[] = [];
```
