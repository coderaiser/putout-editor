import {z} from 'zod';

export const name = 'docs';

export const description =
    'Fetch putout-editor reference docs. Omit section for a short overview. ' +
    'Sections: "style" for the house conventions of a putout plugin, ' +
    '"api" for HTTP endpoints, "errors" for error recovery. ' +
    'For runnable plugin patterns use get_example instead.';

export const schema = z.object({
    section: z
        .enum(['style', 'api', 'errors'])
        .optional()
        .describe('Which section to fetch. Omit for a short overview.'),
});

const OVERVIEW = `putout-editor: web tool for writing and testing putout AST plugins.
Tools: parse, find_places, transform, validate, get_example, fetch_snippet.
- get_example: get a working plugin + fixture for any pattern
- validate: check plugin syntax before running
- parse: get compact AST (pass full=true for raw)
- find_places: check what a plugin matches without transforming
- transform: apply a plugin and get transformed code
- fetch_snippet: get source + transform of a deployed #/gist/<id>/<rev> URL
Sections: "style" (conventions for writing an idiomatic plugin),
"api" (HTTP endpoints), "errors" (error codes).`;

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
test/fixture/<name>-fix.js. A fixture never exists without its fixed twin. Generate
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
- a 'js' fence in a README is linted as real JavaScript.`;

const API = `## API Endpoints

### POST /api/v1/parse
Parse source code and return Babel AST.
Body: { source: string, query?: string }
Query: comma-separated node types to filter

### POST /api/v1/find-places
Find all places where a plugin matches.
Body: { fixture: string, plugin: string }
Returns: array of matches with positions

### POST /api/v1/transform
Apply plugin and return transformed code.
Body: { fixture: string, plugin: string }
Returns: transformed source as text`;

const ERRORS = `## Error Recovery

- plugin_syntax (line N, col N): plugin has JavaScript syntax errors
- plugin_error: plugin throws at runtime — check fix/traverse/find logic
- 400 Bad Request: invalid input shape
- 500 Internal Server Error: server-side failure`;

type Section = NonNullable<z.input<typeof schema>['section']>;

const SECTIONS: Record<Section, string> = {
    style: STYLE,
    api: API,
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
