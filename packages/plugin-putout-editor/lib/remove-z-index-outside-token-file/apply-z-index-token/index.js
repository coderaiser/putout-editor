import {types} from 'putout';

const {
    isStringLiteral,
    isNumericLiteral,
} = types;

export const report = () => 'z-index belongs in tokens.css, reach for a var() instead';

export const match = () => ({
    'declaration(__a, __b)': ({__a, __b}) => isStringLiteral(__a) && __a.value === 'z-index' && isNumericLiteral(__b),
});

export const replace = () => ({
    'declaration(__a, __b)': ({__b}, path) => {
        __b.value = `var(--z-${__b.value})`;
        
        return path;
    },
});
