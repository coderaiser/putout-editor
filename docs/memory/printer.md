# `@putout/printer` — the type checker, and the 🐊infrastructure behind it

Read from `node_modules/@putout/printer@18.46.0` (a real dependency, via
`putout`). The type checker is the part worth knowing: it is **not** a type
system, it is a **coverage-instrumented ordered predicate table**, and it is the
reason 🐊**Putout** can assert "every check fires in the test suite".

## What it actually is

`createTypeChecker(typeNames, overrides?)` → `(path, options?) => boolean`.

An **ordered list of clauses**; the first that matches wins. Two clauses carry
the semantics:

```js
// lib/tokenize/type-checker/type-checker.js
const typeChecker = (path, options) => {
    for (const [index, {result, selector, typeName, not}] of checkers.entries()) {
        let currentPath = path;
        
        if (selector)
            currentPath = jessy(selector, path);
        
        if (equal(not, currentPath, typeName))
            return [index, result];
        
        if (maybeCall(typeName, not, currentPath, options))
            return [index, result];
    }
    
    return SKIP;
};
```

The selector is read like a **path expression** — `'parentPath ->
!CallExpression'` means "the `parentPath` selector, and it must not be a
`CallExpression`". `SKIP` is `[Infinity, false]`, so **no match is `false`, and
it is distinguishable from a match**. That is what makes coverage counting
possible.

Real use, `lib/tokenize/is.js` — the second row's comment is why the order is
what it is:

```js
export const isFirstArgOfCall = createTypeChecker([
    // cheap guard: one jessy selector, rejects almost every node
    ['-: parentPath -> !CallExpression'],
    
    // expensive: only reached for the nodes the guard let through
    ['+', isPathFirstArg],
]);
```

**First matching clause wins, so ordering is the whole optimisation.** The `'-'`
row is a guard that rejects 99% of nodes for the price of one `jessy` selector;
the `'+'` row never runs for those.

## The clause forms, all measured from `parsers.js`

| Written as | Means |
|---|---|
| `'TypeName'` | `node.type === 'TypeName'` |
| `'selector -> TypeName'` | `jessy(selector, path)` then type-compare |
| `'selector -> !TypeName'` | …and it is **not** that type |
| `['+', fn]` / `['-', fn]` | call `fn(path[, options])`, coerce with `+/-` |
| `'a -> Type'` with a trailing `+`/`-` | `createTuple` → a `Boolean` checker |

Three grammars that look similar and are **not** interchangeable:

- `parseOperation` splits on `:` then ` -> ` → `[result, selector, not]`
- `createTuple` splits on a **trailing** `+`/`-` (popped off the end)
- `parseComparison` takes `['+', '>', 5]` → a numeric comparator

Getting them mixed up throws immediately, which is the good case:

```
☝️Looks like not: 'x', it must be empty or '!' in checker: '...'
☝️Looks like typeName includes ':', most likely you forget the arrow: ' -> '
☝️Looks like type checker missing successful route ('+'), it will always fail
```

The last one is thrown by `validateResults` at **construction** time — a table
with no `'+'` can never return `true`, so it fails loudly instead of returning
`false` forever. **A guard that runs once, at build time, is worth more than one
that runs per node.**

## The part that is not a type checker at all — `TYPE_CHECK`

`createTypeChecker` wraps the returned function in `instrument()`. Note the two
comments are load-bearing and neither is decoration:

```js
export const instrument = (typeNames, fn, overrides = {}) => {
    const location = parseCallLocation(Error());
    
    // skip the checker's own specs, or they would cover themselves
    if (env.TYPE_CHECK && !location.includes('type-checker.spec.js'))
        coverage.set(location, {covered, typeNames});
    
    return (path, options) => {
        const [index, result] = fn(path, options);
        
        if (on && index !== Infinity)
            covered.add(index);
        
        return result;
    };
};
```

Then `node_modules/.bin/tape` — which is `@putout/test`'s bin — ends every run:

```js
import {callWhenTestsEnds} from 'supertape';
import {whenTestsEnds} from '@putout/printer/type-checker/when-tests-ends';
callWhenTestsEnds('PUTOUT_INSTRUMENT', whenTestsEnds);
```

`report(coverage)` prints, per table, every clause **index never hit**, with a
babel code frame, and returns exit code **1**:

```
🧨 Uncovered Checkers found at index: 1
  > 1 | ['-', ...]
      |      ^
# 🌴 Checkers Covered
```

**This is the 🐊infrastructure fact worth carrying: 🐊**Putout** measures its own
predicates.** Not line coverage — *clause* coverage of each check table. A rule
whose second guard branch never fires in any spec fails the build. That is
strictly stronger than c8, and it is the mechanism behind the repo's "a passing
test is not a covered test" rule.

**Two traps, both cost a debugging session here:**

1. **`node_modules/.bin/tape` is `@putout/test/bin/test.js`, not supertape.**
   That wrapper is the only thing that wires `callWhenTestsEnds`. Run
   `node node_modules/supertape/bin/tracer.js` and you get a correct test run
   with **no** checker coverage at all — the type checker silently does nothing.
2. The instrumentation keys off the **call stack line** (`STACK_INDEX = 3`) and
   **skips any location containing `type-checker.spec.js`**, so the checker's own
   tests cannot make it look covered.

## Reuse in this repo

- **`packages/mcp` has no way to ask this.** A `type_check` tool would take
  `{code, typeNames}` and return the matching clause index + the uncovered list —
  answering "which of my `match` arms does this fixture hit, and which are dead?"
  directly, instead of running every plugin and diffing the output.
- **The same table answers `name_pattern`/`test_pattern` better.** They ask
  "which of these 116 rules match this snippet?" by *running* the rules. A clause
  table is the declarative version of the same question and answers it without a
  runner.
- **`fixCount` is flatlint's, not this one's** — see
  [`flatlint.md`](./flatlint.md). Different bound, different problem: flatlint's
  stops an oscillating *fix loop*, the printer's counts *predicate coverage*.
