export const name = 'docs';

export const description =
    'Fetch the full putout-editor reference: API docs, plugin patterns ' +
    '(replace/traverse/include), template variable syntax (__x, __args), ' +
    'and error recovery guide. Call this at the start of a rule-writing session.';

export const schema = {};

const DOCS = `# putout-editor — Full Reference

## Overview
Putout-editor is a web-based tool for writing, testing, and applying putout plugins to JavaScript/TypeScript code.

## API Endpoints

### POST /api/v1/parse
Parse source code and return Babel AST.
- Body: { source: string, query?: string }
- Query: comma-separated node types to filter

### POST /api/v1/find-places
Find all places where a plugin matches.
- Body: { fixture: string, plugin: string }
- Returns: array of matches with positions

### POST /api/v1/transform
Apply plugin and return transformed code.
- Body: { fixture: string, plugin: string }
- Returns: transformed source as text

## Plugin Patterns

### Replace
export const report = () => "use const";
export const replace = () => ({ "var __x = __y": "const __x = __y" });

### Traverse
export const report = () => "unused variable";
export const traverse = () => ({ Identifier: (node) => { ... } });

### Include
export const report = () => "include this";
export const include = () => ({ "template": "__x" });

## Template Variables
- __x, __y, __args — placeholder variables in replace patterns
- Use in both keys and values of replace objects

## Error Recovery
- plugin_syntax: Plugin has JavaScript syntax errors
- plugin_error: Plugin throws at runtime
- 400 Bad Request: Invalid input
- 500 Internal Server Error: Server-side failure
`;

export const handler = () => ({
    content: [{
        type: 'text' as const,
        text: DOCS,
    }],
});
