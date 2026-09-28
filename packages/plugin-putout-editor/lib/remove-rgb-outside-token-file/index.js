import {operator} from 'putout';
import * as removeRgb from './remove-rgb/index.js';

const {matchFiles} = operator;

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;

export const {scan, fix} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['remove-rgb', removeRgb],
            ],
        },
    },
    exclude: ['tokens.css'],
});
