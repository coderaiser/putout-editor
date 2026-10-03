import {test} from 'supertape';
import {runConsole} from './console.ts';

test('console: opening says so', (t) => {
    const result = runConsole(true);
    const expected = {
        type: 'text',
        data: 'Console opened',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('console: closing says so', (t) => {
    const result = runConsole(false);
    const expected = {
        type: 'text',
        data: 'Console closed',
    };
    
    t.deepEqual(result, expected);
    t.end();
});
