import {test} from 'supertape';
import {runClear} from './clear.ts';

test('clear: returns empty text, which clears the thread', (t) => {
    const result = runClear();
    const expected = {
        type: 'text',
        data: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});
