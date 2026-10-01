import {test} from 'supertape';
import {type ParserOptions, parse} from '@babel/parser';
import {flattenAst} from './flat.ts';
import type {FlatNode} from './state.types.ts';

const parseOptions: ParserOptions = {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
};

const toFile = (source: string): FlatNode[] => flattenAst(parse(
    source,
    parseOptions,
), source);

const span = (from: number, to: number) => ({
    start: {
        line: 1,
        column: from,
    },
    end: {
        line: 1,
        column: to,
    },
});

test('flat: the first node is Program at depth 0', (t) => {
    const [result] = toFile('const a = 1;');
    const expected = {
        id: '0',
        pid: null,
        depth: 0,
        type: 'Program',
        detail: '',
        line: 1,
        col: 0,
        endLine: 1,
        endCol: 12,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('flat: walks body in source order', (t) => {
    const result = toFile('const a = 1;').map(({type}) => type);
    const expected = [
        'Program',
        'VariableDeclaration',
        'VariableDeclarator',
        'Identifier',
        'NumericLiteral',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flat: depth increments per level', (t) => {
    const result = toFile('const a = 1;').map(({depth}) => depth);
    const expected = [
        0,
        1,
        2,
        3,
        3,
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flat: the identifier carries its name as detail', (t) => {
    const result = toFile('const a = 1;').find(({type}) => type === 'Identifier');
    const expected = '"a"';
    
    t.equal(result && result.detail, expected);
    t.end();
});

test('flat: a string literal carries its value as detail', (t) => {
    const result = toFile('const a = "x";').find(({type}) => type === 'StringLiteral');
    const expected = '"x"';
    
    t.equal(result && result.detail, expected);
    t.end();
});

test('flat: a call node carries its callee name as detail', (t) => {
    const result = toFile('add(1);').find(({type}) => type === 'CallExpression');
    const expected = 'add';
    
    t.equal(result && result.detail, expected);
    t.end();
});

test('flat: a member expression carries the whole text as detail', (t) => {
    const result = toFile('a.b;').find(({type}) => type === 'MemberExpression');
    const expected = 'a.b';
    
    t.equal(result && result.detail, expected);
    t.end();
});

test('flat: a node with no loc is skipped', (t) => {
    const result = flattenAst({
        type: 'Program',
        loc: span(0, 12),
        body: [{
            type: 'Identifier',
            name: 'a',
        }],
    }, 'const a = 1;');
    
    const expected: string[] = ['Program'];
    
    t.deepEqual(result.map(({type}) => type), expected);
    t.end();
});

test('flat: a null child is skipped without breaking its siblings', (t) => {
    const result = flattenAst({
        type: 'Program',
        loc: span(0, 12),
        body: [null, {
            type: 'Identifier',
            name: 'a',
            loc: span(6, 7),
        }],
    }, 'const a = 1;');
    
    const expected: string[] = [
        'Program',
        'Identifier',
    ];
    
    t.deepEqual(result.map(({type}) => type), expected);
    t.end();
});

test('flat: a File wrapper is not shown as a row', (t) => {
    const result = toFile('const a = 1;').map(({type}) => type);
    const expected = [
        'Program',
        'VariableDeclaration',
        'VariableDeclarator',
        'Identifier',
        'NumericLiteral',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('flat: a node with no start or end has no detail', (t) => {
    const result = flattenAst({
        type: 'ExpressionStatement',
        loc: span(0, 12),
        expression: {
            type: 'MemberExpression',
            loc: span(0, 3),
        },
    }, 'a.b;').find(({type}) => type === 'MemberExpression');
    
    const expected = '';
    
    t.equal(result && result.detail, expected);
    t.end();
});

test('flat: a node with no type has no detail', (t) => {
    const result = flattenAst({
        type: 'ExpressionStatement',
        loc: span(0, 12),
        expression: {
            loc: span(0, 3),
        },
    }, 'a.b;').find(({type}) => type === 'ExpressionStatement');
    
    const expected = '';
    
    t.equal(result && result.detail, expected);
    t.end();
});
