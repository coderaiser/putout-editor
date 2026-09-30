import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {
    putoutAsync,
    print,
    type types,
} from 'putout';

type Binding = {
    name: string;
    bindings: string[];
};
type Vars = {
    [key: string]: types.Node;
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
    positions?: {
        line: number;
        column: number;
    }[];
    bound?: {
        [key: string]: string[];
    };
    replacement?: Replacement;
    error?: string;
    hint?: string;
};

const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

export const name = 'test_pattern';

export const description =
    'Test one PutoutScript pattern against source before writing a rule around it. ' +
    'Answers three questions at once: does the key match, how many places, and what each ' +
    'placeholder bound to. A pattern that matches nothing and a replacement whose placeholders ' +
    'are not linked both look like success from the CLI, which is why this exists. ' +
    'Typical loop: test_pattern -> write rule -> find_places -> transform.';

export const schema = z.object({
    fixture: z
        .string()
        .describe('Source code to match against'),
    key: z
        .string()
        .describe('The pattern key, e.g. "const __a = __b" or "f(__a)"'),
    to: z
        .string()
        .optional()
        .describe('Optional replacement. When given, reports the result and whether it changed anything'),
});

const NO_MATCH = 'Nothing matched. A placeholder only takes a type from the shape around it, so "f(__a)" matches a call, and "__a" on its own matches an identifier.';

const NOT_LINKED = 'A replacement may only reuse a name the key declared. That is what "Looks like template values not linked" means.';

const SILENT = 'The replacement emitted the input unchanged and still exited 0. Two underscores (__a__) bind nothing, so the text is written out as given.';

export async function handler({fixture, key, to}: z.input<typeof schema>) {
    const [, result] = await tryToCatch(run, fixture, key, to);
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
        }],
    };
}

const byName = (name: string) => (item: Binding) => item.name === name;

const printValue = ({__a}: Vars) => print(__a) || 'X';

const finder = (key: string, bound: Binding[]) => ({
    report: () => 'matched',
    match: () => ({
        [key]: (vars: Vars = {}) => {
            for (const [name, node] of Object.entries(vars)) {
                if (!/^__[a-zA-Z]$/.test(name))
                    continue;
                
                const item = bound.find(byName(name));
                
                if (item)
                    item.bindings.push(print(node));
                else
                    bound.push({
                        name,
                        bindings: [
                            print(node),
                        ],
                    });
            }
            
            return true;
        },
    }),
    replace: () => ({
        [key]: printValue,
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

async function run(fixture: string, key: string, to?: string): Promise<Report> {
    const bound: {
        name: string;
        bindings: string[];
    }[] = [];
    
    const [matchError, matched] = await tryToCatch(putoutAsync, fixture, {
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
        positions: places.map(({position}) => position),
        bound: Object.fromEntries(bound.map(({name, bindings}) => [name, bindings])),
    };
    
    if (!places.length)
        out.hint = NO_MATCH;
    
    if (isUndefined(to))
        return out;
    
    const [replaceError, replaced] = await tryToCatch(putoutAsync, fixture, {
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
