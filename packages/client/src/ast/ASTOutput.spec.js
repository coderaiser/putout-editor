import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ASTOutput from './ASTOutput.js';
import {putoutEditor, revive} from '../store/reducers.ts';

function renderWithStore(overrides = {}) {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench || {},
        },
    };
    
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: revive(state),
    });
    
    render(
        <Provider store={store}>
            <ASTOutput/>
        </Provider>,
    );
    
    return store;
}

test('ASTOutput: renders output element', (t) => {
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
    
    const output = document.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('ASTOutput: renders error message from store', (t) => {
    renderWithStore({
        workbench: {
            parseResult: {
                ast: null,
                error: {
                    message: 'parse failed',
                },
                time: 0,
            },
        },
    });
    
    const output = document.querySelector('.output');
    const result = output.textContent.includes('parse failed');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ASTOutput: renders time from store', (t) => {
    renderWithStore({
        workbench: {
            parseResult: {
                ast: null,
                error: null,
                time: 1500,
            },
        },
    });
    
    const time = document.querySelector('.time');
    const result = time.textContent;
    
    cleanup();
    
    t.equal(result, '1.50s');
    t.end();
});
