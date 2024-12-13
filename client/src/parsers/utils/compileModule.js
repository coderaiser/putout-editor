import {parse} from '@putout/engine-parser';
import putout from 'putout';
import pluginConvertEsmToCommonjs from '@putout/plugin-nodejs/convert-esm-to-commonjs';
import pluginOptionalChaining from '@putout/plugin-optional-chaining';
import pluginPutout from '@putout/plugin-putout';
import pluginDeclare from '@putout/plugin-declare';
import pluginTypes from '@putout/plugin-types';
import pluginDeclareBeforeReference from '@putout/plugin-declare-before-reference';
import pluginNodejs from '@putout/plugin-nodejs';
import pluginMergeDestructuringProperties from '@putout/plugin-merge-destructuring-properties';
import pluginMaybe from '@putout/plugin-maybe';

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
            ['maybe', pluginMaybe],
            ['types', pluginTypes],
            ['merge-destructuring-properties', pluginMergeDestructuringProperties],
            ['declare-declare-before-reference', pluginDeclareBeforeReference],
            ['convert-esm-to-commonjs', pluginConvertEsmToCommonjs],
            ['optional-chaining', pluginOptionalChaining],
            ['nodejs/declare-after-require', pluginNodejs.rules['declare-after-require']],
        ],
    });
    const safeCode = protect(result.code);
    
    new Function(keys.join(), safeCode).apply(exports, values);
    return module.exports;
}

