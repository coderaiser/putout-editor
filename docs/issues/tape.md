# tape / putout lint findings

Bugs found in the `tape/*` putout rules, observed while refactoring
`packages/client` specs. Both are reproducible: drop the snippet into
`packages/client/src/store/` and run `npx putout <file> --fix`.

Both matter more than usual here, because CI's Lint step is
`redrun fix:lint` (which is `putout . --fix`) followed by an auto-commit with
`continue-on-error: true`. A fixer that breaks the build silently rewrites
`master` instead of stopping.

Severity is judged from the impact on a repo that runs the fixer unattended.

***

## 1. `tape/extract-result-from-assertion` emits code that does not typecheck

**Severity: high.** Introduces new `tsc` errors into a file that was clean, so
`bun run check` fails immediately after a fix pass.

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

The extracted `expected` should carry a type, e.g. `const expected: string[] = [];`, or
an array literal should be left inline rather than extracted. Extracting a bare `[]` moves
the inference problem rather than solving it: `t.deepEqual(result, [])` infers from the
assertion, the extracted const no longer has anything to infer from.

***

## 2. `tape/apply-stub` rewrites to an unbound `stub`

**Severity: high.** Breaks `tsc` *and* turns a passing test into a failing one, while
still exiting 0 from `putout --fix`.

### Input

Fenced as `ts` for the same reason as finding 1.

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

And the test now **fails** (1 test, 0 pass).

The fixer emitted `stub().resolves(...)` but added no `import {stub} from 'supertape'`,
so `stub` resolved to the unrelated local recording helper declared in the same file —
the one that returns `string[]`.

### Expected

Either add the `supertape` import, or leave the call alone. Rewriting to a name that is
not in scope is worse than not fixing: the result is a file that no longer compiles, and
the transform claims success. A rule that cannot see the binding of the name it introduces
should not introduce it.
