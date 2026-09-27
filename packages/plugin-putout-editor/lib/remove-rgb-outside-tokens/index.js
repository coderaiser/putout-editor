import {operator} from 'putout';

const {matchFiles} = operator;
const {fromEntries} = Object;

const PATTERNS = [
    'functionValue("rgb", __a)',
    'functionValue("rgba", __a)',
    'color(__a)',
];

const matches = () => fromEntries(PATTERNS.map((a) => [a, () => true]));

const replaces = () => fromEntries(PATTERNS.map((a) => [a, a]));

export const {scan, fix} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['remove-rgb-outside-tokens', {
                    report: () => 'colours belong in tokens.css, reach for a var() instead',
                    match: matches,
                    replace: replaces,
                }],
            ],
        },
    },
    exclude: ['tokens.css'],
});

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;
