import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import protect from './protectFromLoops.js';

test('protectFromLoops: obvious infinite loop: throws', async (t) => {
    const [error] = await tryToCatch(protect, 'while(true){}');
    
    t.ok(error);
    t.end();
});

test('protectFromLoops: code with loop: returns code with guard injected', (t) => {
    const result = protect('for(let i=0;i<10;i++){}');
    
    t.match(result, 'Infinite loop detected on line');
    t.end();
});

test('protectFromLoops: code without loops: returns code unchanged', (t) => {
    const input = 'var x = 1;';
    const result = protect(input);
    
    t.equal(result, input);
    t.end();
});
