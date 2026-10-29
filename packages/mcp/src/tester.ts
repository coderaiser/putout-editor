import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {
    putoutAsync,
    print,
    types,
} from 'putout';
import {resolveTS} from './language.ts';

type Binding = {
    name: string;
    bindings: string[];
};
type Vars = {
    [key: string]: types.Node;
};
type Position = {
    line: number;
    column: number;
};
type Replacement = {
    code?: string;
    changed?: boolean;
    error?: string;
    note?: string;
};
type Report = {
    key: string;
    matched?: number;
    positions?: Position[];
    bound?: {
        [key: string]: string[];
    };
    replacement?: Replacement;
    error?: string;
    hint?: string;
};

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';
const {isStatement} = types;

/**
 * The source of a bound node. The printer prints an expression as a statement
 * (`a;\n`), so the `;` goes away, except on a node that is a statement.
 */
const sourceOf = (node: types.Node) => {
    const code = print(node).trimEnd();
    
    if (isStatement(node))
        return code;
    
    return code.replace(/;$/, '');
};

export const name = 'test_pattern';

export const description = 'Check one pattern key on a fixture: match count, positions, what each __a bound to, and the replacement result. A key that matches nothing exits 0 in the CLI; this shows it.';

export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code'),
    key: z
        .string()
        .describe('Pattern key, e.g. "const __a = __b"'),
    to: z
        .string()
        .optional()
        .describe('Replacement key: reports the code and if it changed'),
    isTS: z
        .boolean()
        .optional()
        .describe('TypeScript fixture. Omit: found from the fixture'),
});

const NO_MATCH = 'Nothing matched. A placeholder only takes a type from the shape around it, so "f(__a)" matches a call, and "__a" on its own matches an identifier.';

const NOT_LINKED = 'A replacement may only reuse a name the key declared. That is what "Looks like template values not linked" means.';

const SILENT = 'The replacement emitted the input unchanged and still exited 0. Two underscores (__a__) bind nothing, so the text is written out as given.';

export async function handler({fixture, key, to, isTS}: z.input<typeof schema>) {
    const [, result] = await tryToCatch(run, fixture, key, to, resolveTS(fixture, isTS));
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
        }],
    };
}

const byName = (name: string) => (item: Binding) => item.name === name;

const positionOf = ({position}: {position: Position;}) => position;

const asBinding = ({name, bindings}: Binding): [string, string[]] => [name, bindings];

const finder = (key: string, bound: Binding[]) => ({
    report: () => 'matched',
    match: () => ({
        [key]: (vars: Vars = {}) => {
            for (const [name, node] of Object.entries(vars)) {
                if (!/^__[a-zA-Z]$/.test(name))
                    continue;
                
                const item = bound.find(byName(name));
                
                if (item)
                    item.bindings.push(sourceOf(node));
                else
                    bound.push({
                        name,
                        bindings: [
                            sourceOf(node),
                        ],
                    });
            }
            
            return true;
        },
    }),
    // The key must be present or the loader cannot classify the plugin, but this is
    
    // a matcher: `run` only ever passes it to putoutAsync with `fix: false`, so a
    
    // replacement is never reached. Rewriting to the key itself is the honest
    
    // no-op — a replacement that printed the binding would be code that cannot run.
    replace: () => ({
        [key]: key,
    }),
});

const replacer = (key: string, to: string) => ({
    report: () => 'x',
    match: () => ({
        [key]: () => true,
    }),
    replace: () => ({
        [key]: to,
    }),
});

async function run(fixture: string, key: string, to: string | undefined, isTS: boolean): Promise<Report> {
    const bound: {
        name: string;
        bindings: string[];
    }[] = [];
    
    const [matchError, matched] = await tryToCatch(putoutAsync, fixture, {
        isTS,
        fix: false,
        plugins: [
            ['rule', finder(key, bound)],
        ],
    });
    
    if (matchError)
        return {
            key,
            error: matchError.message,
            hint: NOT_LINKED,
        };
    
    const {places} = matched;
    
    const out: Report = {
        key,
        matched: places.length,
        positions: places.map(positionOf),
        bound: Object.fromEntries(bound.map(asBinding)),
    };
    
    if (!places.length)
        out.hint = NO_MATCH;
    
    if (isUndefined(to))
        return out;
    
    const [replaceError, replaced] = await tryToCatch(putoutAsync, fixture, {
        isTS,
        fixCount: 1,
        plugins: [
            ['rule', replacer(key, to)],
        ],
    });
    
    if (replaceError) {
        out.replacement = {
            error: replaceError.message,
        };
        out.hint = NOT_LINKED;
        
        return out;
    }
    
    const {code} = replaced;
    
    out.replacement = {
        code,
        changed: code !== fixture,
    };
    
    if (code === fixture)
        out.replacement.note = SILENT;
    
    return out;
}
