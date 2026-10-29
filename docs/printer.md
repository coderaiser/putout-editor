# `@putout/printer`

Two parts matter here: the type checker (behind the mcp `type_check` tool) and visitors (behind
`printer_visitor`). Source: `node_modules/@putout/printer`.

## Type checker

`createTypeChecker(typeNames, overrides?)` returns `(path, options?) => boolean`. It is an
ordered list of clauses, not a type system. The first clause that matches decides the result.

| Clause | Means |
|---|---|
| `'TypeName'` | `node.type === 'TypeName'` |
| `'selector -> TypeName'` | read `selector` with `jessy`, then compare the type |
| `'selector -> !TypeName'` | and it is not that type |
| `['+', fn]` / `['-', fn]` | call `fn(path, options)`, result `true` / `false` |
| `'-: parentPath -> !CallExpression'` | result `false` when it matches |

- No match returns `false`, but it is not the same as a match: the index is `Infinity`.
- Put cheap guards first. A clause after a match never runs.
- A table with no `'+'` clause throws when you build it.
- Grammar errors throw at once:
  `☝️Looks like typeName includes ':', most likely you forget the arrow: ' -> '`.

### Clause coverage

`createTypeChecker` wraps each table with `instrument()`. With `TYPE_CHECK` set, it records the
clause indexes that matched. At the end of the run, `node_modules/.bin/tape` (the `@putout/test`
wrapper) prints each clause that never matched and exits 1:

```text
🧨 Uncovered Checkers found at index: 1
```

- Only `node_modules/.bin/tape` turns this on. `supertape/bin/tracer.js` runs the tests with no
  clause coverage.
- The key is the call location `at:uri:line:column`. The third field must be a number.
- Locations that contain `type-checker.spec.js` are skipped.

## Visitors

The printer prints a Babel AST. `happy-mark`, `happy-style` and `happy-sql` convert their
language to JS call expressions and print them with their own visitors.

- `currentTraversers = {...baseVisitors, ...visitors}`: a visitor has the name of a node type and
  replaces the base visitor.
- Signature: `(path, api) => void`.

| `api` key | Does |
|---|---|
| `write(text)` | write one token. The only output |
| `print(key)` | print a child by key or pattern |
| `traverse(path)` | print a path or an array of paths |
| `indent()` | write the indent; `indent.inc()`, `indent.dec()`, `indent.getLevel()` |
| `maybe.print/newline/space/linebreak/breakline` | write only when the format needs it |
| `quote`, `debug`, `store` | quotes, tracing, state for one print |

```js
export function rule(path, {write, traverse, indent}) {
    const [selectorArg, declarationsArg] = path.get('arguments');
    
    indent();
    traverse(selectorArg);
    write(' {\n');
    indent.inc();
    
    for (const declaration of declarationsArg.get('elements'))
        traverse(declaration);
    
    indent.dec();
    indent();
    write('}\n');
}
```

- A language construct needs two parts: an `is*` check on `path.node.callee.name`, and a
  `CallExpression` visitor that dispatches through those checks.
- An unknown node type throws:
  `☝️ Node type 'X' is not supported yet by @putout/printer`.
- A visitor that does not call `write` gives no error. The token is missing from the output.
  `getTokens()` shows what was written.
- `print()` takes the AST from `putout`'s own `parse()`. That parser sets `node.raw`;
  `@babel/parser` does not.
