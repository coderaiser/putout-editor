import {operator} from 'putout';
import * as applyZIndexToken from './apply-z-index-token/index.js';

const {matchFiles} = operator;

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;

export const {scan, fix} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['apply-z-index-token', applyZIndexToken],
            ],
        },
    },
    exclude: ['tokens.css'],
});
