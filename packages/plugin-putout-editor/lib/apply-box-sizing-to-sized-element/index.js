import {operator} from 'putout';
import * as applyBoxSizing from './apply-box-sizing/index.js';

const {matchFiles} = operator;

export const {
    report,
    scan,
    fix,
} = matchFiles({
    files: {
        '*.css': {
            plugins: [
                ['apply-box-sizing', applyBoxSizing],
            ],
        },
    },
});
