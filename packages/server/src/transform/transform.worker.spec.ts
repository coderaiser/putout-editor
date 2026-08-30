import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import runTransform from './transform.worker.ts';

const replaceVarWithConst = `
export const report = () => 'use const';
export const replace = () => ({
    'var __x = __y': 'const __x = __y',
});
`;

test('transform worker: transforms fixture with replace rule', (t) => {
    const {code} = runTransform({
        fixture: 'var x = 1;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(code, 'const x = 1;');
    t.end();
});

test('transform worker: returns unchanged code when rule does not match', (t) => {
    const {code} = runTransform({
        fixture: 'const x = 1;',
        plugin: replaceVarWithConst,
    });
    
    t.equal(code, 'const x = 1;');
    t.end();
});

test('transform worker: throws on invalid plugin syntax', async (t) => {
    const [error] = await tryToCatch(runTransform, {
        fixture: 'const x = 1;',
        plugin: 'export const = broken',
    });
    
    t.ok(error);
    t.end();
});

test('transform worker: throws on plugin runtime error', async (t) => {
    const throwingPlugin = `
export const report = () => 'use const';
export const replace = () => {
    throw new Error('intentional error');
};
`;
    
    const [error] = await tryToCatch(runTransform, {
        fixture: 'const x = 1;',
        plugin: throwingPlugin,
    });
    
    t.ok(error);
    t.end();
});

test('transform worker: handles traverse rule', (t) => {
    const removeDebugger = `
export const report = () => 'remove debugger';
export const traverse = () => ({
    'debugger'(path) {
        path.remove();
    },
});
`;
    
    const {code} = runTransform({
        fixture: 'debugger;\nconst x = 1;',
        plugin: removeDebugger,
    });
    
    const result = code.includes('debugger');
    
    t.notOk(result);
    t.end();
});
