# putout plugins

Rules in `packages/plugin-putout-editor` — the [README](../../packages/plugin-putout-editor/README.md)
has the ❌/✅ pair for each. `docs/plugins.md` is the guide for writing one.

| Rule | Kind | What it found |
|---|---|---|
| `press-modifier-case` | code | six `ControlOrMeta+V` in the e2e specs, passing while meaning nothing |
| `apply-type-check` | code | `node?.type === 'StringLiteral'` → `isStringLiteral(arg)` |
| `remove-rgb-outside-tokens` | filesystem | the one hardcoded colour outside `css/tokens.css` |
| `remove-z-index-outside-tokens` | filesystem | seven raw `z-index` numbers, now a `--z-*` scale |

A **code** rule sees one file and runs under `putout .`. A **filesystem** rule is about a tree
and runs under `redlint`, because a 🐊**Putout** rule knows nothing about filenames. Both are in
`packages/client`'s `fix:lint`, so CI enforces them with no extra step.

## ✅ report-only is possible, at the cost of one no-op action

A plugin needs one of `find`, `traverse`, `replace`, `include`, `exclude`, `rules`, `declare` or
`scan` for the loader to recognise it, and a `find` with no `fix` throws in the normal runner.
`check-match` in `@putout/plugin-putout` is a replacer whose `replace` maps the pattern **to
itself**. The two filesystem rules do the same and their tests assert the file comes back byte
for byte — choosing which token a colour becomes is a human decision.

## 💡 a putout rule cannot see comments

`parse` drops comments: they are not nodes, and `types.isComment` does not exist. So "no
comments in a rule" cannot be a rule. It is `scripts/check-comments.js`, run from the plugin's
own `lint` and `fix:lint`.

## 💡 `apply-type-check` fires on domain types too

It rewrites any `x.type === 'Y'` where `types['isY']` exists, and it cannot see types. In this
repository that broke `defaultESTreeParserInterface`, whose `AstNode` is the Editor's own
interface and not a babel `Node` — `isProgram(node)` does not compile. Reverted, and worth
knowing before this lands in `@putout/plugin-putout`: the existence check is necessary but not
sufficient, because a domain type can share a name with a node type.
