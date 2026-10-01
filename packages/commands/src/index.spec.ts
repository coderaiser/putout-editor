import {test} from 'supertape';
import * as commands from './index.ts';

test('index: exports the four moved modules', (t) => {
    const expected: string[] = [
        'compactAST',
        'compilePlugin',
        'errorText',
        'queryAST',
        'text',
    ];
    
    const result = Object
        .keys(commands)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});
