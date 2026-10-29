# flatlint

A token-based linter that can fix syntax errors. It is a dependency of `redlint`. The mcp
`flatlint_rule` tool writes and checks its rules.

## Model

- `lint(source, overrides)` returns `[source, places]`: parse to `js-tokens`, run plugins,
  print the tokens. There is no AST, so a rule works on a file that does not parse.
- The runner stops after 10 fix passes (`fixCount`), or earlier when nothing changes. Two rules
  that undo each other do not hang it. 🐊**Putout**'s runner has no such limit.
- It uses `@putout/engine-loader` (`loadPlugins`) and `@putout/operator-keyword`. It has its own
  printer.

## Plugin shape

A plugin is a 🐊**Putout** replacer: `report`, optional `match`, `replace`. Export `report` first.

```js
export const report = () => 'Add missing round brace';

export const match = () => ({
    '__a(__args': (vars, path) => !path.isNextPunctuator(closeRoundBrace),
});

export const replace = () => ({
    '__a(__args': '__a(__args)',
});
```

- `match` is per key: the runner finds the guard by the `replace` key it runs. **A `match` key
  that is not a `replace` key is dead:** it never runs and the rule fires everywhere. The
  `flatlint_rule` tool reports this.
- A `match` function gets `(vars, path)`. `path` is a token path with methods such as
  `getPrev`, `isNextPunctuator`, `isPrevKeyword`, `isInsideTemplate`. It has no `node` and no
  `parentPath`.
- `false` from `match` skips the place: no fix and no report. Only a negative fixture proves a
  guard works.

## Tests

`lib/test/test.js` adapts `lint` to `@putout/test`: it converts `[code, places]` to
`{code, places}` and passes it as `lint` to `createTest`. All `t.*` operators are the
`@putout/test` ones.

- One directory per rule: `index.js`, `index.spec.js`, `fixture/<name>.js` and
  `<name>-fix.js`.
- `t.transform('function')` reads the fixture named `function`, not the rule name.

## Lesson

A check must test what a thing does, not that a name exists. An earlier `flatlint_rule` rejected
every plugin with a `match` export, because it was written from a wrong belief. To test such a
checker, run it on every real rule of the target codebase and expect no rejection.
