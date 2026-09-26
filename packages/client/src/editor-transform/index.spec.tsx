import {test} from 'supertape';
import {
    render,
    cleanup,
    act,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {getView} from '#editor';
import {makeStore, type TestStore} from '#test/store';
import EditorPlugin from './index.tsx';

const renderWithStore = (overrides: Parameters<typeof makeStore>[0] = {}) => makeStore(overrides);

function renderTransformer(store: TestStore) {
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
