import putout from 'putout';
import * as pluginConvertEsmToCommonjs from '@putout/plugin-nodejs/convert-esm-to-commonjs';
import * as pluginOptionalChaining from '@putout/plugin-optional-chaining';
import * as pluginPutout from '@putout/plugin-putout';
import * as pluginDeclare from '@putout/plugin-declare';
import * as pluginTypes from '@putout/plugin-types';
import * as pluginDeclareBeforeReference from '@putout/plugin-declare-before-reference';
import * as pluginNodejs from '@putout/plugin-nodejs';
import * as pluginDestructuring from '@putout/plugin-destructuring';
import * as pluginMaybe from '@putout/plugin-maybe';
import * as pluginVariables from '@putout/plugin-variables';
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
            ['declare', pluginDeclare],
            ['declare-before-reference', pluginDeclareBeforeReference],
            ['destructuring/merge-properties', pluginDestructuring.rules['merge-properties']],
            ['variables/extract-keywords', pluginVariables.rules['extract-keywords']],
            ['putout', pluginPutout],
            ['maybe', pluginMaybe],
            ['types', pluginTypes],
            ['variables/convert-const-to-let', pluginVariables.rules['convert-const-to-let']],
            ['optional-chaining', pluginOptionalChaining],
            ['nodejs/declare-after-require', pluginNodejs.rules['declare-after-require']],
            ['nodejs/convert-esm-to-commonjs', pluginConvertEsmToCommonjs],
        ],
    });
    
    const safeCode = protect(result.code);
    
    new Function(keys.join(), safeCode).apply(exports, values);
    return module.exports;
}
