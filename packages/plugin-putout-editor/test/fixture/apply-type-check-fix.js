const a = isStringLiteral(arg);
const b = isCallExpression(node);
const c = isIdentifier(node);
const d = !isProgram(node);
const e = action.type === 'snippet/save';
const f = node.type === 'NotAType';
