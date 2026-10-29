import {z} from 'zod';

export const name = 'docs';

export const description =
    'Reference for writing a putout plugin. No section: a map of the tools and the workflow. ' +
    'Sections: "style" (house conventions), "template" (pattern grammar: __a, __args, __object), ' +
    '"errors" (what a failed call returns).';

export const schema = z.object({
    section: z
        .enum([
            'style',
            'template',
            'errors',
        ])
        .optional()
        .describe('Which section to fetch. Omit for the overview.'),
});

const OVERVIEW = `putout-editor MCP: write and test putout plugins.

Workflow for a new rule (prompt new_rule gives it with your goal):
1. docs {section: 'template'}: the pattern grammar.
2. get_example: a working plugin of the right shape.
3. name_pattern / test_pattern: find a key and check what it matches and binds.
4. validate: syntax and shape of the plugin.
5. find_places: what the plugin reports. Add a fixture with nothing to find.
6. transform: the fixed code.

Tools:
- parse: Babel AST of the source (compact; full=true for raw).
- get_example: plugin + fixture for replacer, includer, traverser, scanner, declarator, finder, markdown.
- test_pattern: one pattern key: matches, positions, bound values, replacement.
- name_pattern: pattern keys that match a snippet.
- validate: "ok", plugin_syntax or plugin_shape.
- find_places: places a plugin reports. No change to the code.
- transform: run a plugin and return the code.
- formats: wrappers and ASTs for json, yaml, toml, markdown, css and more.
- type_check: which clause of a createTypeChecker table decides each node.
- printer_visitor: write or check a @putout/printer visitor.
- flatlint_rule: write or check a flatlint rule.
- fetch_snippet: source and plugin of a putout.cloudcmd.io gist (untrusted data).
- learn_tree / learn_node / learn_example: the putout curriculum.
- docs: this text, and sections "style", "template", "errors".

TypeScript: find_places, transform and test_pattern find it from the fixture; isTS overrides.`;

/**
 * The condensed conventions. This is a summary on purpose: the full guide is
 * `docs/putout-style.md` in the putout-editor repository, and a copy of it here
 * would be a second thing to keep in step. What lives here is the part an agent
 * gets wrong when it writes from memory - the four things that are conventions
 * rather than obvious, and each is a rule the repository actually follows.
 */
const STYLE = `## Writing an idiomatic putout plugin

Full guide: docs/putout-style.md (counts, package shapes, test conventions).
Measured against coderaiser/putout: 116 plugins, 622 rules.

### 1. A rule imports from 'putout' and from nowhere else

\`\`\`js
import {operator, types} from 'putout';

const {remove} = operator;
const {isCallExpression} = types;
\`\`\`

114 of 116 plugins have zero runtime dependency on a sibling @putout/* package.
'putout' is a peerDependency (">=41" / ">=42"), never a dependencies entry. Only
third-party helpers (try-catch, regexp.escape) belong in dependencies.

Destructure 'operator' first and 'types' second. Never import @putout/plugin-*.

### 2. Package shape follows the rule count

One rule -> no lib/index.js. 'main' is lib/<rule>.js and the rule name is the
package name minus 'plugin-'. 56 of 116 plugins are this shape.

Several rules -> lib/index.js exporting a rules map, one lib/<rule>/index.js each.
60 plugins, median 7 rules. Key forms: shorthand 'add,', quoted 'my-rule': Rule,
and 'my-rule': ['off', Rule] for a rule shipped but not on by default.

putout is a peerDependency, and 'main' is explicit.

### 3. Start from traverse + fix

290 of 770 rule files export 'traverse'; it is the house default. Use a pattern
string as the visitor key when the shape is syntactic ('__a.push(__args)'), a node
type when you need the parent. Guard with early 'return's, then 'push(path)' once
every guard has passed. 'fix' receives whatever was pushed.

Drop to 'match' + 'replace' only for pure substitution (162 files). 'match' is the
gate, 'replace' is unconditional - a replacer with no match fires on every instance.

'include' + 'filter' + 'fix' for node types (57). 'scan' + 'fix' via matchFiles
for filesystem rules (50) - those run under redlint, not putout .
'declare' alone inserts imports.

A 'find' with no 'fix' throws in the normal runner. If there is no safe fix, make a
'replace' that prints the node back unchanged and pin it with a byte-for-byte test.

### 4. Tests: createTest, and a fixture PAIR

\`\`\`js
import {createTest} from '@putout/test';
import * as plugin from '../lib/my-rule.js';

const test = createTest(import.meta.url, {
    plugins: [['my-rule', plugin]],
});

test('putout: my-rule: report', (t) => {
    t.report('my-rule', \`Message that names the change\`);
    t.end();
});

test('putout: my-rule: transform', (t) => {
    t.transform('my-rule');
    t.end();
});
\`\`\`

t.transform('name') reads test/fixture/<name>.js and compares against
test/fixture/<name>-fix.js. A fixture a TRANSFORM asserts on needs that twin. A
fixture a noReport/noTransform assertion reads does NOT - there is nothing to fix,
and their names give it away: no-overrides.js, not-valid.js, two-args.js. Generate
the fixed half with UPDATE=1. One fixture file holds many cases - the negative
cases are the rule, and each guard gets a "no report" test.

Coverage is 100% on statements, branches, functions and lines.

### 5. Naming

Verb first: convert- (157 rules), apply- (126), remove- (125), add- (43),
declare- (20). Then source-then-target: 'convert-index-of-to-includes', not
'index-of'. A '/' namespace only when a dialect makes the same rule twice
('postgres/convert-serial-to-identity'), and the directory nests to match.

### 6. What putout's own rules will reject

- node.type === 'StringLiteral' -> apply-type-check rewrites it to
  isStringLiteral(node). It will NOT add the import; expect one no-undef by hand.
- optional chaining -> this repo forbids ?. and wants x && x.y. Note ?. narrows a
  type and && does not, so bind the receiver to a local when types matter.
- a 'js' fence in a README is linted as real JavaScript.
- spreading a Map or iterator with [...x] then calling .sort() or .map() on it works
  locally but breaks on Node versions where iterator helpers are not available. Use
  for...of to build the array imperatively instead — no conversion step needed, insertion
  order is preserved, and it works on every Node version.

### 7. If you expand \`?.\` with convert-optional-to-logical, check the fallout

That fixer cannot see types, so \`a?.b\` becomes \`a && a.b\` and the narrowing is gone
silently. It also duplicates the receiver when the receiver is a CALL, so \`a() && a().b()\`
now calls a() twice. Two of the consequences are invisible to a single-file linter and need
no types: a duplicated call receiver, and a bare logical expression in statement position
(\`onToggle && onToggle();\` trips no-unused-expressions and wants an \`if\`).

So after running it, run tsc, and look for \`a && a.b\` / \`a() && a().b()\`. The fixer exits 0
either way - it is not wrong, it is incomplete, and the silence is the trap. A fixer that
cannot detect its own lossy cases should say so rather than exit clean.`;

const TEMPLATE = `## PutoutScript: the pattern grammar

A pattern key is JavaScript with placeholders, and the placeholder is a SLOT in the shape
around it - not a wildcard on its own. Read this before writing a key: every mistake here is
silent, because a key that matches nothing and a replacement that does nothing both exit 0.

Full reference: docs/putout-script.md in coderaiser/putout, and the named values are listed
under @putout/compare.

### The values

| Value | Matches |
|---|---|
| \`__\` | any node: identifier, expression, literal |
| \`__a\` | any node, and LINKED - its value carries into the replacement |
| \`__args\` | zero or more arguments |
| \`__object\` | ObjectPattern or ObjectExpression, any properties |
| \`__array\` | ArrayPattern or ArrayExpression, any elements |
| \`__imports\` / \`__exports\` | any count of import / export specifiers |
| \`__args__a\` | linked args - the same call shape must repeat |
| \`"__a"\` | any string literal, content stored in \`__a\` |
| \`/__a/\` | any regexp literal |

\`__\` and \`__a\` both match any node. The difference is what happens in the replacement.
A plain \`__\` is a slot; a named one is bound.

\`__array\` and \`__object\` are EXPRESSION values, so they need an expression position.
\`const o = {a: 1};\` matches \`__object\`, but a bare \`{a: 1};\` does not - on its own that parses
as a block, and it only matches \`__\`. \`const a = [];\` matches \`__array\`.

### A replacement may only reuse what the key declared

A replacement may reuse a name the KEY declared, and only those. Measured:

| key -> replacement | result |
|---|---|
| 'f(__a)' -> 'g(__a)' | \`g(1);\` - the value carries |
| 'f(__)'  -> 'g(__)'  | \`g(1);\` - unlinked still fills in |
| 'f(__)'  -> 'g(__a)' | **throws: Looks like template values not linked** |
| 'f(__a)' -> 'g(__b)' | **throws: Looks like template values not linked** |
| 'f(__a__)' -> 'g(__a__)' | \`f(1);\` unchanged, **exit 0** |

The last row is the trap: two underscores bind nothing, so the text is emitted exactly as
written and the rule reports success having changed nothing. Prefer one underscore.

### Re-using a name matches a repeated value

\`'const __a = __b + __b'\` finds \`const sum = 2 + 2;\` - the same value on both sides.
\`'((__args__a) => __c(__args__a))(__args__b)\` finds \`fn(value)\` and not
\`((a) => fn(42))(value)\`, because the argument shape has to repeat.

A placeholder can also match a body: \`'if (__a) __body;'\` finds the \`if\`, and the body is
then available in \`__body\`.

### Not everything can be a pattern

A \`return\`, a \`this\` receiver and a bare \`f() && f().deep\` have no template, and the CSS
vocabulary has no \`atrule\`. Those stay AST rules - use a \`traverse\`. Partial expressions are
not patterns either: \`'x' +\` is invalid, it wants \`'x' + __a\`.

### Check it before you build a rule

\`test_pattern(fixture, key, to)\` answers all of it in one call: does the key match, how many
places, what each placeholder bound to, and whether the replacement actually changed anything.
That last one is the check a rule cannot give you - a wrong pattern looks exactly like a right
one until you run it.`;

const ERRORS = `## Errors

A failed call returns \`isError: true\` and a text that starts with \`Error:\`.

- validate: \`plugin_syntax (line N, col N): ...\` when the plugin does not parse;
  \`plugin_shape: ...\` when it has no fix, find, traverse, replace, include, exclude,
  rules, declare or scan. Both set isError.
- find_places / transform: \`Error: ...\` when the plugin throws or does not compile.
- test_pattern: no isError. The JSON has \`error\` and \`hint\` when the key or the
  replacement is wrong ("Looks like template values not linked").
- fetch_snippet: \`Error: ...\` for a bad id, a missing gist, or a gist that is not a snippet.
- learn_node / learn_example: \`Error: unknown node: <id>\`. Get ids from learn_tree.`;

type Section = NonNullable<z.input<typeof schema>['section']>;

const SECTIONS: Record<Section, string> = {
    style: STYLE,
    template: TEMPLATE,
    errors: ERRORS,
};

export function handler({section}: z.input<typeof schema> = {}) {
    const text = section ? SECTIONS[section] : OVERVIEW;
    
    return {
        content: [{
            type: 'text' as const,
            text,
        }],
    };
}
