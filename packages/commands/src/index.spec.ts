import {test} from 'supertape';
import * as commands from './index.ts';

test('index: exports the moved modules, the ast tools and the commands', (t) => {
    const expected: string[] = [
        'commands',
        'compactAST',
        'compilePlugin',
        'errorText',
        'flattenAst',
        'parseCommand',
        'queryAST',
        'runAst',
        'runClear',
        'runConsole',
        'runFind',
        'runHelp',
        'runNamePattern',
        'runReset',
        'runSource',
        'runTestPattern',
        'runTransform',
        'runValidate',
        'text',
    ];
    
    const result = Object
        .keys(commands)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});
