import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ConnectedEditor from './ConnectedEditor.js';
import {putoutEditor, revive} from '../store/reducers.ts';
import {getView} from './codemirror/index.js';

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
            <ConnectedEditor/>
        </Provider>,
    );
    
    return store;
}

test('ConnectedEditor: renders editor container', (t) => {
    renderWithStore();
    
    const result = document.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('ConnectedEditor: renders value from store', (t) => {
    const view = getView(document.body);
    const result = view.state.doc.toString();
    
    cleanup();
    
    t.equal(result, 'const a = 1;');
    t.end();
});

test('ConnectedEditor: dispatches setCode when editor content changes', async (t) => {
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

test('ConnectedEditor: dispatches setCursor when cursor moves', async (t) => {
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

test('ConnectedEditor: dispatches editorBlur when editor blurs', (t) => {
    const store = renderWithStore();
    const view = getView(document.body);
    
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    
    cleanup();
    
    const result = store.getState().workbench.cursor;
    
    t.notOk(result);
    t.end();
});
