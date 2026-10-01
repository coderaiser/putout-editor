import {test} from 'supertape';
import * as commands from './index.ts';

test('index: exports the moved modules and the ast tools', (t) => {
    const expected: string[] = [
        'compactAST',
        'compilePlugin',
        'errorText',
        'flattenAst',
        'parseCommand',
        'queryAST',
        'text',
    ];
    
    const result = Object
        .keys(commands)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});
