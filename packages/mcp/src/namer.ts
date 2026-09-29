import {z} from 'zod';
import {tryToCatch} from 'try-to-catch';
import {
    putoutAsync,
    print,
    type types,
} from 'putout';
import {parse, type ParserOptions} from '@babel/parser';

export const name = 'name_pattern';

export const description =
    'Name the PutoutScript patterns that match a snippet - the inverse of test_pattern. ' +
    'Given "[1, 2, 3];" it reports __array, given "f(1, 2)" it reports __args and __a, and it ' +
    'proposes a generalised key for the snippet itself, like "const __a = __b". ' +
    'Every answer is checked against the engine and only reported when it actually matched, so ' +
    'nothing here is a guess. Use it when you have the code and not the pattern.';

type Found = {
    key: string;
    matched: number;
};
type Report = {
    fixture: string;
    named: Found[];
    generic: Found[];
    key?: Found;
    key_hint?: string;
    hint?: string;
    error?: string;
};

const parseOptions: ParserOptions = {
    sourceType: 'module',
    strictMode: false,
    allowImportExportEverywhere: true,
    allowReturnOutsideFunction: true,
    plugins: [
        'jsx',
        'typescript',
        'importMeta',
    ] as ParserOptions['plugins'],
};

export const schema = z.object({
    fixture: z
        .string()
        .describe('The code snippet to name patterns for, e.g. "[1, 2, 3];"'),
});

const NAMED = [
    '__array',
    '__object',
    '__args',
    '__imports',
    '__exports',
];

const GENERIC = [
    '__a',
    '__',
];

const LEAVES = new Set([
    'Identifier',
    'StringLiteral',
    'NumericLiteral',
    'BooleanLiteral',
    'NullLiteral',
    'RegExpLiteral',
    'BigIntLiteral',
    'DecimalLiteral',
]);

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

type Walked = {
    type?: string;
    [key: string]: unknown;
};
type State = {
    at: number;
};

const counted = async (fixture: string, key: string) => {
    const [error, result] = await tryToCatch(putoutAsync, fixture, {
        fix: false,
        plugins: [
            ['rule', {
                report: () => 'x',
                match: () => ({
                    [key]: () => true,
                }),
                replace: () => ({
                    [key]: () => '__M__',
                }),
            }],
        ],
    });
    
    if (error)
        return 0;
    
    return result.places.length;
};

const blankLeaves = (node: Walked | Walked[], state: State) => {
    if (Array.isArray(node)) {
        for (const item of node)
            blankLeaves(item, state);
        
        return;
    }
    
    if (!node || typeof node !== 'object')
        return;
    
    if (node.type && LEAVES.has(node.type)) {
        const name = `__${ALPHABET[state.at % ALPHABET.length]}`;
        
        state.at++;
        
        for (const key of Object.keys(node))
            if (key !== 'loc' && key !== 'range')
                delete node[key];
        
        Object.assign(node, {
            type: 'Identifier',
            name,
        });
        
        return;
    }
    
    for (const key of Object.keys(node))
        if (key !== 'loc' && key !== 'range')
            blankLeaves(node[key] as Walked, state);
};

const generalize = async (fixture: string): Promise<string | null> => {
    const [error, ast] = await tryToCatch(parse, fixture, parseOptions);
    
    if (error)
        return null;
    
    const program = ast as types.Node;
    
    blankLeaves(program as unknown as Walked, {
        at: 0,
    });
    
    return print(program)
        .trim()
        .replace(/;$/, '');
};

export async function handler({fixture}: z.input<typeof schema>) {
    const [error, result] = await tryToCatch(run, fixture);
    
    if (error)
        return {
            content: [{
                type: 'text' as const,
                text: `Error: ${error.message}`,
            }],
        };
    
    return {
        content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
        }],
    };
}

async function run(fixture: string): Promise<Report> {
    const out: Report = {
        fixture,
        named: [],
        generic: [],
    };
    
    for (const key of [...NAMED, ...GENERIC]) {
        const matched = await counted(fixture, key);
        
        if (!matched)
            continue;
        
        const found: Found = {
            key,
            matched,
        };
        
        if (NAMED.includes(key))
            out.named.push(found);
        else
            out.generic.push(found);
    }
    
    const key = await generalize(fixture);
    
    if (key) {
        const matched = await counted(fixture, key);
        
        if (matched)
            out.key = {
                key,
                matched,
            };
        else
            out.key_hint = 'The snippet has no generalisation that matches, which usually means the shape carries meaning - an import or an export. Write that key by hand and check it with test_pattern.';
    }
    
    if (!out.named.length && !out.generic.length && !out.key)
        out.hint = 'Nothing matched. A named value needs the right position: __object and __array are expressions, so a bare {a: 1}; is a block and ([1]) is the object.';
    
    return out;
}
