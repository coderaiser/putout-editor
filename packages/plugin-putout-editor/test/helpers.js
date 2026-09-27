import putout from 'putout';
import {rules} from '../lib/index.js';

export const plugins = Object.entries(rules);

export const lint = (source) => putout(source, {
    fix: false,
    plugins,
});

export const fix = (source) => putout(source, {
    fixCount: 1,
    plugins,
});
