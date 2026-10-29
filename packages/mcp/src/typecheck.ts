import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {parse, traverse} from 'putout';
import {createTypeChecker} from '@putout/printer/type-checker';
import {report} from '@putout/printer/type-checker/report';

export const name = 'type_check';

export const description = 'Run a createTypeChecker clause table on a fixture: which clause decides each node, and which clause never matches (exit 1). Clauses: "Type", "-: selector -> Type", "-: selector -> !Type". Function clauses are not available.';

/**
 * The coverage key: `at:uri:line:column`, four fields. `report()` splits it on
 * `:` and prints `line + index + 1`, so the third field must be a number.
 * A fifth field (a filename) prints `NaN`. Line `0`: no fixture on disk.
 */
const SOURCE = 'mcp:type_check:0:0';

/**
 * The clause table, strings only. JSON cannot carry the function of a
 * `['+', fn]` clause, so the schema accepts `z.string()` and nothing else.
 */
export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code'),
    typeNames: z
        .array(z.string())
        .describe('Clauses in priority order, at least one bare type name'),
});

export type Schema = z.input<typeof schema>;

/** `SKIP` from `type-checker.js`, quoted so the report can point at where it is. */
const SKIP = '[Infinity, false]';

/**
 * `typeChecker` as the tool needs it: the clause loop's own `[index, result]`.
 */
type Passthrough = (path: unknown, options?: unknown) => [number, boolean];

/**
 * `instrument()` returns only the boolean. This tool needs the clause index,
 * so it replaces `instrumentCoverage`, the documented seam. All other work
 * of `createTypeChecker` stays. `fn` is `typeChecker`.
 */
const passthrough = (typeNames: unknown[], fn: Passthrough) => (path: unknown, options?: unknown) => fn(path, options);

/**
 * `clause index -> how many nodes it claimed`.
 *
 * A `Map` rather than an object because the key is a **number** and an absent
 * key is the signal: a clause that claimed nothing is missing, which is
 * distinguishable from a clause that claimed zero. `report()` consumes
 * `hits.keys()` as the covered set, so the two cannot disagree.
 */
export const runChecker = (fixture: string, typeNames: string[]): Map<number, number> => {
    const checker = createTypeChecker(typeNames as never, {
        instrumentCoverage: passthrough as never,
    }) as unknown as (path: unknown, options?: unknown) => [number, boolean];
    
    const ast = parse(fixture, {});
    const hits = new Map<number, number>();
    
    traverse(ast, {
        enter(path: unknown) {
            const [index] = checker(path, {});
            
            // `Infinity` is `SKIP`: no clause matched this node at all, which is
            // the single most useful thing the tool reports — a table where most
            // nodes fall through is a rule that will match nothing.
            if (index === Number.POSITIVE_INFINITY)
                return;
            
            hits.set(index, (hits.get(index) || 0) + 1);
        },
    });
    
    return hits;
};

export async function handler({fixture, typeNames}: Schema) {
    const [error, hits] = await tryToCatch(runChecker, fixture, typeNames);
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: (error as Error).message,
            }],
        };
    
    // the printer's own reporter, not a re-implementation: same code frame, same
    // "Uncovered Checkers found at index: N", same exit code. Reusing it means a
    // bug in "which arm is dead" is fixed once, upstream.
    const [code, message] = report(new Map([
        [
            SOURCE, {
                covered: new Set(hits.keys()),
                typeNames,
            },
        ],
    ]) as never);
    
    const claims = [];
    
    for (const [index, count] of hits)
        claims.push(`  clause ${index + 1}: ${count} node(s) — ${typeNames[index]}`);
    
    const lines = [
        message,
        '',
        'Per-node clause index (the arm that decided each node):',
        ...claims,
        '',
        `SKIP (no clause matched): ${SKIP}`,
    ];
    
    return {
        content: [{
            type: 'text' as const,
            text: `${lines.join('\n')}\n\nexit code ${code}`,
        }],
    };
}
