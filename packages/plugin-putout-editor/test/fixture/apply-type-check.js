const a = arg?.type === 'StringLiteral';
const b = node.type === 'CallExpression';
const c = 'Identifier' === node.type;
const d = node.type !== 'Program';
const e = action.type === 'snippet/save';
const f = node.type === 'NotAType';
