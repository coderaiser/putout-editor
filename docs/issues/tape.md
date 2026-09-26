# tape / putout lint findings

Both rewrites are **by design**; what follows is the narrower gap each leaves.
Status: ✅ resolved, ❌ open.

Fenced `ts` because the repro must typecheck cleanly *before* the fix — otherwise
"the tool broke it" is not provable. Untyped, `fixtures[c]` raises its own `TS7053`.

Relevant because CI's Lint step is `redrun fix:lint` (= `putout . --fix`) followed by an
auto-commit with `continue-on-error: true`: a fixer that leaves the tree unbuildable
silently rewrites `master`.

***

## ✅ `tape/extract-result-from-assertion` — solution: write the type

Agreed: hoisting the expected value into a `const` is correct, and the house style is
always `(result, expected)`. The gap was that a bare array literal gives the hoisted const
nothing to infer from, and the fixer did not supply the type.

**Solution: emit the type on the hoisted const** — `const expected: string[] = [];`. Owner:
us. The rule lives in `eslint-plugin-putout`, so the change lands there, not in this repo.

```ts
import {test} from 'supertape';

const categories: string[] = ['a'];
const fixtures: Record<string, number> = {
    a: 1,
};

test('repro', (t) => {
    const result = categories.filter((c) => !fixtures[c]);
    
    t.deepEqual(result, []);
    t.end();
});
```

```diff
 test('repro', (t) => {
     const result = categories.filter((c) => !fixtures[c]);
+    const expected = [];

-    t.deepEqual(result, []);
+    t.deepEqual(result, expected);
     t.end();
 });
```

`tsc` went from 0 errors to:

```
error TS7034: Variable 'expected' implicitly has type 'any[]' in some locations
  where its type cannot be determined.
error TS7005: Variable 'expected' implicitly has an 'any[]' type.
```

**Expected:** `const expected: string[] = [];` — or leave an untypeable literal inline,
since extracting it only moves the inference problem. **Suggested:** the rule already has
to infer a type to emit; emitting it is a small step and removes the `TS70x` class
entirely. This is the "add types" work.

***

## ❌ `tape/apply-stub` — rewrites to a `stub` it does not import

Agreed: `async () => value` → `stub().resolves(value)` is the intended transform. Open: the
fixer emits the name `stub` without binding it, so it can land on a different `stub`
already in scope, and the rewrite is unusable until `stub()` has types.

The local `stub` below is deliberate — it is the case that shows the failure mode.

```ts
import {test} from 'supertape';

const gist = (files: Record<string, string>) => ({
    ok: true,
    status: 200,
    json: async () => ({
        files,
    }),
});

const stub = (response: unknown) => {
    seen.push(String(response));
    
    return seen;
};

const seen: string[] = [];

test('repro', (t) => {
    const result = stub(gist({}));
    
    t.ok(result);
    t.end();
});
```

```diff
 const gist = (files: Record<string, string>) => ({
     ok: true,
     status: 200,
-    json: async () => ({
+    json: stub().resolves({
         files,
     }),
 });
```

Before the fix: `tsc` clean, test passes (1 test, 1 pass). After:

```
error TS2554: Expected 1 arguments, but got 0.
error TS2339: Property 'resolves' does not exist on type 'string[]'.
```

and the test **fails** (1 test, 0 pass) — `stub()` was called with no arguments and
returned the local helper's `string[]`.

**Expected:** when the rule introduces `stub`, add the import that binds it, so the
rewrite cannot resolve to something else.
