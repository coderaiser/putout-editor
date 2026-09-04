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
import EditorPlugin from './index.js';

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
            transform: {
                ...base.workbench.transform,
                ...overrides.workbench?.transform,
            },
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
    
    return {
        actions,
        store,
    };
}

function renderTransformer(store) {
    const {container} = render(
        <Provider store={store}>
            <EditorPlugin/>
        </Provider>,
    );
    
    return container;
}

test('EditorPlugin: renders transform code from store', (t) => {
    const {store} = renderWithStore({
        workbench: {
            transform: {
                code: 'const a = 1;',
            },
        },
    });
    
    const container = renderTransformer(store);
    const view = getView(container);
    const result = view.state.doc.toString();
    
    cleanup();
    
    t.equal(result, 'const a = 1;');
    t.end();
});

test('EditorPlugin: dispatches setTransformState when editor content changes', async (t) => {
    const {store} = renderWithStore();
    const container = renderTransformer(store);
    
    await act(async () => {
        const view = getView(container);
        
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
    
    const result = store.getState().workbench.transform.code;
    
    t.equal(result, 'hello');
    t.end();
});

test('EditorPlugin: dispatches transformBlur when editor blurs', (t) => {
    const {actions, store} = renderWithStore();
    const container = renderTransformer(store);
    const view = getView(container);
    
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/transformBlur');
    
    t.ok(result);
    t.end();
});

test('EditorPlugin: renders output pane when store transformer is unknown', async (t) => {
    const {store} = renderWithStore({
        loadingSnippet: true,
        workbench: {
            transform: {
                transformer: 'nope',
            },
        },
    });
    
    const container = renderTransformer(store);
    
    await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
    });
    
    const output = container.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});
