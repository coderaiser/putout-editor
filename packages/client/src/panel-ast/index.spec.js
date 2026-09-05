import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import AstPanel from '#panel-ast';
import {putoutEditor, revive} from '#store';

const makeStore = () => configureStore({
    reducer: putoutEditor,
    preloadedState: revive(putoutEditor(undefined, {
        type: '@@INIT',
    })),
    middleware: (get) => get({
        serializableCheck: false,
    }),
});

test('AstPanel: renders without crashing', (t) => {
    const {container} = render(
        <Provider store={makeStore()}>
            <AstPanel/>
        </Provider>,
    );
    
    const result = container.firstChild;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('AstPanel: renders error boundary fallback on tree error', (t) => {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: revive({
            ...base,
            cursor: 1,
            workbench: {
                ...base.workbench,
                parser: 'invalid-parser',
                parseResult: {
                    ast: {
                        type: 'Program',
                    },
                },
            },
        }),
        middleware: (get) => get({
            serializableCheck: false,
        }),
    });
    
    const {container} = render(
        <Provider store={store}>
            <AstPanel/>
        </Provider>,
    );
    
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});
