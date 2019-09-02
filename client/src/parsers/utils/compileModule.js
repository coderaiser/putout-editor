import {parse} from 'putout/dist/putout';
import protect from '../utils/protectFromLoops';

export default function compileModule(code, globals = {}) {
    const exports = {};
    const module = { exports };
    const globalNames = Object.keys(globals);
    const keys = ['module', 'exports', ...globalNames];
    const values = [module, exports, ...globalNames.map((key) => globals[key])];
    
    const safeCode = protect(code);
    parse(safeCode);
    
    new Function(keys.join(), code).apply(exports, values);
    return module.exports;
}
