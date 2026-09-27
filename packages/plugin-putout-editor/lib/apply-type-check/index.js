import {types} from 'putout';

const {isStringLiteral} = types;
const {fromEntries} = Object;

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

const isTypeCheck = (node) => isStringLiteral(node) && Boolean(types[`is${node.value}`]);

const matcher = () => ({__b}) => isTypeCheck(__b);

const replacer = (pattern) => ({__b}) => {
    const not = pattern.includes('!==')
        ? '!'
        : '';
    
    return `${not}is${__b.value}(__a)`;
};

export const report = () => `Prefer the 'is' check from 'types' over a '.type' comparison`;

export const match = () => fromEntries(PATTERNS.map((a) => [a, matcher()]));

export const replace = () => fromEntries(PATTERNS.map((a) => [a, replacer(a)]));
