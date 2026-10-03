import {test} from 'supertape';
import {runReset} from './reset.ts';

test('reset: says it reset', (t) => {
    const result = runReset();
    const expected = {
        type: 'text',
        data: 'Reset',
    };
    
    t.deepEqual(result, expected);
    t.end();
});
