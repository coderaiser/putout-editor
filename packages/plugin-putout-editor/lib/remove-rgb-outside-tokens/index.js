import {operator} from 'putout';

const {matchFiles} = operator;
const {fromEntries} = Object;

// css is js: @putout/processor-css runs happy-style, so `rgb(0 0 0 / 20%)` is
// functionValue('rgb', [...]) and `#ff0000` is color('#ff0000'). A var() is
// functionValue('var', [...]), which is what these files should be using instead.
const PATTERNS = [
    'functionValue("rgb", __a)',
    'functionValue("rgba", __a)',
    'color(__a)',
];

// match() needs a function per pattern, replace() accepts the pattern as a string -
// and a replacement that prints the node back unchanged is what makes this a
// report-only rule: a plugin needs an action for the loader to recognise its type,
// and deciding which token a colour becomes is a human call, not a safe fix.
const matches = () => fromEntries(PATTERNS.map((a) => [a, () => true]));
const replaces = () => fromEntries(PATTERNS.map((a) => [a, a]));

const checkColours = {
    report: () => 'colours belong in tokens.css, reach for a var() instead',
    match: matches,
    replace: replaces,
};

export const {scan, fix} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['remove-rgb-outside-tokens', checkColours],
            ],
        },
    },
    exclude: ['tokens.css'],
});

// redlint reports the position inside the synthetic .filesystem.json, so without
// the filename in the message the finding does not say which file to open
export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;
