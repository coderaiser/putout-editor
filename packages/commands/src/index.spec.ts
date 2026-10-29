import {test} from 'supertape';
import * as api from './index.ts';

const isString = (a: unknown): a is string => typeof a === 'string';

test('index: exports the commands, the ast tools and the tree components', (t) => {
    const expected: string[] = [
        'commands',
        'compactAST',
        'curriculum',
        'errorText',
        'findLearnNode',
        'flattenAst',
        'flattenLearn',
        'learnNodes',
        'needsPutout',
        'notInBrowser',
        'parseCommand',
        'queryAST',
        'runAst',
        'runClear',
        'runConsole',
        'runHelp',
        'runLearn',
        'runNamePattern',
        'runReset',
        'runSource',
        'runTestPattern',
        'text',
    ];
    
    const result = Object
        .keys(api)
        .sort();
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The barrel must not export `compilePlugin`: its module loads 🐊Putout,
 * which calls `os.homedir()` on load and stops the chat page. The mcp uses
 * the subpath `@putout/editor-commands/plugin`.
 */
test('index: does not re-export compilePlugin, which drags in putout', (t) => {
    const result = 'compilePlugin' in api;
    
    t.notOk(result);
    t.end();
});

/**
 * The barrel must stay free of React. This package is a Node library — the mcp
 * uses the commands and has no DOM — so a component exported here would put
 * React and `@testing-library` into every Node consumer's graph. The tree lives
 * in `packages/chat/src/components/`; this asserts it has not come back.
 */
test('index: exports no React component', (t) => {
    const components = Object
        .keys(api)
        .filter((name) => /^(Ast|use)/.test(name));
    
    const expected: string[] = [];
    
    t.deepEqual(components, expected);
    t.end();
});

/**
 * `curriculum` is in the browser bundle, so its module must import nothing.
 * An import there gives a blank page.
 */
test('index: curriculum is a plain tree, with nothing to import', (t) => {
    const [root] = api.curriculum;
    
    const result = {
        isArray: Array.isArray(api.curriculum),
        hasId: isString(root.id),
        hasChildren: Array.isArray(root.children),
    };
    
    const expected = {
        isArray: true,
        hasId: true,
        hasChildren: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

/**
 * The three learn helpers are re-exported rather than reached by deep path.
 *
 * `packages/chat` renders the tree and `packages/mcp` answers `learn_node`; both
 * import `@putout/editor-commands`. A deep subpath would work and would make
 * each consumer name a file inside this package, which is the coupling the
 * barrel exists to prevent.
 */
test('index: exports the learn helpers the chat and the mcp both use', (t) => {
    const result = [
        typeof api.flattenLearn,
        typeof api.findLearnNode,
        typeof api.learnNodes,
        typeof api.runLearn,
    ];
    
    const expected = [
        'function',
        'function',
        'function',
        'function',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});
