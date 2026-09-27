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

// a scanner sees a filesystem, not a source string. This is the same simple json
// representation redlint builds and then converts - see
// @putout/plugin-filesystem/lib/convert-simple-filesystem-to-filesystem - so the
// filesystem rules are exercised the way they actually run: ['/', ['/name', content]]
export const filesystem = (files) => `__putout_processor_filesystem(${JSON.stringify(files)})`;

export const scanFilesystem = (files, plugin) => putout(filesystem(files), {
    fix: false,
    plugins: [
        ['filesystem', plugin],
    ],
});

export const putoutFilesystem = async (files, plugin) => putout(filesystem(files), {
    fixCount: 1,
    plugins: [
        ['filesystem', plugin],
    ],
});
