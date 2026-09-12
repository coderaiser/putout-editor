import {setImmediate} from 'node:timers/promises';
import {test, stub} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import EditorResult from '#editor-code';

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

test('EditorResult: renders codeframe when transform throws SyntaxError with loc', async (t) => {
    const syntaxError = Object.assign(new SyntaxError('Unexpected token'), {
        loc: {
            line: 1,
            column: 0,
        },
    });
    
    const transformer = {
        _promise: null,
        loadTransformer: (resolve) => resolve({}),
        transform: () => {
            throw syntaxError;
        },
    };
    
    let container;
    
    await act(async () => {
        ({container} = render(
            <EditorResult
                transformer={transformer}
                transformCode="const x ="
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
