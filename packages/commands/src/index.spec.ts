import {test} from 'supertape';
import * as commands from './index.ts';

test('index: exports the commands, the ast tools and the tree components', (t) => {
    const expected: string[] = [
        'AstCodePreview',
        'AstRow',
        'AstSearch',
        'AstStatus',
        'AstTree',
        'commands',
        'compactAST',
        'compilePlugin',
        'defaultCollapsed',
        'errorText',
        'filterNodes',
        'flattenAst',
        'parseCommand',
        'queryAST',
        'rowsOf',
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
        'useTreeState',
        'visibleRows',
        'withAncestors',
    ];
    
    const result = Object
        .keys(commands)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});
