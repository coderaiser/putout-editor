import {
    parse,
    print,
    operator,
    types,
} from 'putout';

const {insertBefore, compare} = operator;

const {
    isLogicalExpression,
    isMemberExpression,
    isCallExpression,
    isIdentifier,
    identifier,
} = types;

const statement = (code) => parse(code).program.body[0];

const expression = (code) => statement(code).expression;

const hasCall = (node) => isCallExpression(node) || isMemberExpression(node) && hasCall(node.object);

const propertyOf = (node) => {
    if (isMemberExpression(node) && isIdentifier(node.property))
        return node.property.name;
    
    if (isCallExpression(node) && isMemberExpression(node.callee) && isIdentifier(node.callee.property))
        return node.callee.property.name;
};

const nameOf = (left, right) => propertyOf(left) || propertyOf(right);

const rebase = (right, name) => {
    if (isMemberExpression(right))
        return {
            ...right,
            object: identifier(name),
        };
    
    return {
        ...right,
        callee: {
            ...right.callee,
            object: identifier(name),
        },
    };
};

const receiverOf = (right) => {
    if (isMemberExpression(right))
        return right.object;
    
    if (isCallExpression(right) && isMemberExpression(right.callee))
        return right.callee.object;
};

export const report = () => 'Bind the left side to a local: && calls it twice';

const bindingOf = (left, name) => {
    if (isMemberExpression(left) && isCallExpression(left.object))
        return `const {${name}} = ${print(left.object)};`;
    
    return `const ${name} = ${print(left)};`;
};

const isDuplicated = (node) => {
    if (!isLogicalExpression(node) || node.operator !== '&&')
        return false;
    
    const {left, right} = node;
    const receiver = receiverOf(right);
    
    return hasCall(left) && Boolean(receiver) && compare(left, receiver);
};

const canBind = (declarator, name) => name && !declarator.scope.hasBinding(name);

export const traverse = ({push}) => ({
    VariableDeclaration: (path) => {
        for (const declarator of path.get('declarations')) {
            const {init} = declarator.node;
            
            if (!isDuplicated(init))
                continue;
            
            const name = nameOf(init.left, init.right);
            
            push({
                path,
                declarator,
                name,
                left: init.left,
                right: init.right,
                canFix: canBind(declarator, name),
            });
        }
    },
    ArrowFunctionExpression: (path) => {
        const {body} = path.node;
        
        if (isDuplicated(body))
            push({
                path,
                body,
            });
    },
});

export const fix = ({path, declarator, name, left, right, canFix}) => {
    if (!canFix)
        return;
    
    insertBefore(path, statement(bindingOf(left, name)));
    
    const rebased = print(rebase(right, name));
    
    declarator.node.init = expression(`${name} && ${rebased};`);
};
