import {test} from 'supertape';
import {ParseResult} from './ParseResult.js';

test('ParseResult: has expected shape', (t) => {
    const expected = {
        ast: 'any',
        error: 'Object',
        time: 'number',
        treeAdapter: {
            type: 'string',
            options: 'Object',
        },
    };
    
    t.deepEqual(ParseResult, expected);
    t.end();
});
