import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {
    configureStore,
    type Middleware,
    type UnknownAction,
} from '@reduxjs/toolkit';
import {getView} from '#editor';
import {
    putoutEditor,
    revive,
    type RootState,
    type WorkbenchState,
    type TransformState,
} from '#store';
import EditorPlugin from './index.tsx';

const recordActions = (actions: UnknownAction[]): Middleware => () => (next) => (action) => {
    actions.push(action as UnknownAction);
    
    return next(action);
};

type Overrides = Omit<Partial<RootState>, 'workbench'> & {
    workbench?: Partial<Omit<WorkbenchState, 'transform'>> & {
        transform?: Partial<TransformState>;
    };
};

function renderWithStore(overrides: Overrides = {}) {
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
    
    const actions: UnknownAction[] = [];
    
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

function renderTransformer(store: ReturnType<typeof renderWithStore>['store']) {
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
    const view = getView(container)!;
    const result = view.state.doc.toString();
    
    cleanup();
    
    t.equal(result, 'const a = 1;');
    t.end();
});

test('EditorPlugin: dispatches setTransformState when editor content changes', async (t) => {
    const {store} = renderWithStore();
    const container = renderTransformer(store);
    
    await act(async () => {
        const view = getView(container)!;
        
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
    const view = getView(container)!;
    
    view.contentDOM.dispatchEvent(new FocusEvent('blur'));
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/transformBlur');
    
    t.ok(result);
    t.end();
});

test('EditorPlugin: renders plugin editor without SplitPane', (t) => {
    const {store} = renderWithStore();
    const container = renderTransformer(store);
    
    const editor = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(editor);
    t.end();
});
