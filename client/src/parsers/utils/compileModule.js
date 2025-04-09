import {parse} from '@putout/engine-parser';
import putout from 'putout';
import * as pluginConvertEsmToCommonjs from '@putout/plugin-nodejs/convert-esm-to-commonjs';
import * as pluginOptionalChaining from '@putout/plugin-optional-chaining';
import * as pluginPutout from '@putout/plugin-putout';
import * as pluginDeclare from '@putout/plugin-declare';
import * as pluginTypes from '@putout/plugin-types';
import * as pluginDeclareBeforeReference from '@putout/plugin-declare-before-reference';
import * as pluginNodejs from '@putout/plugin-nodejs';
import * as pluginMergeDestructuringProperties from '@putout/plugin-merge-destructuring-properties';
import * as pluginMaybe from '@putout/plugin-maybe';
import * as pluginConvertConstToLet from '@putout/plugin-convert-const-to-let';
import * as pluginExtractKeywordsFromVariables from '@putout/plugin-extract-keywords-from-variables';

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
            ['convert-const-to-let', pluginConvertConstToLet],
            ['declare', pluginDeclare],
            ['declare-before-reference', pluginDeclareBeforeReference],
            ['extract-keywords-from-variables', pluginExtractKeywordsFromVariables],
            ['putout', pluginPutout],
            ['maybe', pluginMaybe],
            ['types', pluginTypes],
            ['merge-destructuring-properties', pluginMergeDestructuringProperties],
            ['convert-esm-to-commonjs', pluginConvertEsmToCommonjs],
            ['optional-chaining', pluginOptionalChaining],
            ['nodejs/declare-after-require', pluginNodejs.rules['declare-after-require']],
        ],
    });
    const safeCode = protect(result.code);
    
    new Function(keys.join(), safeCode).apply(exports, values);
    return module.exports;
}

