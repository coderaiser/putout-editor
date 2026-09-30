import {types} from 'putout';

const {
    isIdentifier,
    isBlockStatement,
} = types;

const METHODS = [
    'every',
    'filter',
    'find',
    'findIndex',
    'findLast',
    'flatMap',
    'forEach',
    'map',
    'reduce',
    'reduceRight',
    'some',
    'sort',
];

const isHoistable = ({__a}, path) => {
    if (!isIdentifier(__a))
        return false;
    
    const [argument] = path.node.arguments;
    const {body} = argument;
    
    return !isBlockStatement(body);
};

const withMethod = (method) => `__.${method}((__a) => __b)`;

const toPairs = (to) => (method) => [withMethod(method), to(method)];

const buildKeys = (to) => Object.fromEntries(METHODS.map(toPairs(to)));

export const report = () => 'Move the arrow callback to a top level declaration';

export const match = () => buildKeys(() => isHoistable);

export const replace = () => buildKeys(withMethod);
