import {test} from 'supertape';
import {runSource} from './source.ts';

test('source: sets the source', (t) => {
    const result = runSource('const a = 1;');
    const expected = {
        type: 'source',
        data: 'const a = 1;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('source: no argument is an empty string, not an error', (t) => {
    const result = runSource('');
    const expected = {
        type: 'source',
        data: '',
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('source: a multiline body is kept whole', (t) => {
    const result = runSource('const a = 1;\nconst b = 2;');
    const expected = {
        type: 'source',
        data: 'const a = 1;\nconst b = 2;',
    };
    
    t.deepEqual(result, expected);
    t.end();
});
