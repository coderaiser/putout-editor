import {operator, types} from 'putout';

const {replaceWith} = operator;

const {
    isLogicalExpression,
    isCallExpression,
    isIdentifier,
    isBinaryExpression,
    isUnaryExpression,
    isStringLiteral,
} = types;

const isNotNull = (node) => node !== null;

const BOOLEAN = 'Boolean';
const OBJECT = 'object';
const AND = '&&';
const EQUAL = '===';
const TYPEOF = 'typeof';

const isBooleanCall = (node) => isCallExpression(node) && isIdentifier(node.callee, {
    name: BOOLEAN,
});

const isCoercionCall = (node) => isBooleanCall(node) && node.arguments.length === 1 && isIdentifier(node.arguments[0]);

const isTypeofOf = (node, name, type) => isBinaryExpression(node) && node.operator === EQUAL && isUnaryExpression(node.left) && node.left.operator === TYPEOF && isIdentifier(node.left.argument, {
    name,
}) && isStringOf(node.right, type);

const isStringOf = (node, type) => isNotNull(node) && isStringLiteral(node) && node.value === type;

const matcher = ({}, path) => {
    if (!isLogicalExpression(path.node, {operator: AND}))
        return false;
    
    const {left, right} = path.node;
    
    if (!isCoercionCall(left))
        return false;
    
    const [argument] = left.arguments;
    
    if (!isTypeofOf(right, argument.name, OBJECT))
        return false;
    
    return {
        name: argument.name,
    };
};

const replacer = ({}, path) => {
    const {left} = path.node;
    
    if (!isCoercionCall(left) || !isTypeofOf(path.node.right, left.arguments[0].name, OBJECT))
        return path;
    
    const [argument] = left.arguments;
    
    const cast = {
        type: 'TSAsExpression',
        expression: argument,
        typeAnnotation: {
            type: 'TSBooleanKeyword',
        },
    };
    
    replaceWith(path.get('left'), cast);
    
    return path;
};

const CALL = 'Boolean(__a) && typeof __a === "object"';

export const report = () => 'Use the cast form, so the simplification cannot drop the coercion: `a as boolean && typeof a === "object"`';

export const match = () => ({
    [CALL]: matcher,
});

export const replace = () => ({
    [CALL]: replacer,
});
