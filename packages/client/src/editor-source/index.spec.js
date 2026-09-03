import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '#store';
import {getView} from '#editor';
import EditorSource from './index.js';

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
            <EditorSource/>
        </Provider>,
    );
    
    return store;
}

test('EditorSource: renders editor container', (t) => {
    renderWithStore();
    
    const result = document.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('EditorSource: renders value from store', (t) => {
    renderWithStore({
        workbench: {
            code: 'const a = 1;',
        },
    });
    
    const view = getView(document.body);
    const result = view.state.doc.toString();
    
    cleanup();
    
    t.equal(result, 'const a = 1;');
    t.end();
});

test('EditorSource: dispatches setCode when editor content changes', async (t) => {
    const store = renderWithStore();
    
    await act(async () => {
        const view = getView(document.body);
        
        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: 'hello',
            },
        });
        
        await new Promise((resolve) => setTimeout(resolve, 250));
    });
    
    cleanup();
    
    const result = store.getState().workbench.code;
    
    t.equal(result, 'hello');
    t.end();
});

test('EditorSource: dispatches setCursor when cursor moves', async (t) => {
    const store = renderWithStore();
    
    await act(async () => {
        const view = getView(document.body);
        
        view.dispatch({
            selection: {
                anchor: 3,
            },
        });
        
        await new Promise((resolve) => setTimeout(resolve, 150));
    });
    
    cleanup();
    
    const {cursor} = store.getState();
    
    t.equal(cursor, 3);
    t.end();
});

test('EditorSource: dispatches editorBlur when editor blurs', (t) => {
    const store = renderWithStore();
    const view = getView(document.body);
    
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    
    cleanup();
    
    const result = store.getState().workbench.cursor;
    
    t.notOk(result);
    t.end();
});
