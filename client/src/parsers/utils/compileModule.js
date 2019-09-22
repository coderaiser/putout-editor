import {parse} from '@putout/engine-parser';
import parser from '@putout/engine-parser/lib/parsers/babel';
import protect from '../utils/protectFromLoops';

export default function compileModule(code, globals = {}) {
    const exports = {};
    const module = { exports };
    const globalNames = Object.keys(globals);
    const keys = ['module', 'exports', ...globalNames];
    const values = [module, exports, ...globalNames.map((key) => globals[key])];
    
    const safeCode = protect(code);
    parse(safeCode, {
        parser,
    });
    
    new Function(keys.join(), code).apply(exports, values);
    return module.exports;
}
