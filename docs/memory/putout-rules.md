# Writing a putout rule here

**What the rules in `packages/plugin-putout-editor` taught me**, kept because it is reusable and
not because a problem is open. The open ones are in
[`../issues/putout-plugins.md`](../issues/putout-plugins.md).

For how to write one, [`../plugins.md`](../plugins.md) is the guide — including the
`matchFiles`-or-`scan` decision and what report-only costs, both of which used to be here. For
the house style and the pattern grammar, [`../putout-style.md`](../putout-style.md). What is
left here is the part not derivable from those two: the traps that cost a round trip each and
are not guessable from the types.

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
