import {operator} from 'putout';
import * as checkImportsOnly from './check-imports-only/index.js';

const {matchFiles} = operator;

export const {scan, fix} = matchFiles({
    files: {
        'main.css': {
            plugins: [
                ['check-imports-only', checkImportsOnly],
            ],
        },
    },
});

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;
