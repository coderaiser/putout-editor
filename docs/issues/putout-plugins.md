# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule                            | Kind       | What it found                                                         |
|---------------------------------|------------|-----------------------------------------------------------------------|
| `press-modifier-case`           | code       | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing |
| `remove-comments`               | code       | the `scripts/check-comments.js` gate, as a rule                       |
| `remove-rgb-outside-tokens`     | filesystem | the one hardcoded colour outside `css/tokens.css`                     |
| `remove-z-index-outside-tokens` | filesystem | seven raw `z-index` numbers, now a `--z-*` scale                      |

`apply-type-check` was here too and is not any more: it is `@putout/plugin-putout` now, which
is where a rule that helps any 🐊**Putout** user belongs.

A **code** rule sees one file and runs under `putout .`. A **filesystem** rule is about a tree
and runs under `redlint`, because a 🐊**Putout** rule knows nothing about filenames. Both are in
`packages/client`'s `fix:lint`, so CI enforces them with no extra step.

## ✅ report-only is possible, at the cost of one no-op action

A plugin needs one of `find`, `traverse`, `replace`, `include`, `exclude`, `rules`, `declare` or
`scan` for the loader to recognise it, and a `find` with no `fix` throws in the normal runner.
`check-match` in `@putout/plugin-putout` is a replacer whose `replace` maps the pattern **to
itself**. The two filesystem rules do the same and their tests assert the file comes back byte
for byte — choosing which token a colour becomes is a human decision.

## ✅ a putout rule can see comments

`parse` does not drop them. They are not nodes and `types.isComment` does not exist, but
`leadingComments`, `trailingComments` and `innerComments` are on the AST, so a `traverse` over
the declarations and a `push` per entry sees every one:

```js
export const traverse = ({push}) => ({
    VariableDeclaration: (path) => {
        for (const key of KEYS) {
            const comments = path.node[key] || [];
            
            comments.map(() => push({
                path,
                key,
            }));
        }
    },
});
```

`fix` empties the array it was handed, and the printer reprints without them. So "no comments
in a rule" is `remove-comments`, a rule, running under `putout .` with the rest. The
`scripts/check-comments.js` it replaces was a second gate in a second language over the same
files, and its coverage `exclude` still named the directory it no longer has.

## 💡 `apply-type-check` fires on domain types too

It rewrites any `x.type === 'Y'` where `types['isY']` exists, and it cannot see types. In this
repository that broke `defaultESTreeParserInterface`, whose `AstNode` is the Editor's own
interface and not a babel `Node` — `isProgram(node)` does not compile. Reverted here, and it
is in `@putout/plugin-putout` now: the existence check is necessary but not sufficient, because
a domain type can share a name with a node type.
