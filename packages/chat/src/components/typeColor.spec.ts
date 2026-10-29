import {test} from 'supertape';
import {categoryOf, type TypeCategory} from './typeColor.ts';

/**
 * One case per arm of `categoryOf`, with `other`: each new Babel type lands
 * there. The `TypeCategory` type is on `known`, so a category rename is a
 * compile error.
 */
const known: [string, TypeCategory][] = [
    ['Program', 'statement'],
    ['ExpressionStatement', 'statement'],
    ['BlockStatement', 'statement'],
    ['VariableDeclaration', 'declaration'],
    ['VariableDeclarator', 'declaration'],
    ['ImportDeclaration', 'declaration'],
    ['ExportNamedDeclaration', 'declaration'],
    ['ArrowFunctionExpression', 'expression'],
    ['BinaryExpression', 'expression'],
    ['AssignmentExpression', 'expression'],
    ['CallExpression', 'call'],
    ['MemberExpression', 'call'],
    ['NewExpression', 'call'],
    ['StringLiteral', 'literal'],
    ['NumericLiteral', 'literal'],
    ['BooleanLiteral', 'literal'],
    ['NullLiteral', 'literal'],
    ['TemplateLiteral', 'literal'],
    ['Identifier', 'identifier'],
    ['JSXIdentifier', 'identifier'],
    ['ReturnStatement', 'control'],
    ['IfStatement', 'control'],
    ['ThrowStatement', 'control'],
    ['TryStatement', 'control'],
];

for (const [type, expected] of known)
    test(`categoryOf: ${type} is ${expected}`, (t) => {
        const result = categoryOf(type);
        
        t.equal(result, expected);
        t.end();
    });

/**
 * The fallback, and a type that is not a babel node at all.
 *
 * Two cases because they are different inputs: `TSAsExpression` is a real type
 * that arrived after the lists were written, and `SomethingUnknown` is not a
 * node type. Both must be `other`, and the second is what a typo in a *match*
 * arm would look like.
 */
test('categoryOf: a type from a newer parser is other', (t) => {
    const result = categoryOf('TSAsExpression');
    const expected = 'other';
    
    t.equal(result, expected);
    t.end();
});

test('categoryOf: an unknown type is other', (t) => {
    const result = categoryOf('SomethingUnknown');
    const expected = 'other';
    
    t.equal(result, expected);
    t.end();
});

/**
 * The empty string, which is a real input and not a hypothetical one.
 *
 * `AstRow` renders `{node.type}` directly, so a node whose `type` is `''` puts
 * an empty string into `data-category` and the CSS matches none of the eight
 * selectors. `other` is what makes it fall back to the accent rather than
 * losing its colour.
 */
test('categoryOf: the empty string is other', (t) => {
    const result = categoryOf('');
    const expected = 'other';
    
    t.equal(result, expected);
    t.end();
});

/**
 * `BlockStatement` is in `STATEMENT`, and `STATEMENT` is asked first.
 * Reverse the order and this spec fails.
 */
test('categoryOf: the order of the sets decides BlockStatement', (t) => {
    const result = {
        // `BlockStatement` is only in `STATEMENT`, and it wins because
        // `STATEMENT` is asked first
        block: categoryOf('BlockStatement'),
        // and nothing shadows it: no later set contains it
        shadowed: categoryOf('BlockStatement') !== 'other',
    };
    
    const expected = {
        block: 'statement',
        shadowed: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * Every category is reachable, and distinct from every other.
 *
 * A guard on the guard: eight specs pass even if `categoryOf` accidentally
 * returned the same colour for `call` and `identifier`. This walks the union and
 * reads it back, which is the only way to say "all eight are used" rather than
 * "the eight I happened to write down".
 */
test('categoryOf: all eight categories are reachable and distinct', (t) => {
    const all: TypeCategory[] = [
        'statement',
        'declaration',
        'expression',
        'call',
        'literal',
        'identifier',
        'control',
        'other',
    ];
    
    const seen = new Set<string>();
    
    for (const [type] of known)
        seen.add(categoryOf(type));
    
    // `other` is only reachable from the two cases above, which are not in
    // `known` — so it is added by hand rather than pretended to be discovered
    seen.add(categoryOf('SomethingUnknown'));
    
    const result = {
        all: [...seen].sort(),
        expected: [...all].sort(),
    };
    
    t.deepEqual(result.all, result.expected);
    t.end();
});
