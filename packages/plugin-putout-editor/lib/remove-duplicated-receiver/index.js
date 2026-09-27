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
    isBlockStatement,
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

export const report = () => 'Bind the left side of && to a local: it is evaluated twice';

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

const canRebind = (path, name) => name && !path.scope.hasBinding(name);

const rebased = (node, name) => expression(`${name} && ${print(rebase(node.right, name))};`);

const duplicated = (node) => {
    const name = nameOf(node.left, node.right);
    
    return {
        name,
        node,
        binding: statement(bindingOf(node.left, name)),
        rebased: rebased(node, name),
    };
};

export const traverse = ({push}) => ({
    VariableDeclaration: (path) => {
        for (const declarator of path.get('declarations')) {
            const {init} = declarator.node;
            
            if (!isDuplicated(init))
                continue;
            
            const {
                name,
                binding,
                rebased: code,
            } = duplicated(init);
            
            push({
                kind: 'declaration',
                path,
                declarator,
                binding,
                code,
                canFix: canBind(declarator, name),
            });
        }
    },
    ReturnStatement: (path) => {
        const {argument} = path.node;
        
        if (!isDuplicated(argument))
            return;
        
        const {
            name,
            binding,
            rebased: code,
        } = duplicated(argument);
        
        push({
            kind: 'return',
            path,
            binding,
            code,
            canFix: canRebind(path, name),
        });
    },
    ArrowFunctionExpression: (path) => {
        const {body} = path.node;
        
        if (isBlockStatement(body) || !isDuplicated(body))
            return;
        
        const {
            name,
            binding,
            rebased: code,
        } = duplicated(body);
        
        push({
            kind: 'arrow',
            path,
            binding,
            code,
            canFix: canRebind(path, name),
        });
    },
});

export const fix = ({kind, path, declarator, binding, code, canFix}) => {
    if (!canFix)
        return;
    
    if (kind === 'declaration') {
        insertBefore(path, binding);
        declarator.node.init = code;
        
        return;
    }
    
    const returned = statement(`return ${print(code)};`);
    
    if (kind === 'return') {
        insertBefore(path, binding);
        path.node.argument = code;
        
        return;
    }
    
    [path.node.body] = parse(`{ ${print(binding)} ${print(returned)} }`).program.body;
};
