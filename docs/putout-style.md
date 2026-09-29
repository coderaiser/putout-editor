# Writing 🐊**Putout** plugins in the house style

The manual to [`putout-map.md`](./putout-map.md). That file says what exists; this one says what
to write, and it is aimed at an agent that has to produce a plugin that looks like it came out of
`coderaiser/putout` rather than out of a blog post.

Every rule here is counted against the repository, not asserted. Where a convention is not
universal the count is given, and the exceptions are named.

## 0. The five decisions, in the order you make them

1. **Name** — a verb first, then the source pattern, then the target.
2. **Package shape** — one rule ⇒ no `index.js`; several ⇒ a `rules` map.
3. **Rule shape** — start from `traverse`; drop to `replace` only for pure substitution.
4. **Imports** — from `putout`, never from a neighbour.
5. **Tests** — `createTest`, a fixture pair, and a named negative case.

## 1. Name

**Verb first.** Measured across all 622 rule names:

| Verb            | Rules | Means                                        |
|-----------------|-------|----------------------------------------------|
| `convert-`      | 157   | A becomes B, and A was legal                 |
| `apply-`        | 126   | use the better construct                     |
| `remove-`       | 125   | it is noise, gone                            |
| `add-`          | 43    | it was missing                               |
| `declare-`      | 20    | name the thing so the import can be inserted |
| everything else | 151   |                                              |

Never `eqeqeq`, never `no-console`, never a bare noun. The verb is what makes `putout .` output
readable and what makes the rule list scannable.

**Then the source, then the target.** `convert-ternary-to-if`, not `ternary`. The pair `A-to-B` is
used by 157 rules and is the single most recognisable naming shape in the repo.

```
convert-index-of-to-includes
remove-useless-template-expressions
apply-arguments-order
```

**Dialect first, when there is one.** 16 rules in 2 plugins carry a `/` namespace, and both have
the same reason — the same conversion exists for two dialects, so the dialect has to be visible in
the name:

```
# plugin-sql, 13 of them
postgres/convert-serial-to-identity
convert-sqlite-to-postgres/apply-key-exists
```

Nest the directory to match. Do not invent a namespace for a plugin that has one dialect.

## 2. Package shape

**One rule ⇒ no `index.js`.** 56 of 116 plugins are single-rule, and the shape is trivial:

```
plugin-apply-arrow/
    .madrun.js
    .nycrc.json
    .npmignore
    LICENSE
    README.md
    eslint.config.js
    lib/apply-arrow.js          <- main, and the rule itself
    package.json
    test/
        apply-arrow.js
        fixture/
            apply-arrow.js      <- before
            apply-arrow-fix.js  <- after
```

`main` is `lib/<rule>.js`, and the rule name is the package name minus `plugin-`. **55 of 56**
get that exactly right.

**Several rules ⇒ a `rules` map.** 60 plugins do this, median 7 rules:

```js
// lib/index.js
import * as add from './add/index.js';
import * as sort from './sort/index.js';
import * as convertLocToLock from './convert-loc-to-lock/index.js';

export const rules = {
    add,
    sort,
    'convert-loc-to-lock': convertLocToLock,
};
```

All three key forms are in real use: a shorthand `add,` when the name needs no quoting, a quoted
key, and `['off', Rule]` when the rule is shipped but not on by default (63 rules do this).

```js
export const rules = {
    'convert-sqlite-to-postgres/apply-key-exists': ['off', applyKeyExists],
};
```

A one-rule `lib/index.js` is the shape with no advantage. If your plugin has one rule, write
`lib/<rule>.js`.

### `package.json`

```json
{
    "name": "@putout/plugin-remove-useless-push",
    "type": "module",
    "main": "lib/remove-useless-push.js",
    "tag": false,
    "changelog": false,
    "peerDependencies": {
        "putout": ">=41"
    },
    "devDependencies": {
        "@putout/test": "^15.8.2",
        "madrun": "^13.0.0"
    }
}
```

Three things matter and are easy to get wrong: `putout` is a `peerDependency` rather than a
`dependencies` entry, 114 of 116 plugins declare **no** runtime dependency on a sibling
`@putout/*` package, and `main` is explicit even when it is the default. The full list, and
what each one costs, is in [What no rule should do](#what-no-rule-should-do).

## 3. Rule shape

**Start from `traverse`.** 290 of 770 rule files export it, and it is the shape that handles
"find this node, and only when the surrounding state agrees".

```js
import {operator, types} from 'putout';

const {remove, getBinding} = operator;

const {isVariableDeclarator} = types;

export const report = () => `Avoid useless 'push()' to array `;

export const fix = (path) => {
    remove(path);
};

export const traverse = ({push}) => ({
    '__a.push(__args)': (path) => {
        const __a = path.get('callee.object').node;
        const binding = getBinding(path, __a.name);
        
        if (!binding)
            return;
        
        if (!isVariableDeclarator(binding.path.node))
            return;
        
        if (binding.referencePaths.length > 1)
            return;
        
        push(path);
    },
});
```

Read that as the house idiom:

- A **pattern string** as the visitor key when the shape is syntactic — `'__a.push(__args)'`.
- A **node type** (`ContinueStatement`) when you need the parent.
- `push(path)` only once the guards have all passed. Every `return` above is a case that must
  *not* be reported, and each of those cases belongs in a `no report` test.
- `fix` takes the pushed value. With a plain `push(path)`, `fix` is `(path)`.

**Drop to `replace` for pure substitution** — 162 files, and the whole rule in a dozen lines.
`match` is the gate, `replace` is unconditional; a replacer with no `match` fires on every
instance of the pattern, which is usually wrong.

```js
import {types, operator} from 'putout';

const {
    isTemplateLiteral,
    isStringLiteral,
} = types;

const {extract} = operator;

export const report = () => `Use 'is-' function to check type`;

export const match = () => ({
    '__a.type === __b': check,
});

export const replace = () => ({
    '__a.type === __b': ({__b}) => `is${extract(__b)}(__a)`,
});

function check({__b}) {
    if (!isStringLiteral(__b) && !isTemplateLiteral(__b))
        return false;
    
    const value = extract(__b);
    
    if (!value)
        return false;
    
    return types[`is${value}`];
}
```

### Pattern strings

**Start from a template where one fits.** `print` and `parse` are the expensive parts, so a
rule that can be a `match`/`replace` map of pattern strings should be, rather than a
hand-built AST. The model to copy is `apply-destructuring` in
`@putout/plugin-logical-expressions`, a whole rule in eleven lines.

**A placeholder is a slot inside a pattern, and `__` is the one that means "any node".** The
reference is [`putout-script.md`](https://github.com/coderaiser/putout/blob/master/docs/putout-script.md)
and the list of named values is
[`@putout/compare`](https://github.com/coderaiser/putout/tree/master/packages/compare#supported-template-variables) —
read those before guessing, because every mistake here fails silently.

| Value | Matches |
|---|---|
| `__` | **any** node: identifier, expression, literal |
| `__a` | any node, and **linked** — its value carries into the replacement |
| `__args` | zero or more arguments |
| `__object` | `ObjectPattern` or `ObjectExpression` |
| `__array` | `ArrayPattern` or `ArrayExpression` |
| `__imports` / `__exports` | any count of specifiers |
| `__args__a` | linked args — the same call shape must repeat |
| `"__a"` | any **string** literal, content stored in `__a` |
| `/__a/` | any regexp literal |

`__array` and `__object` are **expression** values, so they need a position that is an
expression. `const o = {a: 1};` matches `__object`; a bare `{a: 1};` does not, because on its
own that parses as a *block* — it only matches `__`. Same for `[]`: `const a = [];` matches
`__array`.

### A replacement may only reuse what the key declared

| key → replacement | result |
|---|---|
| `'f(__a)'` → `'g(__a)'` | `g(1);` — the value carries |
| `'f(__)'` → `'g(__)'` | `g(1);` — unlinked still fills in |
| `'f(__)'` → `'g(__a)'` | **`☝️ Looks like template values not linked`** |
| `'f(__a)'` → `'g(__b)'` | **`☝️ Looks like template values not linked`** |
| `'f(__a__)'` → `'g(__a__)'` | `f(1);` unchanged, **exit 0** |

The first two are the rule: a replacement may reuse a name the key **declared**, and only
those. Reach for a name the key did not bind and the engine refuses. The last is the trap —
`__a__` binds nothing, so the text is emitted as written and the rule reports success having
changed nothing.

Re-using one name is how you match a *repeated* value: `'const __a = __b + __b'` finds
`const sum = 2 + 2;`. And a template variable can match a body: `'if (__a) __body;'` finds the
`if`, with the body available in `__body`.

Not every shape has a pattern. A `return`, a `this` receiver and a bare `f() && f().deep` have
no template, and the CSS vocabulary has no `atrule` at all — so those stay AST rules. That is
the shape of the engine, not a failure of effort: measure the shape before rewriting.

`match` and `replace` are alternative plugin shapes, not composable parts. A rule is a replacer
*or* a traverser; a plugin carrying both is not a thing. A guard belongs in `match`, because
that is where the replacer form puts a predicate:

```js
import {operator} from 'putout';

const {getBinding} = operator;

const DECLARATION = 'const __a = __b().__c && __b__().__c.__d';

export const report = () => 'Bind the left side of && to a local: it is evaluated twice';

export const match = () => ({
    // the one thing a bare pattern cannot say: the name we are about to introduce
    // must not already be bound, or the rewrite shadows it
    [DECLARATION]: ({__c}, path) => !getBinding(path, __c.name),
});

export const replace = () => ({
    [DECLARATION]: `{
        const {__c} = __b();
        const __a = __c && __c.__d;
    }`,
});
```

**The engine caches compiled templates within a process.** Batching several patterns into one
probe script silently poisons every case after the first, so a pattern that works alone returns
0 alongside others. Re-run anything surprising **in a fresh process** before believing it.

**`include` + `filter` + `fix` for node types** — 57 files. `include` names the types, `filter`
narrows, and `filter` must return a boolean.

**`scan` + `fix` for the filesystem** — 50 files. A 🐊**Putout** rule knows nothing about
filenames; `matchFiles` is what bridges a tree, and the result is a rule that runs under
`redlint` rather than `putout .`:

```js
import {operator} from 'putout';
import * as convert from './convert/index.js';

const {matchFiles} = operator;

export const {
    report,
    fix,
    scan,
} = matchFiles({
    '__name.js -> __name.json': convert,
});
```

## 4. Imports

**A rule imports from `putout` and from nowhere else.** 114 of 116 plugins have zero runtime
`@putout/*` dependency. Counted over 709 rule files, the imports are:

| Import                          | Uses |
|---------------------------------|------|
| `operator` from `putout`        | 400  |
| `types` from `putout`           | 304  |
| `template` from `putout`        | 58   |
| `print` / `parse` from `putout` | 30   |
| `try-catch`, `node:path`        | 25   |

So the import block is `import {operator, types} from 'putout';` and then destructure, in that
order — `operator` first, `types` second — which is what the shipped rules do.

### The vocabulary you are allowed

`operator` — 61 members actually used, in rough order of frequency:

| Member                                        | Uses            | For                                               |
|-----------------------------------------------|-----------------|---------------------------------------------------|
| `remove`                                      | 123             | delete the node                                   |
| `replaceWith`                                 | 111             | swap a node for a template                        |
| `compare`                                     | 77              | structural equality                               |
| `setLiteralValue`                             | 40              | rewrite a string/number literal                   |
| `getTemplateValues`                           | 38              | the `__a` of a pattern                            |
| `rename`                                      | 21              | rename a binding and its references               |
| `getProperties`                               | 17              | read object properties                            |
| `getBinding`                                  | 16              | scope resolution — reach for this before guessing |
| `readFileContent` / `writeFileContent`        | 16 / 14         | filesystem rules                                  |
| `insertAfter` / `insertBefore`                | 15 / 12         | add a sibling node                                |
| `superTraverse`                               | 14              | traverse a whole subtree                          |
| `extract`                                     | 11              | the string out of a literal                       |
| `matchFiles`                                  | —               | the filesystem bridge                             |
| `__json` / `__yaml` / `__toml` / `__markdown` | 34 / 18 / 6 / 6 | match a config file by its parser                 |

`types` — 137 members, and the pattern is always a pair: `isX(node)` to test, `x(...)` to build.

| Member                                    | Uses    |
|-------------------------------------------|---------|
| `isIdentifier`                            | 87      |
| `isStringLiteral` / `stringLiteral`       | 41 / 32 |
| `objectProperty`                          | 40      |
| `isCallExpression` / `callExpression`     | 39 / 3  |
| `identifier`                              | 37      |
| `isObjectExpression` / `objectExpression` | 23 / 18 |
| `isBlockStatement`                        | 21      |

`is*` takes a node or a path, `*` builds one. There is no `types.isComment`, and there is no
`types.is(nodeType)` — `types.is` is *not* an "is this a known type" helper and returns `false`
for everything, which is why a rule must name the concrete predicate.

## 5. Tests

**`createTest` from `@putout/test`, without exception** — 116 of 116.

```js
import {createTest} from '@putout/test';
import * as plugin from '../lib/remove-useless-push.js';

const test = createTest(import.meta.url, {
    plugins: [
        ['remove-useless-push', plugin],
    ],
});

test('putout: remove-useless-push: report', (t) => {
    t.report('remove-useless-push', `Avoid useless 'push()' to array `);
    t.end();
});

test('putout: remove-useless-push: transform', (t) => {
    t.transform('remove-useless-push');
    t.end();
});
```

The name is `putout: <rule>: <what>`, and `<what>` is one of `report`, `transform`,
`no report: <case>`, `no transform: <case>`.

`t.transform('name')` reads `test/fixture/<name>.js` and compares against
`test/fixture/<name>-fix.js`. A fixture a **transform** asserts on needs that twin. A fixture a
**`not*`** assertion reads does not, because there is nothing to fix — 203 of them are exactly
that, and their names give it away: `no-overrides.js`, `not-valid.js`, `two-args.js`. Generate
the fixed half with `UPDATE=1`.

**One fixture file, many cases.** A single `remove-useless-push.js` fixture holds `notUsed`,
`noBinding`, `used` and `destructured` in one file, because the negative cases are the rule. Do
not write one fixture per scenario.

Generate the fixed half with `UPDATE=1` rather than writing it by hand, then read it.

The three plugins with no fixture directory use the inline form instead, which is the escape
hatch when a fixture pair would be a single line:

```js
test('remove debugger: report', (t) => {
    t.reportCode('debugger', `Avoid 'debugger' statement`);
    t.end();
});

test('remove debugger: transformCode', (t) => {
    t.transformCode('debugger', '\n');
    t.end();
});
```

**Assert the negative.** A rule with guards has a case each guard exists for, and the case is a
test:

```js
test('putout: remove-useless-push: no report: used', (t) => {
    t.notOk('used');
    t.end();
});
```

### Coverage

100% on all four metrics, `checkCoverage: true`, in every one of the 116 `.nycrc.json`. A new
rule that ships with an uncovered branch does not pass CI.

## 6. README

Five parts, same order, 116 of 116: title with the npm badge, a one-line description, `## Install`,
the `rules` JSON the user pastes into `.putout.json`, then a section per rule with an ❌/✅ code
pair. 111 of 116 use ❌ and 114 use ✅ — the five that do not have no code example to show.

```md
## remove-console

## ❌ Example of incorrect code

## ✅ Example of correct code
```

**A `js` fence in a README is linted as real JavaScript.** An anti-pattern inside one is a real
error, not documentation. Write the example so it is exemplary, or keep it inline.

## 7. Checklist

- [ ] Name: verb first, `A-to-B` for a conversion, `/dialect/` only if there is one
- [ ] One rule ⇒ `lib/<rule>.js` and `main` pointing at it; several ⇒ `lib/index.js` + `rules`
- [ ] `putout` in `peerDependencies`; no sibling plugin in `dependencies`
- [ ] `traverse` + `fix` unless it is genuinely a substitution
- [ ] Imports only from `putout`
- [ ] `createTest`, a fixture **pair**, `putout: <rule>: report` and `: transform`
- [ ] A `no report` test per guard
- [ ] README with the ❌/✅ pair, and the fences are exemplary
- [ ] 100% coverage, `UPDATE=1` used to generate the fixed fixtures
- [ ] `putout .` clean, which also means: no optional chaining, no `node.type ===` comparison

**`declare` only, for a rule that inserts imports** — one file in the repo, `plugin-declare`. It
returns a name → import-string map and nothing else.

### What no rule should do

- **No `find` without `fix`.** The loader wants one of `find`, `traverse`, `replace`, `include`,
  `exclude`, `rules`, `declare`, `scan`, and a `find` with no `fix` throws in the normal runner.
  If there is no safe fix, use a `replace` that prints the node back unchanged — `check-match` in
  `@putout/plugin-putout` does exactly that — and pin it with a test asserting the file comes
  back byte for byte.
- **No `report` that does not locate the problem.** `Use 'is-' function to check type` names the
  change; `Found a problem` does not.
- **Never `node.type === 'StringLiteral'`.** `apply-type-check` rewrites it to
  `isStringLiteral(node)`. It will not add the import — `plugin-declare` does not know the `is*`
  helpers live in `types` — so expect one `no-undef` to add by hand.
- **Never optional chaining.** `x && x.y` is the form. `?.` narrows a type and `&&` does not, so
  bind the receiver to a local — which narrows *and* stops the doubled call.
- **Never a runtime `@putout/*` dependency at all.** A plugin that bundles `putout` gets its own
  copy, and then `types.isIdentifier` is a different function from the runner's.
- **`dependencies` is for third-party helpers only** — `try-catch`, `regexp.escape`. Never for a
  sibling plugin.
- **`main` is explicit**, even though it is usually the default.
