# Writing a putout rule here

**What the rules in `packages/plugin-putout-editor` taught me**, kept because it is reusable and
not because a problem is open. The open ones are in
[`../issues/putout-plugins.md`](../issues/putout-plugins.md).

For how to write one, [`../plugins.md`](../plugins.md) is the guide — including the
`matchFiles`-or-`scan` decision and what report-only costs, both of which used to be here. For
the house style and the pattern grammar, [`../putout-style.md`](../putout-style.md). What is
left here is the part not derivable from those two: the traps that cost a round trip each and
are not guessable from the types.

## How to visit every node

Four attempts, all measured, and the last two are the ones that work. The whole of this section
exists because every one of the obvious answers is wrong, and two of them fail **silently** —
a rule that reports nothing looks exactly like a rule with nothing to report.

| As `traverse` key | Result |
|---|---|
| `VariableDeclaration` | works, but only that one type |
| `enter` / `exit` | **fires 0 times** — dropped by the runner |
| `$` | **matches nothing** |
| `*` | `SyntaxError`, parsed as a template placeholder |
| `__` | resolves to `Identifier` — a type name, not a catch-all |

**`enter` and `exit` are discarded on purpose.** `@putout/babel` exports `shouldIgnoreKey`,
which returns true for `enter`, `exit`, `shouldSkip`, `denylist`, `noScope`, `skipKeys` and any
`_`-prefixed key, and `merge2` skips those keys while building the visitor. They are honoured
only *inside* a per-node-type visitor — `{VariableDeclaration: {enter}}` — never at the top
level of a rule's `traverse`. Measured: `enter: 0, exit: 0`, while a typed key on the same rule
fired once on the same source.

This is why a rule and a library can use the same syntax and get different answers:
`estree-to-babel` calls `traverse()` from `@putout/babel` directly, and the rule runner calls
`traverse.visitors.merge()` on the visitor object first. Same library, two entry points, and
the merge is what strips `enter`.

**Two forms that do work.** The includer, which is the shorter one:

```js
export const include = () => [
    'Statement',
    'Expression',
    'ObjectProperty',
];

export const filter = ({node}) => {
    const {
        leadingComments,
        trailingComments,
        innerComments,
    } = node;
    
    if (hasLength(leadingComments))
        return true;
    
    if (hasLength(trailingComments))
        return true;
    
    return hasLength(innerComments);
};
```

Those are **babel alias** names, and they are the point: an alias covers every type beneath it,
so the list is short and does not go stale when putout adds a node type. `['Statement']` alone
reports every comment position except an `ObjectProperty`, which is why that third entry is
there. `'Node'` is **not** valid — babel rejects it with *You gave us a visitor for the node
type Node*.

Or the raw traverse, when you need every node and not a category:

```js
import {traverse as babelTraverse} from 'putout';

export const traverse = ({push}) => ({
    Program(path) {
        babelTraverse(path.node, {
            noScope: true,
            enter(node) {
                // ...
            },
        });
    },
});
```

`Program` is a valid visitor key and is not ignored, and the imported `traverse` is the same
function `estree-to-babel` uses — before the merge, so `enter` works. Alias the import: the
rule exports its own `traverse`, and the unaliased name is
`SyntaxError: Identifier 'traverse' has already been declared`.

## A css value with no node of its own is a string, and that hides a missing node

`happy-style` lowers CSS to JS call expressions, so `declaration('grid-template-columns',
...)` reaches its value through `arguments[1]` — and a value is **either a node or a bare
string**, depending on whether `happy-style` has a convertor for its css-tree type:

| css-tree | node |
|---|---|
| `Identifier` | a bare `StringLiteral` — `color: red` is `'red'` |
| `Dimension` / `Percentage` / `Hash` / `String` | `dimension`, `percentage`, `color`, `string` |
| `Function` | `functionValue('<name>', [...])` |
| `Brackets` / `Parentheses` | `brackets([...])` / `parentheses([...])` |
| `UnicodeRange` | `unicodeRange('U+0-7F')` |
| anything else | `createStringLiteral(csstree.generate(node))` — **opaque** |

**The cost of the last row is invisible, and that is the point.** A value with no node of its
own still parses, still prints, and round-trips byte for byte, so every test is green and
every fixture looks right. What is lost is that a rule cannot reach inside it. `Brackets`,
`Parentheses` and `UnicodeRange` were exactly that until `happy-style` 1.0.6, so
`grid-template-columns: [full-start] …` was one string and renaming a grid line name was not
expressible. Three node types, zero failing tests, one missing capability.

**The lesson generalises past CSS.** "It round-trips" is not evidence that the AST is
*usable*. Ask what a rule can now match that it could not before, because the answer is
sometimes "nothing".

Two related facts, measured rather than assumed: there is **no `Ratio` node** — css-tree
parses both `16 / 9` and `16/9` as `Number, Operator, Number` — and a comma is an
`Operator`, not a `Comma`. Neither is missing; neither was ever a node.

`docs/plugins.md` has the same table where a rule author will actually find it.

## A parser spec does not run the printer, so a printer change can ship at 0%

Adding `brackets`, `parentheses` and `unicodeRange` needed **two** fixture sets: one in
`lib/parser/visitors/value/fixture/` for the convertors and one in `lib/printer/fixture/`
for the blocks. The parser fixtures alone left the three new printer blocks at **0%**,
because `t.transform` in a parser spec never invokes the printer.

That is a coverage gate doing its job — the implementation was correct and three files were
being executed by nothing. It is also invisible until the gate runs, so a rule that parses
but cannot print is a shape worth remembering: **parser and printer are separate suites, and
a change to one needs a fixture in the other's directory.**

## An includer's `fix` gets a path, not an object

**This one costs nothing to get wrong and everything to debug**, because it fails silently.
The rule reported all 8 comments and removed none, with no error and exit 0.

A `traverse` rule pushes `{path, key}`, so its `fix` destructures `{path, key}`. An includer
is built by `prePush` in `@putout/engine-runner/lib/includer/index.js`, which calls
`push(path)` — a **bare path** — so `runFix` hands `fix` that path:

```js
export const fix = (path) => { // not ({path, key})
    path.node[key] = [];
};
```

The tell is the shape of what arrives: a `NodePath` has `node`, `parentPath`, `scope`,
`container` and `opts` on it. If `fix` is reading `key` off its first argument and it is
`undefined` every time, this is why.

## Bound values arrive in the `match` visitor, not in `report`

A replacer's `match` callback gets the bound template values as its **first** argument, and
they are real nodes:

```js
export const match = () => ({
    'const __a = __b': (vars, path) => {
        // vars.__a is an Identifier, vars.__b a NumericLiteral
        return true;
    },
});
```

`report` gets the path and `{options}` — the bindings are **not** there, so a rule reading
them from `report` gets `undefined` and still reports. And the node handed to the visitor is
the **outer** node, not the matched subtree. That is what made me generalise "a placeholder
only matches an identifier" from a probe that was reading the wrong node: the true claim is
narrower — a *bare* `__a` matches an identifier.

`@putout/compare` is the engine underneath, and `getTemplateValues(node, template)` is its
entry point when you want the bindings without a visitor.

## `include` takes type names, not template values

`include` builds its visitor from **node type names**, so it takes `'Statement'` and
`'ObjectProperty'` — not `'__a'`. In an `include` list, `__` and `__a` are the same key and
both resolve to `Identifier`, so `['__', 'Statement']` behaves exactly like
`['VariableDeclaration', 'ExpressionStatement']` plus `'Statement'`. An `Identifier` never
carries a comment, so the template value reaches nodes with nothing to find and cannot stand
in for the aliases.

The asymmetry is worth remembering because it is the same syntax doing two jobs. In
`match`/`replace`, `'__'` is "any node" — see
[`../putout-style.md`](../putout-style.md#pattern-strings). In `include`, a key is a **type
name** and `__` is just a name for one. `include: () => '__a'` (a string, not an array) is
rejected with *does not return an 'array'*, and `['_']` and `['__a__']` match nothing.

## 🦎Putout types the plugin contract, so a rule can be type-checked

A rule can be TypeScript-checked today, with no cast and no shim. `putout` re-exports the whole
contract from its entry point, and `@putout/types/lib/plugin.d.ts` types every shape a rule can
take — `Replacer`, `Includer`, `Traverser`, `Scan`, `Declarator`. So `import type {Fix}` from
`'putout'` is all a `.ts` rule needs.

**These type exactly the mistakes that cost the most here.**

| Type | Signature | What it catches |
|---|---|---|
| `Fix` | `(path: NodePath, options: PluginOptions) => void` | an includer reading `{path, key}` — a silent no-op |
| `Match` | `() => Record<string, (vars, path) => boolean>` | the bound `__a` values arrive in `vars`, not in `report` |
| `Traverse` | `(api) => Record<string, (path) => void>` | `push({path, message})`, which makes `path` undefined in `fix` |
| `Report` | `() => string` | a rule reaching for a second parameter that is not in the contract |

`Traverse`'s api is typed too: `push`, `store`, `listStore` and `pathStore`. And `PutoutPlugin` is
a union of the four shapes, so `const rule: PutoutPlugin = {...}` checks a whole rule at once.

The AST side is typed as well — `types` is `@babel/types` re-exported, and `ParseOptions` comes
from `@putout/engine-parser`. `packages/mcp` already leans on that, and it is the package that
pays: 30 type errors were caught there before CI saw them, none of which a `.js` file reports.

So the earlier reason not to convert this package — that the contract was untyped — was wrong.
What remains true is only that the directory shape is not negotiable: the shape must match
`@putout/plugin-tape` and the 116 upstream plugins, which are `.js`.

## To change a node, replace it — writing to it is not enough

A `StringLiteral` caches its source text in `extra.raw`. Writing `node.key.value = 'x'` changes
the AST and leaves **what the printer emits completely unchanged**, so a fixer runs, reports, and
returns the file byte for byte. No error, no diff, exit 0.

Build a new node and assign it:

```js
import {types} from 'putout';

node.key = types.stringLiteral(next);
```

I hit this writing `apply-linked-pattern-value` — the rule reported and the file came back
identical, which is the same shape of failure as the bug the rule is about, one layer down. Worth
knowing before any fixer here mutates a literal in place. `apply-type-check` gets away with
rewriting `x.type` because a node *type* is not the cached text.

## How `UPDATE=1` actually works, and what it does to a `-fix` twin

Read in `@putout/test/lib/fixture.js` and `lib/test.js`. The mechanism, which is worth having:

`isUpdate()` is `Boolean(Number(process.env.UPDATE))` — so `UPDATE=1` and `UPDATE=true` both count,
and **`UPDATE=0` does not**. It guards exactly three things:

- **`rmFixture`** is called by `noTransform`, `noTransformWithOptions` and `noReportWithOptions`,
  **before** the lint runs. It unlinks `${name}-fix.js` and `${name}-fix.ts`, wrapped in `tryCatch`,
  and only when `isUpdate()`. So the `-fix` twin of a fixture under test is deleted and then
  rewritten from the run. A stale twin cannot survive to fail a later run by being compared against
  something the rule no longer produces.
- **`writeFixture`** then writes the *source* fixture back with the fixed `code` for those same
  operators, and the test reports `source fixture updated` instead of comparing. So
  `UPDATE=1 … t.noTransform(name)` **rewrites the source fixture in place** — that is the one real
  hazard, and it is not the `-fix` file. `git checkout -- test/fixture/` is the undo.
- **`writeFixFixture`** writes `${name}-fix.${ext}` and is what `t.transform` uses, so the twin for a
  *fixing* rule is generated rather than hand-written.

So the accurate version: **`UPDATE=1` regenerates the fixtures the operators you run touch, and
`noTransform` rewrites the source.** It is scoped to the fixtures named in the tests you run, which
is why running the whole suite is safe and running one rule's spec regenerates only that rule's
pair.

`readFixture` also drives the extension: with no `extension` option it tries `<name>.<ext>`, then
`<name>.ts`, then `<name>.js`, so a pair can be `.ts` or `.js` and the test follows it.

The reason to use it rather than writing a twin by hand is unchanged — it writes what the rule
actually produces, and a hand-written twin asserts an output the rule never made, which is what two
of the fixtures in this package were:

```js
const {code} = putout(source, {fixCount: 1, plugins: [['remove-comments', rule]]});
```

## `estree-to-babel`, and why every parser funnels through one call

acorn, babel, espree and esprima are all supported, and `parseCode` in
`src/store/operations.ts` runs `estreeToBabel` over the result of every one of them. That is
not tidiness. **ESTree** is the standardised AST the acorn family emits, **Babel** has its own
dialect, and every putout rule is written against Babel's — so without the adapter a rule would
only work on the babel parser.

It works in two steps. `get-ast` wraps a bare ESTree `Program` in a `File` node, and returns a
`File` untouched, which is what makes running babel through it safe. Then one `traverse` with
an `enter`/`exit` pair rewrites the differences: `Property` to `ObjectProperty`,
`MethodDefinition` to `ClassMethod`, `ChainExpression` to `Optional*`, `Literal` to
`StringLiteral`/`NumericLiteral`, `raw` hoisted out of `extra`, directives moved out of `body`.
`exit` handles what needs the subtree finished first — comments, and shorthand object methods.

**The `as` cast on that call is a boundary, not a papering-over.**
`ParserWithLoader.parse` is typed `(…) => unknown` because it wraps four parsers with four
return types, while `estreeToBabel` wants `types.Node`. `unknown` to `types.Node` has to be
asserted somewhere, and the call site is the only place that knows the parsers really do return
nodes. The alternative is a runtime guard on every parse, in a file that already carries a
comment about `extend()` not being free.

**It is also why `apply-type-check` is a finding.** That rule rewrites
`node.type === 'Program'` into `isProgram(node)`, and it did not compile in
`defaultESTreeParserInterface.ts`, because that file's `AstNode` is the Editor's own interface
and not a Babel `Node`. A putout rule cannot see that two types named `Node` come from
different worlds — see [`../issues/putout-plugins.md`](../issues/putout-plugins.md).

## A `scan` can still delegate to a Matcher

A cross-file rule does not have to do its own matching. The outer `scan` finds the files and
works out what the inner rule needs, then hands it over as `options` — the same channel
`apply-namespace-import` uses for `{name, source}`. `remove-undefined-token-file` does this: the
scan reads `tokens.css` into a list, converts each stylesheet with `@putout/processor-css`, and
runs `check-token` with `{known}`.

Four things about that inner Matcher, each of which cost a round trip and none of which is
guessable from the types:

- **a CSS value is not a call.** `functionValue('var', ['--x'])` carries an `ArrayExpression` of
  `StringLiteral`s as its second argument, so `__a.arguments` is `undefined` and the name has to
  be read off the path. The matcher throws on the first file otherwise.
- **`report` receives the matched path**, so the Matcher can name what it found and the outer
  only joins the names. A fixed string there produces an empty message, and nothing says the
  message is the part that is missing.
- **`findPlaces` places carry `position` as `{line, column}`** — there is no node on it to read
  the value back from, which is the other reason the name has to come from `report` rather than
  from the place.
- **de-duplication state belongs in `options`**, as a `seen` list the matcher closes over. It is
  per file, so two files each using an undefined token is two reports, and one file using a token
  twice is one.

## `tryCatch` returns a **shorter** array when it catches

`try-catch` is `return [e]` on a throw, not `[e, undefined]` — the result element is *absent*, not
empty. So the mechanical rewrite of

```js
try {
    return Object.keys(JSON.parse(content).scripts || {});
} catch {
    return [];
}
```

into the obvious destructuring form throws on exactly the input the rewrite was written to survive:

```js
import {tryCatch} from 'try-catch';

const broken = (content) => {
    const [error, {scripts = {}} = {}] = tryCatch(JSON.parse, content);
    
    if (error)
        return [];
    
    return Object.keys(scripts);
};
```

`JSON.parse('null')` returns `null`, and the **default only fires for `undefined`** — so `null` blows
up the destructure, outside the `try` that was supposed to be catching it. Same for
`'{"scripts":null}'`, one level in. Both are real `package.json` contents, not exotic ones.

Bind first, then guard, and keep the `|| {}` on the value you actually index:

```js
import {tryCatch} from 'try-catch';

const knownScripts = (content) => {
    const [error, parsed] = tryCatch(JSON.parse, content);
    const {scripts = {}} = parsed || {};
    
    if (error)
        return [];
    
    return Object.keys(scripts || {});
};
```

The test that catches it is the obvious one — a fixture holding `null` — and the reason it is worth
writing is that the whole suite was **green with the broken version**: `'{not json'` throws, so the
`error` branch returns early and the bad destructure is never reached. Coverage said 100% and the
rule would have thrown at a real `package.json`.


## A `*-file` rule is a filesystem rule, and it is `off` by default

In the 🐊**Putout** repo the `-file`/`-files` suffix marks a rule that walks the tree rather
than one file. Measured: 14 of the 21 rules that `export const scan` end in `-file`, and the
ones that do not are helpers or whole-directory tools (`bundle`, `create-app-directory`).
`plugin-esm` is the clean example — `apply-namespace-to-imported-file`, `resolve-imported-file`,
`shorten-imported-file` and the rest are all `['off', plugin]` in its `rules` map.

The three parts that have to agree, and none of them is optional:

1. **the name** ends in `-file`, so a reader knows before opening the file that this is a
   filesystem rule;
2. **the rules map** has `['off', plugin]`, so `putout .` never runs it over code;
3. **a `.filesystem.json` match** in the config turns it back on for the one file `redlint`
   reads. In the 🐊**Putout** repo that is `packages/putout/putout.json`:

```ts
const config = {
    match: {
        '.filesystem.json': {
            'esm/apply-namespace-to-imported-file': 'on',
            'esm/resolve-imported-file': 'on',
            'esm/shorten-imported-file': 'on',
        },
    },
};
```

Without step 3 the rule is dead: `off` in the map and no `match` that turns it on means it
never runs anywhere. That is the failure to check for after a rename, because nothing errors —
the suite is green and the rule does nothing.

****`test/` is `plugin-esm`'s and `plugin-nodejs`'s shape, not an invention.** `test/nodejs.js`
is one `createTest` over the whole plugin with one test per rule, and a `*-file` rule also gets
its own file because the default is `off` and only `rules` turns it on.

A filesystem rule is tested the plugin-esm way**, one file per rule in `test/`, with
`createTest` and the rule explicitly turned on, because the default is now `off`:

```js
const test = createTest(import.meta.url, {
    rules: {
        'putout-editor/remove-rgb-outside-token-file': 'on',
    },
    plugins: [
        ['putout-editor', putoutEditor],
    ],
});

test('plugin-putout-editor: remove-rgb-outside-token-file: report', (t) => {
    t.report('remove-rgb-outside-token-file', '☝️ /css/main.css: colours belong in tokens.css');
    t.end();
});
```

The fixtures are `__putout_processor_filesystem([...])` sources in `test/fixture/`, one per
rule, and `t.report` needs the **full message including the `☝️` prefix and the filename** —
it is compared as a string, and a missing one fails with "Looks like you forget to pass the
'message'".

**The `*.md` config test was measuring the wrong thing.** There was a spec asserting every
rule with a fence is named in the `*.md` match, which pushed towards per-rule `off` lines that
duplicate the map. The map is the single source of truth for on/off; the config only has to
turn the plugin off for markdown, and the spec is now about the map instead — a `*-file` rule
is off, a code rule is on, and both are checked there.



`operator-match-files/lib/match-files.js` reads the matched file with a fallback:

```js
const fileContent = readFileContent(inputFile) || '{}';
```

An **empty** stylesheet therefore does not arrive as `''` or as an empty CSS document. It
arrives as the two characters `{}`, which the CSS processor turns into a node:

```
''  => [];\n
'{}' => [\n    raw(`{}`),\n];\n
```

`raw('{}')` is a `CallExpression`, so an includer that includes every call sees it and reports
on a file that is empty and therefore trivially correct. Measured, not guessed:

```
check-imports-only   => places: 1   (.a { color: red; })
is-imports-only      => places: 0
at-rule              => places: 1
empty                => places: 1   <- the fallback, not a real violation
```

`check-imports-only/index.js` filters `raw` out for that reason, and has it named in a
constant with `__putout_processor_css` so the reason is visible. The `empty` fixture is what
pins it: without it the fallback is invisible and the rule reports a violation on a file that
has none, which is the "reports too much" and "reports nothing" being the same green again.

The general shape is worth remembering: **a `matchFiles` rule cannot tell an empty file from
a file containing the text `{}`.** Anything that reports on structure has to decide what an
empty input means, and that decision wants a fixture.

## Report-only is possible, at the cost of one no-op action

[In `docs/plugins.md`](../plugins.md#report-only-is-allowed-and-it-costs-one-no-op-action) now,
where the guide is. The short version: `check-match` in `@putout/plugin-putout` is a replacer
whose `replace` maps the pattern **to itself**, and the two filesystem rules here do the same
and assert the file comes back byte for byte — choosing which token a colour becomes is a
human decision.

## A putout rule can see comments

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

## A filesystem rule tested on `parseFilesystem` has never met the runner

`parseFilesystem(['/', ['/package.json', ...], ['/AGENTS.md', ...]])` is the fixture every
filesystem rule in this package is tested with, and it is **not** the tree `redlint` produces. The
one difference that matters is the shape of a filename:

- **`getFilename` is absolute under `redlint`.** `buildTree` walks from `cwd`, so a document is
  `/home/you/repo/AGENTS.md`, not `/AGENTS.md`. A rule that strips a leading slash and compares the
  rest against a list of bare names gets `home/you/repo/AGENTS.md`, so every `includes` is false and
  the loop body never runs. `basename(getFilename(file))` is the fix.

`check-documented-scripts` did that, reported zero places on the real repository, and passed 194
tests at 100% coverage. The regression test that pins it is named for the shape rather than the
behaviour — `an absolute path, as redlint builds it` — and is built by hand as an absolute tree
rather than through `parseFilesystem`.

**A mask is not a path, so `tokens.css` still finds an absolute `tokens.css`.** Worth stating
because the obvious guess is the opposite one. `findFile` tests `value === name` *or*
`getRegExp(name).test(basename(value))`, so a wildcard mask matches any directory and an exact
mask matches on the basename. `remove-undefined-token-file` asks for `tokens.css` and `*.css` and
works on the real tree — verified by planting `var(--color-planted-not-a-token)` in `codemirror.css`
and reading it back out of `redlint scan`. So the defect was never the mask; it was the
`isDoc`/`isPackage` comparison the rule did on the name afterwards. **A `crawlFile` mask matching
is not the thing to check — what the rule does with the returned path is.**

So a filesystem rule needs a fixture whose shape comes from the runner, not from the helper the
other fixtures happen to use. `buildTree(process.cwd())` is the other source; before writing one by
hand, check which of the two shapes it is.

## A pattern key is a whole name, and `{a,b}` is not a `match` alternative

Both cost a round trip on `hoist-arrow-callback`, and neither is guessable from the grammar docs.

**A `__` prefix belongs to a whole name.** `__error` and `__value` are not bindings — only `__a`
through `__z` are, so a key written `const [__error, {__value}] = …` matches **zero** places and
looks like a pattern problem. The same key with single letters matches.

**`{a,b}` unions work in `include` and not in a `match` key.** `__:filter((__a) => __b)` is fine as
an include pattern, but the same union inside a `match` key is parsed as a babel visitor and throws
`You gave us a visitor for the node type undefined`. So a rule over many methods builds the table
instead:

```js
export const match = () => Object.fromEntries(METHODS.map((method) => [
    `__.${method}((__a) => __b)`,
    isHoistable,
]));
```

**In a `match` visitor, `__a` is a node, not an array** — `__a.name`, not `__a[0]` — and
**`path.node.arguments` holds the callback at index 0**, because the pattern is anchored on the call
with the callback already bound, so `arguments.slice(1)` is empty. `print(__b)` also ends in `;`,
and `template.ast` returns an **array** of nodes rather than one.

So `validate` says `ok`, `test_pattern` says the key matches, and the rule still reports nothing:
every one of these fails silently rather than throwing. **Check `transform` on a fixture, and
check the count is what you expect — a rule that matches zero places and a rule that cannot run
look identical from the outside.**

## There are two `TreeAdapter` types, and the tree seam is wider than it looks

Assessed for a flat-list AST renderer; it is not the cheap adapter it looked like.

**Two declarations, one name.** `editor-ast-tree/tree/types.ts` has a `TreeAdapter` **type** — the
four-method interface the components take. `parser/TreeAdapter.ts` has a `TreeAdapter` **class** —
a configurable base with filters, `openByDefault`, and a `WeakMap` of ranges. `TreeAdapterChild` is
declared in both, and they disagree: `computed` is **required** in the tree's copy and **optional** in
the parser's. `Tree.tsx` bridges them with `computed: child.computed || false`, which is a
normalisation that exists only because the two types are not the same.

So the seam the plan would extend is not one interface. Bridging is `treeAdapterFromParseResult`,
then a `useMemo` in `Tree.tsx` that re-wraps it into the type the components want. A flat-list
renderer is a *second* implementation of that type, not a new implementation of an existing one — and
it inherits the bridge, not the adapter.

**What it means for a flat renderer.** The three hooks are adapter-agnostic and carry over;
`Element.tsx` and `RecursiveTreeElement.tsx` hold the recursion, so a flat list does not use them. So
the work is a flattener, a flat renderer, and the three hooks — not an adapter. Reusing `Element.tsx`
with a synthetic single-child adapter is the cheap version, and it is a hack that shows in the DOM.

**The reusable part.** When a name means a class in one file and a type in another, the fix is one
name: `TreeAdapterConfig` / `TreeAdapterOptions` / `TreeAdapterChild` already read as one family, and
`TreeAdapter` is the collision a reader hits first.

## A replacer needs a `replace`, and a matcher cannot have one

`tester.ts` builds a `finder` plugin to answer "does this pattern match", and it carries a `replace`
whose callback never runs — the tool only ever passes that plugin to `putoutAsync` with
`fix: false`, and a replacement callback is reached only under `fix: true`. Measured:

```
fix: false  -> places=1 replaceCallbackCalls=0
fixCount: 1 -> code="X;"    replaceCallbackCalls=1
```

That callback was 92.3% of the file, which is what held the package gate at 98%. Deleting it is not
an option either: with `match` and `replace` gone the loader refuses the plugin —
`Cannot determine type of plugin 'rule'` — and six tests break. **A replacer must carry a `replace`
even when it never fixes anything.**

An identity replacement, `{[key]: key}`, satisfies both: the key is there for the loader, there is no
function left uncovered, and it says the plugin is a matcher rather than shipping a callback that
prints a binding and could only run in a path nothing reaches.

**The general shape.** A plugin that only reports is cheaper to keep honest as
`replace: () => ({key})` than as a `fix` that is a no-op: the loader needs one of the replacer keys,
`fix` alone is not enough, and an identity replacement has no branch to cover.

## A new rule's first real test is the rest of the repository, and `.ts` hides half of it

`hoist-arrow-callback` ships from `plugin-putout-editor`, wired in by the root `.putout.json`, so it
is live in every workspace at once — `AGENTS.md` says so. The sweep found **69** sites, and two
things about that number are the lesson:

**A guard I wrote to dodge the fixer also hid real code.** `isHoistable` required an `Identifier`
parameter, because hoisting `({position}) => position` produces a name the parameter does not give.
That is a *fixer* problem, and applying it to the *reporter* meant `places.map(({position}) => position)`
never reported — a shape where a name pays most. Widening it took the count from 9 to 69, which is
the signal: a guard that is about naming, sitting in a rule that does not name, is filtering the
wrong thing.

**`.ts` is linted, but a `putout <file>` run reports nothing for it.** `putout packages/mcp` exits 0
with zero output while `putout probe-ts.ts` reports three errors in the same file. So a scoped
`putout` run is not evidence that a TypeScript file is clean, and I nearly closed this having only
checked the ones that happened to be `.js`. Sweep with `isTS: true` and read the count.

**The fix that was right for both was scope, not suppression.** 40 of the 49 remaining sites were
in `*.spec.*` / `*.test.*` — a spec asserting `find(({type}) => ...)` is clearer inline, and hoisting
it would be noise. So the rule is off for spec and test files at the **root** config, because a
`match` in `packages/plugin-putout-editor/.putout.json` does not reach `packages/client` — the
scoping has to be where the plugin is wired in, and both directions were checked.
