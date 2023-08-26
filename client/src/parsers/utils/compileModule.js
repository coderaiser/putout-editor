import {parse} from '@putout/engine-parser';
import babelParser from '@putout/engine-parser/babel';
import putout from 'putout';
import pluginConvertEsmToCommonjs from '@putout/plugin-convert-esm-to-commonjs';
import pluginPutout from '@putout/plugin-putout';
import pluginDeclare from '@putout/plugin-declare';
import pluginTypes from '@putout/plugin-types';
import pluginDeclareBeforeReference from '@putout/plugin-declare-before-reference';
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
    
    const safeCode = protect(code);
    
    parse(safeCode, {
        parser: babelParser,
        isTS: true,
        isJSX: true,
    });
    
    const result = putout(safeCode, {
        plugins: [
            ['putout', pluginPutout],
            ['declare', pluginDeclare],
            ['types', pluginTypes],
            ['declare-declare-before-reference', pluginDeclareBeforeReference],
            ['convert-esm-to-commonjs', pluginConvertEsmToCommonjs],
        ],
    });
    
    new Function(keys.join(), result.code).apply(exports, values);
    return module.exports;
}

