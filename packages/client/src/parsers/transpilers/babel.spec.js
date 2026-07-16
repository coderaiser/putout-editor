import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import transpile from './babel.js';

test('babel: transpile: obvious infinite loop: throws', async (t) => {
    const [error] = await tryToCatch(transpile, 'while(true){}');
    
    t.ok(error);
    t.end();
});

test('babel: transpile: code with loop: returns code with guard injected', (t) => {
    const result = transpile('for(let i=0;i<10;i++){}');
    
    t.ok(result.includes('Infinite loop detected on line'));
    t.end();
});

test('babel: transpile: code without loops: returns code unchanged', (t) => {
    const input = 'var x = 1;';
    const result = transpile(input);
    
    t.equal(result, input);
    t.end();
});
