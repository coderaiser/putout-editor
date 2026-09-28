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
│   └── <rule-name>/
│       ├── index.js    the rule: one report, and an action
│       ├── index.spec.js
│       └── fixture/    one <name>.js and <name>-fix.js per shape
└── test/
    ├── putout-editor.js   the rules map itself
    └── readme.js          the ❌/✅ fences, run through their own rules
```

1. `lib/<rule-name>/index.js` — the rule: one `report`, and an action. Name it with a verb
   first, as 🐊**Putout** does — `remove-`, `apply-`, `add-`, `sort-`, `check-` — and let the name
   be the claim about what it checks. `check-main-imports-only` says what it does;
   `css-architecture` claimed a whole document, and five sibling rules had nothing to do with it.
   **`report` goes first**, which is the order almost every rule in the 🐊**Putout** repo opens
   in, and the reason a reader finds the message before the machinery. Nothing enforces it, so
   it is worth saying out loud — particularly for a `matchFiles` rule, where it is tempting to
   write the operator call first and the message last.
2. `lib/<rule-name>/fixture/<name>.js` and `<name>-fix.js` — before and after, **one pair per
   shape the rule handles**, not one fixture holding everything. Generate the `-fix` with
   `UPDATE=1` rather than writing it by hand, because a hand-written one asserts an output the
   rule never produced — this repo has two of those. **A fixture with no `-fix` twin is a
   no-transform case**, the convention in `@putout/plugin-logical-expressions`.
3. `lib/<rule-name>/index.spec.js` — beside the rule it tests.
   `createTest(import.meta.url, {plugins: [['rule-name', plugin]]})`, then `t.transform(name)`
   for every shape the rule fixes, `t.noTransform(name)` for the ones it must leave alone, and
   `t.report(name, 'the message')` with the message inline. If a rule fixes, a `reportCode` spec
   proves nothing about the fix.
4. Register it in `lib/index.js` and add its `README.md` section. A rule can be disabled in
   place as `['off', plugin]`, so anything reading `rules[name]` must unwrap that.
5. `bun run coverage` at 100%, and `putout .` clean.

**No comments.** The rule's name and its README section are the documentation. The one
exception that cannot be honoured is `remove-comments`, whose subject *is* comments.

It is already wired in, through `plugins` in the root `.putout.json` by **bare name**
(`"putout-editor"`), so there is nothing to enable. putout merges config up the tree, which
is why the rules reach `packages/client` despite its own `.putout.json`.

### A rule can break without a single test noticing

`putout . --fix` in CI removed the inner `for` from `remove-comments` — correctly, the loop
variable was unused — which left it pushing once per comment *key* rather than per comment. It
then reported 6 places on a file with comments and **6 on a file with none**. Every test passed,
because every test ran code that had comments.

So a rule that reports needs a **negative** case: a fixture with nothing to find and a
`t.noReport`. Without one, "reports too much" and "reports nothing" are the same green.

### Two kinds of rule, and the difference is not a detail

A **code** rule sees one file. `apply-press-modifier-case` is one, and `putout .` runs it.

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

## When a rule is really two rules

Sometimes a rule is two things wearing one coat. A `matchFiles` rule is the clear case: it
decides *which files to look at*, and the plugin you hand it decides *what is wrong with this
one*. Those are different jobs, they change for different reasons, and only the first one
is about the tree.

Keeping them in a single `index.js` is fine until you want to test the second half. Then you
find yourself building a fake filesystem by hand in a spec, just to reach the matcher — which
is the sign it wants to be its own rule, with its own fixtures and its own tests, and none of
the tree around them.

So a multi-level rule is a directory inside a rule:

```
lib/
└── check-main-imports-only/          the rule: which files, and what to say
    ├── index.js
    ├── index.spec.js
    ├── fixture/                      a filesystem: the rule as a whole
    └── check-imports-only/           the inner rule: this one file
        ├── index.js
        ├── index.spec.js
        └── fixture/                  one file, no filesystem around it
```

The outer `fixture/` holds a `__putout_processor_filesystem([...])` source, because that is
what the outer rule consumes. The inner `fixture/` holds a single file in its own format —
`convert-js-to-ts/fixture/convert-js-to-ts.js` is a `__putout_processor_markdown([...])`
source, because that is what the inner rule consumes. **The inner fixture is not a plain
`.js` file**: it is the wrapped source of the format the inner rule reads, so the inner spec
is an ordinary `createTest` with a `t.transform` and no filesystem in sight.

The outer one matches the files and passes the inner one along:

```js
import {operator} from 'putout';

const {matchFiles} = operator;

export const {scan, fix} = matchFiles({
    files: {
        'main.css': {
            plugins: [
                ['check-main-imports-only', {
                    report: () => `main.css is an entry point: @import only`,
                    match: () => ({
                        rule: () => true,
                    }),
                    replace: () => ({
                        rule: (vars, path) => path,
                    }),
                }],
            ],
        },
    },
});
```

Four things worth knowing, all of them learned the hard way:

**The inner spec registers the outer name and tests the inner one.** This is the bit that
looks wrong and is not. `convert-js-to-ts/index.spec.js` builds its test with
`plugins: [['apply-ts-codeblock-in-file', plugin]]` — the *parent's* name — and then asserts
`t.report('convert-js-to-ts', …)` and `t.transform('convert-js-to-ts')`. The registered name
is what `createTest` reports the plugin as; the name in `t.report` is the fixture to load. Both
names appear, and a test that mixes them up passes for the wrong reason.

**A name in the outer `plugins` array is a label, not a rule.** The first element is what
putout prints. Give the inner plugin its own directory and its own name there, so a failure
names the thing that failed.

**`replace` takes `(vars, path)`, not `(path)`.** The first argument is the matched template's
values. Write the one-argument version and putout rejects it with `Looks like you passed
'replace' value with a wrong type` — and the fix is in the signature, not the return value.

**The inner rule takes options when the outer one has something to say.**
`apply-namespace-import` builds its pattern from `{name, source}`, which is what lets
`apply-namespace-to-imported-file` reuse it per file. `t.transformWithOptions` and
`t.reportWithOptions` are the tests for that. Its fixtures are named after the *inner* rule —
`apply-namespace-import.js` and `apply-namespace-import-fix.js` — while
`convert-js-to-ts` names its own the same way. Only the *registered* name in the inner spec
belongs to the parent, which is the point above.

Read `apply-namespace-to-imported-file` in the 🐊**Putout** repo when you want the full shape —
it is the reference one, and its `apply-namespace-import/` subdirectory has the four files
above. `apply-ts-codeblock-in-file` with its `convert-js-to-ts/` is the same idea for
markdown. Neither is exported in the plugin's `rules` map, and neither needs to be: the outer
rule reaches them directly.

**Do not do it too early.** A rule that fits in one file should stay in one file. The move
earns itself the moment the inner half wants a test of its own, and not before — a directory
with one `index.js` in it is a shape to grow into, not a starting point.

### The tell

If your spec builds a filesystem by hand to test the matcher, split the rule. If it opens a
fixture and runs the matcher directly, leave it alone.

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
