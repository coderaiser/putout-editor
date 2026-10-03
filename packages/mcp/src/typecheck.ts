import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {parse, traverse} from 'putout';
import {createTypeChecker} from '@putout/printer/type-checker';
import {report} from '@putout/printer/type-checker/report';

export const name = 'type_check';

export const description =
    'Run an @putout/printer clause table over a fixture and report which arms fire. ' +
    'A type checker is an ordered list of matchers where the first match wins, so ' +
    '"which arm does this code hit, and which of my arms is dead" is the question every ' +
    'rule with a `match` or a guard table must answer before its tests can be written. ' +
    'Takes the same string clauses createTypeChecker takes: a bare type name ("Identifier"), ' +
    'or "-: selector -> TypeName" / "-: selector -> !TypeName" for a guarded arm. ' +
    'Reports the per-node arm, and exits non-zero when an arm no node reaches. ' +
    'Function clauses ("+", fn) are not offered: a function cannot cross this wire, and a ' +
    'rule that needs one is written with validate or transform instead. ' +
    'Typical loop: type_check -> write the rule -> find_places -> transform.';

/**
 * Where the synthetic coverage map is keyed: `at:uri:line:column`.
 *
 * `instrument()` keys by a **stack line** it parses out of `Error()`, and skips
 * anything containing `type-checker.spec.js`. This tool does not go through
 * `instrument` — it replaces it, below — so it builds the map `report()` wants
 * under a name of its own.
 *
 * The `at:uri:line:column` shape is load-bearing, not decoration. `report()`'s
 * `setLine` does `name.split(':')` into exactly those four and then
 * `Number(line) + index + 1`, to turn a 0-based clause index into the 1-based
 * line number it prints. So the third field has to be **numeric** — a key like
 * `mcp:type_check:type_check.ts:0:0` has five fields, puts `type_check.ts` where
 * the line goes, and prints `mcp:type_check:NaN:0`. Line `0` is honest: this tool
 * has no fixture on disk, and `report()` then reports clause N at line N.
 */
const SOURCE = 'mcp:type_check:0:0';

/**
 * The clause table, as `createTypeChecker` takes it — **strings only**.
 *
 * `createTypeChecker` accepts a bare `'Identifier'`, a `'selector -> TypeName'`
 * pair, and a `['+', fn]` tuple whose second element is a live function. A
 * function cannot arrive over MCP — JSON has no way to carry one — so the
 * schema stops at `z.string()` rather than accepting an array and failing later
 * on `maybeCall`'s `isFn` check. The description says so, because "the tool took
 * my array and matched nothing" is the worse outcome.
 */
export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code to run the clause table over'),
    typeNames: z
        .array(z.string())
        .describe('The clause table, in priority order. At least one bare type name, or createTypeChecker rejects it for having no successful route'),
});

export type Schema = z.input<typeof schema>;

/** `SKIP` from `type-checker.js`, quoted so the report can point at where it is. */
const SKIP = '[Infinity, false]';

/**
 * `typeChecker` as the tool needs it: the clause loop's own `[index, result]`.
 */
type Passthrough = (path: unknown, options?: unknown) => [number, boolean];

/**
 * The instrumentation replaced, and why.
 *
 * `createTypeChecker` always routes its result through `instrument()`, and
 * `instrument` returns `result` — the **boolean** — discarding the
 * `[index, result]` tuple the clause loop produced. That is right for its own
 * job: it only wants the index, to add it to a `Set`.
 *
 * `instrumentCoverage` is the documented seam for exactly this, so the tool keeps
 * all of the printer's real work — `parseTypeNames`, the `jessy` selector,
 * first-match-wins ordering, and the construction-time validation that rejects a
 * table with no successful route — and swaps only the part that throws the index
 * away. `fn` here is `typeChecker`, so the tuple is the one the clause loop
 * returned.
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
    
    const claims = [...hits.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([index, count]) => `  clause ${index + 1}: ${count} node(s) — ${typeNames[index]}`);
    
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
