import {test} from 'supertape';
import * as commands from './index.ts';

test('index: exports the moved modules and the ast flattener', (t) => {
    const expected: string[] = [
        'compactAST',
        'compilePlugin',
        'errorText',
        'flattenAst',
        'queryAST',
        'text',
    ];
    
    const result = Object
        .keys(commands)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});
