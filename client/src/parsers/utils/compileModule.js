import {parse} from '@putout/engine-parser';
import putout from 'putout';
import convertEsmToCommonjs from '@putout/plugin-convert-esm-to-commonjs';
import parser from '@putout/engine-parser/lib/parsers/babel';

import protect from '../utils/protectFromLoops';

export default function compileModule(code, globals = {}) {
    const exports = {};
    const module = {
        exports,
    };
    const keys = ['module', 'exports', Object.keys(globals)];
    const values = [module, exports, ...Object.values(globals)];
    
    const safeCode = protect(code);
    parse(safeCode, {
        parser,
        isTS: true,
        isJSX: true,
    });
    
    const result = putout(safeCode, {
        plugins: [
            ['convert-esm-to-commonjs', convertEsmToCommonjs],
        ],
    });
    
    new Function(keys.join(), result.code).apply(exports, values);
    return module.exports;
}
