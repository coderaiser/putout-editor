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
 * The eight buckets as `Set`s of Babel node types (`StringLiteral`, not
 * `Literal`). The order matters: `STATEMENT` is asked first, and it holds
 * `BlockStatement` and `File`.
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
 * The bucket of a node type. Unknown types get `other`, which uses
 * `var(--ast-accent)`. The sets are asked in order, so a merged `Map` cannot
 * replace them.
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
