import {types} from 'putout';

const {
    isStringLiteral,
    isNumericLiteral,
} = types;

const matcher = ({__a, __b}) => isStringLiteral(__a) && __a.value === 'z-index' && isNumericLiteral(__b);

const replacer = ({__b}, path) => {
    __b.value = `var(--z-${__b.value})`;
    
    return path;
};

export const report = () => 'z-index belongs in tokens.css, reach for a var() instead';

export const match = () => ({
    'declaration(__a, __b)': matcher,
});

export const replace = () => ({
    'declaration(__a, __b)': replacer,
});
