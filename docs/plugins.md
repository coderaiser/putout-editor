# Writing 🐊**Putout** rules for this repository

For a human. The short version: a rule is a directory and a test, it is already wired into
the lint, and the fixer does the mechanical work so you do not.

## What 🐊**Putout** is here

Three things at once, and the confusion is usually about which one you are holding:

- a **linter** that reports;
- a **fixer** that rewrites the file - most rules fix, and several report *and* fix;
- a **platform** you extend yourself, in this repository, through the plugin system.

The third is the part that is easy to miss. Nothing here needs asking anyone. A new rule is
a directory and a test.

## What you get

You stop hand-maintaining a list and start *stating* it. The CSS architecture used to be a
comment in a stylesheet and had already broken - one hardcoded colour survived because
nothing could see it. It is a rule now, and the empty `check-css` script CI ran in place of
a check is gone.

On this repository, rules have already:

- found six `ControlOrMeta+V` presses in the e2e specs that passed while meaning nothing,
  because Playwright sends a key no keyboard produces;
- found the one hardcoded colour outside `tokens.css`, and kept it from coming back;
- rewritten the Editor's own optional chaining into `types` helpers.

None of those came from reading a diff. They came from running a command.

## The tools, and which to reach for

| Tool | Use it for |
|---|---|
| `putout .` | the lint - reports, and fixes with `--fix` |
| `putout . --fix` | the mechanical work: imports, quotes, whitespace, formatting |
| `redlint scan` / `redlint fix` | **filesystem** rules - anything about filenames or a tree |
| the mcp | asking instead of guessing - `get_example`, `parse`, `validate`, `transform` |

Start with the fixer. Hand-writing what a rule already decides costs a round trip every
time - the blank-line whitespace here was guessed wrong twice on one file before `putout
--fix` did it correctly in one command, including reordering the imports.


### Reach for the mcp before you guess

Two things that cost real time here, and that one mcp call would have answered:

- putout's AST is a **babel** AST, so a string is a `StringLiteral`, not a `Literal`.
  `parse` on the fixture settles it.
- a `ts` fence in markdown is linted as real code, and the rule that checks the fence
  language is `markdown/apply-ts-codeblock-in-file` - it runs under `redlint`, not `putout .`.

## Add a rule

Rules live in `packages/plugin-putout-editor`. It is private, and its shape is exactly every
other 🐊**Putout** plugin's - match `node_modules/@putout/plugin-tape` and the plugins in the
🐊**Putout** repo, and never rearrange it:

```
packages/plugin-putout-editor/
├── .madrun.js          test / lint / fix:lint / coverage
├── .nycrc.json         100% on all four metrics
├── .putout.json
├── README.md           one section per rule, with ❌ and ✅ examples
├── package.json
├── lib/
│   ├── index.js        the rules map
│   └── <rule-name>/index.js
└── test/
    ├── <plugin>.js     createTest + t.transform / t.report
    └── fixture/        <name>.js and <name>-fix.js
```

1. `lib/<rule-name>/index.js` - the rule: one `report`, and an action. Name it with a verb
   first, as 🐊**Putout** does - `remove-`, `apply-`, `add-`, `sort-`, `check-` - not `eqeqeq`.
2. `test/fixture/<name>.js` and `<name>-fix.js` - before and after. Generate the second with
   `UPDATE=1` rather than writing it by hand.
3. `test/<plugin>.js` - `createTest(import.meta.url, {plugins: [['putout-editor', plugin]]})`,
   then `t.transform('name')` and `t.reportCode(...)`.
4. Register it in `lib/index.js` and add its `README.md` section.
5. `bun run coverage` at 100%, and `putout .` clean.

It is already wired in, through `plugins` in the root `.putout.json` by **bare name**
(`"putout-editor"`), so there is nothing to enable. putout merges config up the tree, which
is why the rules reach `packages/client` despite its own `.putout.json`.

### Two kinds of rule, and the difference is not a detail

A **code** rule sees one file. `press-modifier-case` is one, and `putout .` runs it.

A **filesystem** rule is about a *tree* - "colours only in `tokens.css`", "no `console.log`
under `src/`". 🐊**Putout** rules deliberately know nothing about filenames, so a statement
about a tree cannot be expressed against one file. `matchFiles` is the operator that bridges
it, and such a rule runs under **`redlint`**, which builds the filesystem as JSON
(`__putout_processor_filesystem([...])`) and runs the rules over that. Run the rule and
nothing is modified; run `redlint fix` and the changes are applied.

That is why `packages/client` runs `redlint fix` inside its `fix:lint`: so the filesystem
rules are enforced by the lint CI already runs, with no extra step.

### Report-only is allowed, and it costs one no-op action

A plugin needs one of `find`, `traverse`, `replace`, `include`, `exclude`, `rules`, `declare`
or `scan` for the loader to recognise it, and a `find` with no `fix` throws in the normal
runner. When there is no safe automatic fix, give it a `replace` that prints the node back
unchanged - `check-match` does exactly this - and pin it with a test that runs the fix and
asserts the file comes back byte for byte.

Choosing which token a colour becomes is a human decision, so `remove-rgb-outside-tokens` is
report-only, and its test proves it changes nothing.

## Dogfooding: run a rule here before a user does

Every rule in this package runs on **this repository**, every commit, through the same lint CI
runs. That is the point of putting them here rather than only upstream, and it is not free — it
is the reason two of these rules exist at all.

A rule that has never met real code is a guess. `remove-undefined-token` was written because
colours and z-index were already policed and nothing policed the third thing: a `var(--x)` that
`tokens.css` never defines. It found one on its first run — `var(--color-selection-bg)` in
`codemirror.css`, sitting next to a `--color-selection-focused` that did exist. The browser
drops the whole property, so that selector looked styled and was not. Nobody had noticed
because there is no test for "the dark theme selection background renders".

The loop is: **write the rule → run it here → whatever it finds is the real work.** The
alternative is a user finding it, and filing it as a bug in the product rather than a gap in the
ruleset.

Two things follow, both learned the hard way.

**A rule that fires on your own source is telling you about your source, not about the rule.**
`remove-comments` fired on 50 places the first time `putout .` reached the whole repository,
because the plugin is wired in from the root config and a new rule is on everywhere until it is
scoped. That is not the rule misfiring. It is the rule working and the scope being wrong.

**The test suite is blind to this by construction.** The plugin's own tests were green while
`remove-comments` was breaking the repository, and green again while `remove-duplicated-receiver`
crashed on its own source. `putout .` over the whole repository is the only check that sees it.
Run that one, not the package suite.

A rule with no current violations is still worth having — it is a guard, and its value shows up
the next time a fixer rewrites the codebase. But say so in the commit, because a rule that found
nothing reads like a rule that was never run.

## Where a rule belongs

- **About this repository** -> `packages/plugin-putout-editor`. Wired in already.
- **About any 🐊**Putout** user** -> an idea in `docs/issues/putout-plugins.md`, with a
  repro. The 🐊**Putout** repo is where it becomes a released rule.
- **A defect in a tool** -> `docs/issues/`, with the minimum that shows it, what you got, and
  what you expected. Only what you verified reproduces.

## Two things that will surprise you

**`putout --fix` does not know the difference between code and prose.** It "fixed" an example
of a bug inside a markdown fence and deleted the point of the example. Keep anti-patterns out
of `js`/`ts` fences; write them inline.

**A fix can still need a human.** `apply-type-check` — which lives in `@putout/plugin-putout`
now, not here — rewrites `node.type === 'CallExpression'` into `isCallExpression(node)`, but
`plugin-declare` does not know the `is*` helpers live in `types`, so the import is yours to
add. That is one line, and the lint catches it as `no-undef` right after.
