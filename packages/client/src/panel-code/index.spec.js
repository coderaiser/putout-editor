import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import CodePanel from '#panel-code';
import {putoutEditor, revive} from '../store/reducers.ts';

const makeStore = () => configureStore({
    reducer: putoutEditor,
    preloadedState: revive(putoutEditor(undefined, {
        type: '@@INIT',
    })),
    middleware: (get) => get({
        serializableCheck: false,
    }),
});

test('CodePanel: renders without crashing', async (t) => {
    const {container} = render(
        <Provider store={makeStore()}>
            <CodePanel/>
        </Provider>,
    );
    
    await new Promise(setImmediate);
    
    const result = container.querySelector('.output');
    cleanup();
    
    t.ok(result);
    t.end();
});

test('CodePanel: falls back to default transformer when transformer unknown', async (t) => {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const store = configureStore({
        reducer: putoutEditor,
        preloadedState: revive({
            ...base,
            workbench: {
                ...base.workbench,
                transform: {
                    ...base.workbench.transform,
                    transformer: 'nope',
                },
            },
        }),
        middleware: (get) => get({
            serializableCheck: false,
        }),
    });
    
    const {container} = render(
        <Provider store={store}>
            <CodePanel/>
        </Provider>,
    );
    
    await new Promise(setImmediate);
    
    const result = container.querySelector('.output');
    cleanup();
    
    t.ok(result);
    t.end();
});
