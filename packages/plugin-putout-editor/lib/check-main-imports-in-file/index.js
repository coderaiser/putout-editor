import {operator} from 'putout';
import * as checkImportsOnly from './check-imports-only/index.js';

const {matchFiles} = operator;

export const {
    report,
    scan,
    fix,
} = matchFiles({
    files: {
        'main.css': {
            plugins: [
                ['check-imports-only', checkImportsOnly],
            ],
        },
    },
});
