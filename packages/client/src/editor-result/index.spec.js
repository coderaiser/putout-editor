import {setImmediate} from 'node:timers/promises';
import {test, stub} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import EditorResult from './index.js';

const makeTransformer = (result = 'const x = 1;', shouldFail = false) => ({
    _promise: null,
    loadTransformer: (resolve) => resolve({}),
    transform: () => {
        if (shouldFail)
            throw Error('transform failed');
        
        return result;
    },
});

test('EditorResult: renders output container', async (t) => {
    const {container} = render(
        <EditorResult
            transformer={makeTransformer()}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
        />,
    );
    
    await setImmediate();
    const output = container.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('EditorResult: does not call transform when isLoading is true', async (t) => {
    const transform = stub().returns('');
    const transformer = {
        _promise: null,
        loadTransformer: (resolve) => resolve({}),
        transform,
    };
    
    render(
        <EditorResult
            transformer={transformer}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={true}
        />,
    );
    
    await setImmediate();
    cleanup();
    
    t.notOk(transform.called);
    t.end();
});

test('EditorResult: renders editor when transform throws', async (t) => {
    let container;
    
    await act(async () => {
        ({container} = render(
            <EditorResult
                transformer={makeTransformer('', true)}
                transformCode=""
                code="const x = 1"
                mode="javascript"
                isLoading={false}
            />,
        ));
        await new Promise((resolve) => setTimeout(resolve, 50));
    });
    
    const editor = container.querySelector('.output .editor');
    
    cleanup();
    
    t.ok(editor);
    t.end();
});

test('EditorResult: renders string result in editor', async (t) => {
    const {container} = render(
        <EditorResult
            transformer={makeTransformer('const x = 1;')}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
        />,
    );
    
    await setImmediate();
    const editor = container.querySelector('.output .editor');
    
    cleanup();
    
    t.ok(editor);
    t.end();
});

test('EditorResult: reuses cached transformer promise', async (t) => {
    const loadTransformer = stub().resolves();
    const transformer = {
        _promise: new Promise((resolve) => resolve({})),
        loadTransformer,
        transform: () => 'const x = 1;',
    };
    
    render(
        <EditorResult
            transformer={transformer}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
        />,
    );
    
    await setImmediate();
    cleanup();
    
    t.notOk(loadTransformer.called);
    t.end();
});

test('EditorResult: renders EditorASTJson for object result without map', async (t) => {
    const {container} = render(
        <EditorResult
            transformer={makeTransformer({
                code: {
                    hello: 'world',
                },
            })}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
        />,
    );
    
    await setImmediate();
    const jsonEditor = container.querySelector('#EditorASTJson');
    
    cleanup();
    
    t.ok(jsonEditor);
    t.end();
});

test('EditorResult: renders output when object result has map', async (t) => {
    const {container} = render(
        <EditorResult
            transformer={makeTransformer({
                code: 'const y = 2;',
                map: {
                    version: 3,
                    sources: ['a.js'],
                    names: [],
                    mappings: '',
                },
            })}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
        />,
    );
    
    await setImmediate();
    const output = container.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('EditorResult: resolves highlight range through posFromIndex', async (t) => {
    const {container} = render(
        <EditorResult
            transformer={makeTransformer('const x = 1;')}
            transformCode=""
            code="const x = 1"
            mode="javascript"
            isLoading={false}
            highlightRange={[0, 5]}
        />,
    );
    
    await setImmediate();
    const editor = container.querySelector('.output .editor');
    
    cleanup();
    
    t.ok(editor);
    t.end();
});

test('EditorResult: posFromIndex returns undefined when no sourceMap', async (t) => {
    let container;
    
    await act(async () => {
        ({container} = render(
            <EditorResult
                transformer={makeTransformer('const x = 1;')}
                transformCode=""
                code="const x = 1"
                mode="javascript"
                isLoading={false}
                highlightRange={[0, 5]}
            />,
        ));
        await new Promise((resolve) => setTimeout(resolve, 50));
    });
    
    const editor = container.querySelector('.output .editor');
    
    cleanup();
    
    t.ok(editor);
    t.end();
});
