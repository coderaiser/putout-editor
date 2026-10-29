import {tryCatch} from 'try-catch';
import {type ParserOptions, parse} from '@babel/parser';
import {print, type types} from 'putout';
import type {CommandResult} from '../state.types.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
};

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

type Walked = types.Node & {
    [key: string]: unknown;
};

/**
 * Replace each leaf with the next `__a`-style name and print the result:
 * `const add = (a, b) => a + b;` gives `const __a = __b => __c + __d`.
 * Only types in `LEAVES` change, so an import stays an import.
 */
const blankLeaves = (node: Walked | Walked[], state: {
    at: number;
}): void => {
    if (Array.isArray(node)) {
        for (const item of node)
            blankLeaves(item, state);
        
        return;
    }
    
    if (!node || typeof node !== 'object')
        return;
    
    if (node.type && LEAVES.has(node.type)) {
        state.at++;
        
        for (const key of Object.keys(node))
            if (key !== 'loc' && key !== 'range')
                delete node[key];
        
        Object.assign(node, {
            type: 'Identifier',
            name: `__${ALPHABET[(state.at - 1) % ALPHABET.length]}`,
        });
        
        return;
    }
    
    for (const key of Object.keys(node))
        if (key !== 'loc' && key !== 'range')
            blankLeaves(node[key] as Walked, state);
};

/**
 * `name-pattern` is the inverse of `test-pattern`: rather than asking whether
 * a key matches, it takes a snippet and reports the key that generalises it,
 * so a rule can be written from an example instead of guessed at.
 */
export const runNamePattern = (args: string): CommandResult => {
    if (!args)
        return {
            type: 'error',
            message: 'No snippet. Put the snippet on the next line.',
        };
    
    const [error, ast] = tryCatch(parse, args, parseOptions);
    
    if (error)
        return {
            type: 'error',
            message: 'The snippet does not parse.',
        };
    
    blankLeaves(ast as unknown as Walked, {
        at: 0,
    });
    
    const key = print(ast as types.Node)
        .trim()
        .replace(/;$/, '');
    
    return {
        type: 'text',
        data: key,
    };
};
