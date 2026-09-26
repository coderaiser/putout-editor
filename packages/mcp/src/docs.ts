import {z} from 'zod';

export const name = 'docs';

export const description =
    'Fetch putout-editor reference docs. Omit section for a short overview. ' +
    'Sections: "api" for HTTP endpoints, "errors" for error recovery. ' +
    'For plugin patterns and runnable examples use get_example instead.';

export const schema = z.object({
    section: z
        .enum(['api', 'errors'])
        .optional()
        .describe('Which section to fetch. Omit for a short overview.'),
});

const OVERVIEW = `putout-editor: web tool for writing and testing putout AST plugins.
Tools: parse, find_places, transform, validate, get_example.
- get_example: get a working plugin + fixture for any pattern
- validate: check plugin syntax before running
- parse: get compact AST (pass full=true for raw)
- find_places: check what a plugin matches without transforming
- transform: apply a plugin and get transformed code
Sections: "api" (HTTP endpoints), "errors" (error codes).`;

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
