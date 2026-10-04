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

/**
 * The cap, and the boundary either side of it.
 *
 * `detail` is a node's own text — a long string literal, a long identifier, a
 * long arrow body. plan.md §5a: "the detail string is currently the full
 * stringified node value — it should be truncated to fit". On a 390px row that
 * pushed the type label and the `line:col` off the edge.
 *
 * Three cases because the two sides of a cap are where this goes wrong: exactly
 * at the cap (untouched), one over (cut, with the ellipsis), and well over (still
 * cut, and *not* growing — a cap that only fires once is not a cap).
 */
test('flat: a detail at the cap is left alone', (t) => {
    const [node] = toFile(`const a = "${'x'.repeat(30)}";`).filter(({type}) => type === 'StringLiteral');
    const result = node.detail.length;
    
    // the quotes count, so 30 characters of source is 32
    const expected = 32;
    
    t.equal(result, expected);
    t.end();
});

test('flat: a detail over the cap is cut and marked', (t) => {
    const [node] = toFile(`const a = "${'x'.repeat(200)}";`).filter(({type}) => type === 'StringLiteral');
    const result = {
        length: node.detail.length,
        marked: node.detail.endsWith('…'),
    };
    
    const expected = {
        length: 32,
        marked: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The cap applies to what is **drawn**, and the ellipsis is inside the budget.
 *
 * Two decisions, both visible in the expected string. It is applied to the
 * finished detail rather than inside `quote` — otherwise the rendered length is
 * `cap + 2` and varies with whether the value happened to be a string, and the
 * number in this spec stops being the number of columns the row occupies. And it
 * is `MAX_DETAIL - 1` characters plus the ellipsis rather than `MAX_DETAIL` plus
 * it, so a capped detail is exactly as wide as an uncapped one at the cap.
 *
 * So a 200-character literal is 30 x's, two quotes and an ellipsis: 32.
 */
test('flat: the cap counts the quotes and the ellipsis', (t) => {
    const [node] = toFile(`const a = "${'x'.repeat(200)}";`).filter(({type}) => type === 'StringLiteral');
    const result = node.detail;
    const expected = `"${'x'.repeat(30)}…`;
    
    t.equal(result, expected);
    t.end();
});

/**
 * An unquoted long value is capped the same way — the rule is about the column,
 * not about string literals.
 */
test('flat: a long identifier is capped too', (t) => {
    const [node] = toFile(`const ${'a'.repeat(200)} = 1;`).filter(({type}) => type === 'Identifier');
    const result = node.detail.length;
    const expected = 32;
    
    t.equal(result, expected);
    t.end();
});

/**
 * A structural row is still empty.
 *
 * `STRUCTURAL` nodes get `''` before any of this, and the cap must not turn an
 * empty detail into an ellipsis — a `Program` row showing `…` would be a bug with
 * no other symptom.
 */
test('flat: a structural node still has no detail at all', (t) => {
    const [node] = toFile(`const a = "${'x'.repeat(200)}";`).filter(({type}) => type === 'Program');
    const result = node.detail;
    const expected = '';
    
    t.equal(result, expected);
    t.end();
});
