import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '#store';
import {getView} from '#editor';
import EditorSource from './index.js';

const recordActions = (actions) => () => (next) => (action) => {
    actions.push(action);
    
    return next(action);
};

function renderWithStore(overrides = {}) {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench,
        },
    };
    
    const actions = [];
    
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: revive(state),
        middleware: (getDefault) => getDefault({
            serializableCheck: false,
        }).prepend(recordActions(actions)),
    });
    
    render(
        <Provider store={store}>
            <EditorSource/>
        </Provider>,
    );
    
    return {
        store,
        actions,
    };
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
    const {store} = renderWithStore();
    
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
    const {store} = renderWithStore();
    
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

test('EditorSource: dispatches editorKeydown when key pressed', (t) => {
    const {actions} = renderWithStore();
    const view = getView(document.body);
    
    act(() => {
        fireEvent.keyDown(view.contentDOM, {
            key: 'Escape',
            code: 'Escape',
            bubbles: true,
            cancelable: true,
        });
    });
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/editorKeydown');
    
    t.ok(result);
    t.end();
});
