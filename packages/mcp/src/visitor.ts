import {z} from 'zod';
import {tryCatch} from 'try-catch';
import {parse, types} from 'putout';

export const name = 'printer_visitor';

export const description =
    'Write a @putout/printer visitor, the way happy-mark, happy-style and happy-sql do. ' +
    'A visitor is a function keyed by NODE TYPE that overrides the base printer for that ' +
    'type: (path, api) => void. Non-JS languages parse into a JS-shaped AST of call ' +
    'expressions, so path.node.callee.name IS the construct name. ' +
    'Call {action: "contract"} for the API and the two traps; pass a visitor to have it ' +
    'checked against the real printer — invented api keys, an export name that is not a ' +
    'node type, and a visitor that writes nothing are all reported.';

/**
 * The API as the printer actually builds it.
 *
 * `printer.js` does `const printer = {...mainPrinter, traverse, print}` over
 * `mainPrinter = {indent, write, debug, maybe, quote, store, traverse}`, so this
 * list is transcribed from that spread rather than from a README. `maybe` is the
 * only nested one and `indent` is an *object* with methods of its own — both are
 * things a visitor that treats them as plain functions gets quietly wrong.
 */
const API = [
    'debug',
    'indent',
    'maybe',
    'print',
    'quote',
    'store',
    'traverse',
    'write',
];

const MAYBE = [
    'breakline',
    'linebreak',
    'newline',
    'print',
    'space',
];

/** The node types the three shipped processors override. */
const KNOWN = [
    'ArrayExpression',
    'CallExpression',
    'ExpressionStatement',
    'ObjectExpression',
    'StringLiteral',
    'TemplateLiteral',
];

export const schema = z.object({
    action: z
        .enum(['contract', 'check'])
        .optional()
        .describe('"contract" returns the API and the traps. "check" (the default) validates a visitor'),
    visitor: z
        .string()
        .optional()
        .describe('The visitor source. Omit it for the contract'),
    type: z
        .string()
        .optional()
        .describe('The node type this visitor handles, e.g. "CallExpression". Compared against the export name'),
});

export type Schema = z.input<typeof schema>;

const CONTRACT = [
    'A @putout/printer visitor, in full:',
    '',
    '    export const CallExpression = (path, api) => { ... }',
    '',
    '* Keyed by NODE TYPE. The printer resolves `{...baseVisitors, ...visitors}`, so a',
    '  visitor REPLACES the base one for that type. There is no "before" hook.',
    '* `path` is a NodePath: `.node` for the payload, `.get(name)` for a child, or an',
    '  ARRAY of children — `path.get(\'arguments\')`.',
    `* api keys, all of them: ${API.join(', ')}.`,
    '* `indent` is an OBJECT, not a call: indent(), indent.inc(), indent.dec(), indent.getLevel().',
    `* \`maybe\` has: ${MAYBE.join(', ')}.`,
    '',
    'Two traps, both measured:',
    '',
    '1. An unknown node type THROWS at print time:',
    '   `Node type X is not supported yet by @putout/printer`',
    '   A parser emitting a node with no visitor is a hard error, not a silent gap.',
    '2. `write` is the ONLY way to emit. No return value, no console, and the printer',
    '   inspects nothing. A visitor that forgets one `write` just loses that token.',
    '',
    'For a non-JS language, recognising a construct and printing it are two files:',
    '',
    '    // is.js — path.node.callee.name IS the construct name',
    '    export const isTable = (path) => {',
    '        const {name} = path.node.callee;',
    '',
    '        return name === \'table\';',
    '    };',
    '',
    '    // blocks/table.js — a structural visitor',
    '    export function table(path, {write, traverse, indent}) { ... }',
    '',
    `Node types the three shipped processors override: ${KNOWN.join(', ')}.`,
].join('\n');

/**
 * Whether `source` exports `name_`.
 *
 * A top-level predicate rather than an inline `exported.filter((name_) => …)`:
 * `hoist-arrow-callback` is right about this one, and the predicate is also the
 * only place the "is this a node type we recognise" question is written.
 */
const isKnownType = (name_: string): boolean => {
    const declared = types as Record<string, unknown>;
    
    return KNOWN.includes(name_) || name_ in declared;
};

/** The inverse of `isKnownType`, so the `filter` carries no inline arrow. */
const isUnknownType = (name_: string): boolean => !isKnownType(name_);

/** The same, for the api list. */
const isUnknownApiKey = (key: string): boolean => !API.includes(key);

const exportedNames = (source: string): string[] => {
    const result: string[] = [];
    const pattern = /export\s+(?:const|function)\s+([A-Za-z_$][\w$]*)/g;
    
    for (const match of source.matchAll(pattern))
        result.push(match[1]);
    
    return result;
};

/**
 * The keys a visitor pulled off the api object.
 *
 * Matches both shapes it is written in: `const {write, indent} = api` and
 * `function rule(path, {write, indent})`. Deliberately a **syntactic** read and
 * not an AST walk — the question is "what does this visitor ask for", and
 * counting every identifier in the file would answer a different one.
 */
const apiKeys = (source: string): string[] => {
    const result: string[] = [];
    
    for (const match of source.matchAll(/\{([^}]*)\}\s*\)\s*=>/g))
        for (const part of match[1].split(','))
            if (part.trim())
                result.push(part.trim());
    
    return result;
};

/**
 * Every field is always present, including on the failure path.
 *
 * An early `return {ok: false, problem}` would make every caller narrow before
 * it could read `unknownApi`, which is a union to re-narrow in three places and
 * a silent `undefined` in a fourth. The failed run reports the same shape with
 * everything empty and `problem` set.
 */
export interface Check {
    api: string[];
    declaredType: string[];
    expectedType: string | null;
    nameMatchesType: boolean | null;
    ok: boolean;
    problem: string | null;
    unknownApi: string[];
    unknownExport: string[];
    writes: number;
}

export const runCheck = (visitor: string, type?: string): Check => {
    const [error] = tryCatch(parse, visitor, {});
    
    if (error)
        return {
            api: [],
            declaredType: [],
            expectedType: type || null,
            nameMatchesType: null,
            ok: false,
            problem: `does not parse: ${(error as Error).message}`,
            unknownApi: [],
            unknownExport: [],
            writes: 0,
        };
    
    const exported = exportedNames(visitor);
    const used = [...new Set(apiKeys(visitor))];
    
    const unknownApi = used.filter(isUnknownApiKey);
    
    const unknownExport = exported.filter(isUnknownType);
    
    const writes = (visitor.match(/\bwrite\(/g) || []).length;
    
    return {
        api: used,
        declaredType: exported,
        expectedType: type || null,
        nameMatchesType: type ? exported.includes(type) : null,
        ok: !unknownApi.length && writes > 0,
        problem: null,
        unknownApi,
        unknownExport,
        writes,
    };
};

export function handler({action, visitor, type}: Schema) {
    if (action === 'contract' || !visitor)
        return {
            content: [{
                type: 'text' as const,
                text: CONTRACT,
            }],
        };
    
    const result = runCheck(visitor, type);
    
    if (result.problem)
        return {
            content: [{
                type: 'text' as const,
                text: `✗ ${result.problem}`,
            }],
        };
    
    const lines = [
        `exports: ${result.declaredType.join(', ') || '(none)'}`,
        `api destructured: ${result.api.join(', ') || '(none)'}`,
        `write() calls: ${result.writes}`,
    ];
    
    if (result.unknownApi.length > 0)
        lines.push(`✗ not in the printer API: ${result.unknownApi.join(', ')} — these will be undefined at print time`);
    
    if (result.unknownExport.length > 0)
        lines.push(`? not a babel node type, and not one the processors override: ${result.unknownExport.join(', ')} — a genuinely new type needs @putout/printer to learn it, or the print throws`);
    
    if (!result.nameMatchesType && result.expectedType)
        lines.push(`✗ the export does not match \`type: ${type}\`. The printer dispatches on the EXPORT NAME, so a mismatch means the visitor is never called at all`);
    
    if (!result.writes)
        lines.push('✗ no `write(` call at all — this visitor prints nothing, and nothing warns about it');
    
    if (!result.unknownApi.length && !result.unknownExport.length && result.writes)
        lines.push('✓ uses only real API keys, the name dispatches, and it writes something');
    
    return {
        content: [{
            type: 'text' as const,
            text: lines.join('\n'),
        }],
    };
}
