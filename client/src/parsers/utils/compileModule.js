import {parse} from '@putout/engine-parser';
import putout from 'putout';
import pluginConvertEsmToCommonjs from '@putout/plugin-nodejs/convert-esm-to-commonjs';
import pluginConvertOptionalToLogical from '@putout/plugin-convert-optional-to-logical';
import pluginPutout from '@putout/plugin-putout';
import pluginDeclare from '@putout/plugin-declare';
import pluginTypes from '@putout/plugin-types';
import pluginDeclareBeforeReference from '@putout/plugin-declare-before-reference';
import pluginNodejs from '@putout/plugin-nodejs';
import pluginMergeDestructuringProperties from '@putout/plugin-merge-destructuring-properties';

import protect from '../utils/protectFromLoops';

export default function compileModule(code, globals = {}) {
    const exports = {};
    const module = {
        exports,
    };
    
    const keys = [
        'module',
        'exports',
        Object.keys(globals),
    ];
    
    const values = [
        module,
        exports,
        ...Object.values(globals),
    ];
    
    const result = putout(code, {
        fixCount: 10,
        plugins: [
            ['putout', pluginPutout],
            ['declare', pluginDeclare],
            ['types', pluginTypes],
            ['merge-destructuring-properties', pluginMergeDestructuringProperties],
            ['declare-declare-before-reference', pluginDeclareBeforeReference],
            ['convert-esm-to-commonjs', pluginConvertEsmToCommonjs],
            ['convert-optional-to-logical', pluginConvertOptionalToLogical],
            ['nodejs/declare-after-require', pluginNodejs.rules['declare-after-require']],
        ],
    });
    const safeCode = protect(result.code);
    
    new Function(keys.join(), safeCode).apply(exports, values);
    return module.exports;
}

