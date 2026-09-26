import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {makeStore, type StoreOverrides} from '#test/store';
import EditorASTTree from './index.tsx';

function renderWithStore(overrides: StoreOverrides = {}) {
    const {store} = makeStore(overrides);
    
    render(
        <Provider store={store}>
            <EditorASTTree/>
        </Provider>,
    );
    
    return store;
}

test('EditorASTTree: renders output element', (t) => {
    renderWithStore({
        workbench: {
            parseResult: {
                ast: null,
                error: null,
                time: 0,
                treeAdapter: {
                    type: 'estree',
                    options: {},
                },
            },
        },
    });
    
    const output = document.querySelector('.output')!;
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('EditorASTTree: renders error message from store', (t) => {
    renderWithStore({
        workbench: {
            parseResult: {
                ast: null,
                error: Error('parse failed'),
                time: 0,
            },
        },
    });
    
    const output = document.querySelector('.output')!;
    const result = output.textContent.includes('parse failed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorASTTree: renders time from store', (t) => {
    renderWithStore({
        workbench: {
            parseResult: {
                ast: null,
                error: null,
                time: 1500,
            },
        },
    });
    
    const time = document.querySelector('.time')!;
    const result = time.textContent;
    
    cleanup();
    
    t.equal(result, '1.50s');
    t.end();
});
