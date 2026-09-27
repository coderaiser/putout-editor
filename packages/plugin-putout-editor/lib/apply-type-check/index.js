import {types} from 'putout';

const {isStringLiteral} = types;
const {fromEntries} = Object;

// `node.type === 'CallExpression'` says the same thing as `isCallExpression(node)`
// in fewer characters, and the `is*` helpers live in `types` where they are tested
// once instead of in every rule that needs a node kind.
const TYPE = 'type';

const PATTERNS = [
    '__a.type === __b',
    '__a?.type === __b',
    '__b === __a.type',
    '__b === __a?.type',
    '__a.type !== __b',
    '__a?.type !== __b',
    '__b !== __a.type',
    '__b !== __a?.type',
];

const isNegated = (pattern) => pattern.includes('!==');

// only rewrite to a helper that actually exists. This is the whole safety argument:
// `action.type === 'snippet/save'` has no `issnippet/save`, and `types.is()` is not
// that check, so the existence of the helper is what decides.
const known = (type) => typeof types[`is${type}`] === 'function';

const typeOf = (node) => isStringLiteral(node) && known(node.value)
    ? node.value
    : null;

const matcher = () => ({__b}) => Boolean(typeOf(__b));

const replacer = (pattern) => ({__b}) => {
    const type = typeOf(__b);
    const [not] = isNegated(pattern)
        ? ['!']
        : [''];
    
    return `${not}is${type}(__a)`;
};

export const report = () => `Prefer the 'is' check from 'types' over a '.${TYPE}' comparison`;

export const match = () => fromEntries(PATTERNS.map((a) => [a, matcher()]));

export const replace = () => fromEntries(PATTERNS.map((a) => [a, replacer(a)]));
