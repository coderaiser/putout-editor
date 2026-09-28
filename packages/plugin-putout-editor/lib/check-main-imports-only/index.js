import {operator} from 'putout';

const {matchFiles} = operator;

const MAIN = 'main.css';

export const {scan, fix} = matchFiles({
    files: {
        'main.css': {
            plugins: [
                ['check-main-imports-only', {
                    report: () => `${MAIN} is an entry point: @import only`,
                    match: () => ({
                        rule: () => true,
                    }),
                    replace: () => ({
                        rule: (vars, path) => path,
                    }),
                }],
            ],
        },
    },
});

export const report = (_, {message, inputFilename}) => `☝️ ${inputFilename}: ${message}`;
