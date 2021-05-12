import {parse} from '@putout/engine-parser';
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
    
    new Function(keys.join(), code).apply(exports, values);
    return module.exports;
}
