export type TypeCategory =
    | 'statement'
    | 'declaration'
    | 'expression'
    | 'call'
    | 'literal'
    | 'identifier'
    | 'control'
    | 'other';

/**
 * The eight buckets, as `Set`s built once at module scope.
 *
 * `Set` rather than a switch because the lists are data and a switch would be
 * seven arms of `||` that a typo turns into a silent fall-through. Every name
 * here is a **babel** node type — the plan's own warning: putout's AST is
 * babel's, so a string is a `StringLiteral` and not a `Literal`.
 *
 * Order matters and is the interesting part: `STATEMENT` is checked first, and
 * `BlockStatement` is in it. A `BlockStatement` is also the body of a function
 * and nobody thinks of it as a *statement* when reading a tree, but
 * `FunctionDeclaration` is in `DECLARATION` and the reader's expectation of "this
 * is a declaration" is better served by the colour the surrounding rows already
 * establish. `File` is `STATEMENT` for the same reason: it is the root, and it
 * should look like the row that contains everything.
 */
const STATEMENT = new Set([
    'Program',
    'File',
    'ExpressionStatement',
    'BlockStatement',
    'EmptyStatement',
    'DebuggerStatement',
]);

const DECLARATION = new Set([
    'VariableDeclaration',
    'VariableDeclarator',
    'FunctionDeclaration',
    'ClassDeclaration',
    'ImportDeclaration',
    'ExportNamedDeclaration',
    'ExportDefaultDeclaration',
    'ExportAllDeclaration',
    'ImportSpecifier',
    'ExportSpecifier',
    'ImportDefaultSpecifier',
    'ImportNamespaceSpecifier',
]);

const EXPRESSION = new Set([
    'ArrowFunctionExpression',
    'FunctionExpression',
    'ClassExpression',
    'BinaryExpression',
    'LogicalExpression',
    'AssignmentExpression',
    'UnaryExpression',
    'UpdateExpression',
    'ConditionalExpression',
    'ObjectExpression',
    'ArrayExpression',
    'SequenceExpression',
    'AwaitExpression',
    'YieldExpression',
    'SpreadElement',
    'TaggedTemplateExpression',
]);

const CALL = new Set([
    'CallExpression',
    'OptionalCallExpression',
    'MemberExpression',
    'OptionalMemberExpression',
    'NewExpression',
]);

const LITERAL = new Set([
    'StringLiteral',
    'NumericLiteral',
    'BooleanLiteral',
    'NullLiteral',
    'RegExpLiteral',
    'TemplateLiteral',
    'TemplateElement',
    'BigIntLiteral',
    'DecimalLiteral',
]);

const IDENTIFIER = new Set([
    'Identifier',
    'PrivateName',
    'JSXIdentifier',
]);

const CONTROL = new Set([
    'ReturnStatement',
    'IfStatement',
    'ForStatement',
    'ForInStatement',
    'ForOfStatement',
    'WhileStatement',
    'DoWhileStatement',
    'SwitchStatement',
    'ThrowStatement',
    'TryStatement',
    'CatchClause',
    'BreakStatement',
    'ContinueStatement',
    'LabeledStatement',
    'WithStatement',
]);

/**
 * Which of the eight buckets a node type belongs to.
 *
 * `other` is the fallback and the reason the function exists at all: babel has
 * far more node types than any list can hold, and a row that matched nothing
 * still has to be coloured. An unknown type renders as `other`, which takes
 * `var(--ast-accent)` — the colour the tree already used for every type, so an
 * unrecognised node looks like "no opinion" rather than like a bug.
 *
 * Not `Map<string, TypeCategory>` over the union of all four lists, because the
 * sets must be **ordered**: `BlockStatement` is only a statement because
 * `STATEMENT` is asked first, and a map built by merging the sets would have one
 * answer per type with no room for that.
 */
export const categoryOf = (type: string): TypeCategory => {
    if (STATEMENT.has(type))
        return 'statement';
    
    if (DECLARATION.has(type))
        return 'declaration';
    
    if (EXPRESSION.has(type))
        return 'expression';
    
    if (CALL.has(type))
        return 'call';
    
    if (LITERAL.has(type))
        return 'literal';
    
    if (IDENTIFIER.has(type))
        return 'identifier';
    
    if (CONTROL.has(type))
        return 'control';
    
    return 'other';
};
