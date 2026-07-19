import {test} from 'supertape';
import compileModule from './compileModule.js';

test('compileModule: compiles simple code returning an object', (t) => {
    const result = compileModule('module.exports = {a: 1}');
    const expected = {
        a: 1,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('compileModule: supports globals', (t) => {
    const result = compileModule('module.exports = typeof globalVar', {
        globalVar: 'hello',
    });
    
    t.equal(result, 'string');
    t.end();
});
