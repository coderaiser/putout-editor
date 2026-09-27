import {types} from 'putout';

const {
    isCallExpression,
    isMemberExpression,
} = types;

const {fromEntries} = Object;

const PATTERNS = [
    '__a && __a.__b',
    '__a && __a.__b()',
];

const hasCall = (node) => isCallExpression(node) || isMemberExpression(node) && hasCall(node.object);

const matcher = ({__a}) => hasCall(__a);

export const report = () => 'Bind the left side to a local: && calls it twice';

export const match = () => fromEntries(PATTERNS.map((pattern) => [pattern, matcher]));

export const replace = () => fromEntries(PATTERNS.map((pattern) => [pattern, pattern]));
