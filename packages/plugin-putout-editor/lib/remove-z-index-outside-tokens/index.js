import {operator, types} from 'putout';

const {matchFiles} = operator;
const {
    isStringLiteral,
    isNumericLiteral,
} = types;

const PATTERN = 'declaration(__a, __b)';

const matcher = ({__a, __b}) => isStringLiteral(__a) && __a.value === 'z-index' && isNumericLiteral(__b);

const replacer = ({__b}, path) => {
    __b.value = `var(--z-${__b.value})`;
    
    return path;
};

export const {scan, fix} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['remove-z-index-outside-tokens', {
                    report: () => 'z-index belongs in tokens.css, reach for a var() instead',
                    match: () => ({
                        [PATTERN]: matcher,
                    }),
                    replace: () => ({
                        [PATTERN]: replacer,
                    }),
                }],
            ],
        },
    },
    exclude: ['tokens.css'],
});

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;
