# tape / putout lint findings

Bugs found in the `tape/*` putout rules, observed while refactoring
`packages/client` specs. Both are reproducible: drop the snippet into
`packages/client/src/store/` and run `npx putout <file> --fix`.

Both matter more than usual here, because CI's Lint step is
`redrun fix:lint` (which is `putout . --fix`) followed by an auto-commit with
`continue-on-error: true`. A fixer that leaves the tree unbuildable silently rewrites
`master` instead of stopping.

***

## 1. `tape/extract-result-from-assertion` extracts, but does not carry the type

**By design:** the rule hoists the expected value into a `const`, and the house style is
always `(result, expected)` with both bound to consts - never `(result, [])`. The
transform is correct.

**The gap:** when the expected value is a bare array literal there is nothing left for
the extracted const to infer from, so the fixer has to supply the type. It does not, and
the result does not typecheck.

### Input

Fenced as `ts` rather than `js` on purpose: the repro is a `.ts` spec, and it has to
typecheck cleanly *before* the fix, otherwise "the fix introduced these errors" is not
provable. Written without annotations, `fixtures[c]` raises its own `TS7053`.

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

### Result received

```diff
 test('repro', (t) => {
     const result = categories.filter((c) => !fixtures[c]);
+    const expected = [];

-    t.deepEqual(result, []);
+    t.deepEqual(result, expected);
     t.end();
 });
```

Then `npx tsc --noEmit`:

```
src/store/zz1.spec.ts(10,11): error TS7034: Variable 'expected' implicitly has type
  'any[]' in some locations where its type cannot be determined.
src/store/zz1.spec.ts(12,25): error TS7005: Variable 'expected' implicitly has an
  'any[]' type.
```

`tsc` reported **0 errors before** the fix and **2 after**.

### Expected

The extracted const should carry its type: `const expected: string[] = [];`. Anything that
cannot be typed from context should be left inline rather than extracted, since extracting
it only moves the inference problem - `t.deepEqual(result, [])` infers from the assertion,
the extracted const no longer has anything to infer from.

***

## 2. `tape/apply-stub` rewrites to a `stub` it does not import

**By design:** turning `async () => value` into `stub().resolves(value)` is the intended
transform.

**The gap:** the fixer emits the name `stub` without ensuring it is bound. It adds no
`import {stub} from 'supertape'`, so the name resolves to whatever `stub` already is in
scope - and when the file declares its own, the rewrite silently targets the wrong
function. The rewrite is also unusable until types exist for `stub()`.

### Input

Fenced as `ts` for the same reason as finding 1. The local `stub` below is deliberate:
it is the case that shows the failure mode.

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

Before the fix: `tsc` clean, and the test **passes** (1 test, 1 pass).

### Result received

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

Then `npx tsc --noEmit`:

```
src/store/zz2.spec.ts(6,11): error TS2554: Expected 1 arguments, but got 0.
src/store/zz2.spec.ts(6,18): error TS2339: Property 'resolves' does not exist on type
  'string[]'.
```

And the test now **fails** (1 test, 0 pass) - `stub()` was called with no arguments and
returned the unrelated recording helper's `string[]` rather than a stub.

### Expected

When the rule introduces the name `stub`, it should add the import that binds it, so the
rewrite cannot land on a different `stub` already in scope. With that in place, and types
for `stub()` added, the transform is sound.
