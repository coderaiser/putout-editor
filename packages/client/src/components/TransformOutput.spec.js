import {setImmediate} from 'node:timers/promises';
import {test, stub} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import TransformOutput from './TransformOutput.js';

const makeTransformer = (result = 'const x = 1;', shouldFail = false) => ({
    _promise: null,
    loadTransformer: (resolve) => resolve({}),
    transform: () => {
        if (shouldFail)
            throw Error('transform failed');
        
        return result;
    },
});

test('TransformOutput: renders output container', async (t) => {
    const {container} = render(
        <TransformOutput
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

test('TransformOutput: does not call transform when isLoading is true', async (t) => {
    const transform = stub().returns('');
    const transformer = {
        _promise: null,
        loadTransformer: (resolve) => resolve({}),
        transform,
    };
    
    render(
        <TransformOutput
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

test('TransformOutput: renders editor when transform throws', async (t) => {
    const {container} = render(
        <TransformOutput
            transformer={makeTransformer('', true)}
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

test('TransformOutput: renders string result in editor', async (t) => {
    const {container} = render(
        <TransformOutput
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

test('TransformOutput: reuses cached transformer promise', async (t) => {
    const loadTransformer = stub().resolves();
    const transformer = {
        _promise: new Promise((resolve) => resolve({})),
        loadTransformer,
        transform: () => 'const x = 1;',
    };
    
    render(
        <TransformOutput
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

test('TransformOutput: renders JSONEditor for object result without map', async (t) => {
    const {container} = render(
        <TransformOutput
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
    const jsonEditor = container.querySelector('#JSONEditor');
    
    cleanup();
    
    t.ok(jsonEditor);
    t.end();
});

test('TransformOutput: renders output when object result has map', async (t) => {
    const {container} = render(
        <TransformOutput
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

test('TransformOutput: resolves highlight range through posFromIndex', async (t) => {
    const {container} = render(
        <TransformOutput
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
