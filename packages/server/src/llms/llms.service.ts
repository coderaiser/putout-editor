import {Injectable} from '@nestjs/common';

@Injectable()
export class LlmsService {
    llmsTxt(): string {
        return `# putout-editor

> HTTP API for parsing JavaScript ASTs and iteratively developing 🐊 Putout plugins.

## Purpose

putout-editor gives users and agents a complete workflow for writing Putout code-transform plugins:
parse source to inspect its AST, use node-type queries to find specific patterns,
write a plugin, verify what it matches with find-places, then apply it with transform.

## Endpoints

- GET  /api/v1/info                     — full API docs, workflow, error format reference
- PUT  /api/v1/parse                    — parse JS/TS source, returns full Babel AST
- PUT  /api/v1/parse?compact=true       — compact AST (no loc/tokens/comments, ~60% smaller)
- PUT  /api/v1/parse?query=NodeType     — find node positions by type, implies compact
- PUT  /api/v1/transform                — apply a Putout plugin, returns transformed code
- PUT  /api/v1/find-places              — find plugin matches without modifying code
- GET  /llms-full.txt                   — complete reference with plugin pattern examples

## Typical agent workflow

1. PUT /api/v1/parse?query=VariableDeclaration with source → get positions of target nodes
2. Write a putout plugin (replace/traverse/include) targeting those nodes
3. PUT /api/v1/find-places {fixture, plugin} → verify matches and report() messages
4. Iterate until find-places returns expected places and messages
5. PUT /api/v1/transform {fixture, plugin} → get transformed code

## Error format

All errors return JSON: {kind, message, position?}
- plugin_syntax — HTTP 400: plugin is invalid JS. Fix the plugin. Has position.line/column.
- fixture_syntax — HTTP 422: fixture is invalid JS. Fix the fixture.
- plugin_error   — HTTP 422: plugin compiled but failed at runtime. Fix plugin logic.
`;
    }
    
    llmsFullTxt(): string {
        return `# putout-editor — Full Reference

${this.llmsTxt()}
---

## Putout plugin patterns

compileRule auto-fixes most variable declarations — just produce relevant logic.
All plugins are ES modules with named exports.

### replace — pattern substitution (most common, start here)

\`\`\`js
export const report = () => 'use const instead of var';
export const replace = () => ({
    'var __x = __y': 'const __x = __y',
});
\`\`\`

Template variables (use in both keys and values):
- __x, __y, __z — any single expression or identifier
- __args         — any argument list: foo(__args)
- __object       — any object expression: {__object}
- __a, __b       — same as __x, __y (alternative names)

Variables must be consistent within one pattern pair.
__x on the left matches the same thing as __x on the right.

### traverse — AST node visitor

\`\`\`js
export const report = () => 'remove debugger statements';
export const traverse = () => ({
    debugger(path) {
        path.remove();
    },
});
\`\`\`

### include — match by pattern, fix with function

\`\`\`js
export const report = () => 'no console.log';
export const include = () => ['console.log(__args)'];
export const fix = (path) => path.remove();
\`\`\`

### filter — conditional matching in replace

\`\`\`js
export const report = () => 'use strict equality';
export const replace = () => ({
    '__a == __b': '__a === __b',
});
export const filter = (path) => path.node.right.value !== null;
\`\`\`

---

## Error recovery guide

### plugin_syntax (400) — invalid JavaScript
The plugin string is not valid JS. Common causes:
- Missing export keyword: \`const replace = ...\` → \`export const replace = ...\`
- Syntax error in template: check brackets, arrows, parentheses
- Bad: \`export const = broken\`
- Good: \`export const replace = () => ({});\`

### plugin_error (422) — "report is not a function"
Add a report export:
\`export const report = () => 'description of what the plugin fixes';\`

### plugin_error (422) — runtime crash in traverse
The visitor function threw during execution. Check:
- path.node properties exist before accessing them
- Use optional chaining: path.node.callee?.name

### Empty places from find-places
The plugin compiled and ran but matched nothing. Check:
- Template variable names — __x must be used consistently within one pattern
- Use PUT /api/v1/parse?query=NodeType to confirm the target nodes exist in the fixture
- The pattern key must match the AST structure exactly — use astexplorer to verify

### Query param usage

\`\`\`
# Find all var declarations
PUT /api/v1/parse?query=VariableDeclaration
Content-Type: application/json
{"source": "var x = 1;\\nvar y = 2;"}

# Response: [{type, start, end, loc: {start: {line, column}, end: {line, column}}}]

# Find multiple types at once
PUT /api/v1/parse?query=VariableDeclaration,FunctionDeclaration
\`\`\`

---

## Links

- Putout docs: https://github.com/coderaiser/putout/blob/master/README.md
- Plugin development: https://github.com/coderaiser/putout/blob/master/docs/plugin-development.md
- Putout script (replace patterns): https://github.com/coderaiser/putout/blob/master/docs/putout-script.md
- Compare (pattern matching): https://github.com/coderaiser/putout/tree/master/packages/compare#readme
- Engine runner (plugin types): https://github.com/coderaiser/putout/tree/master/packages/engine-runner#readme
- Babel AST explorer: https://astexplorer.net/#/gist/3a1dedd0e264db65ea46b59cf1f66d6d/latest
`;
    }
}
