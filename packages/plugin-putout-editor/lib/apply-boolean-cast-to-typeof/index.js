import {operator} from 'putout';

const {replaceWith} = operator;

const matcher = ({}, path) => ({
    name: path.node.left.arguments[0].name,
});

const replacer = ({}, path) => {
    const [argument] = path.node.left.arguments;
    
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
