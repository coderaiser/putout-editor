import {test} from 'supertape';
import {ParseResult} from './ParseResult.tsx';

test('ParseResult: has expected shape', (t) => {
    const expected = {
        ast: 'AstNode',
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
