import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {configureStore} from '@reduxjs/toolkit';
import {Provider} from 'react-redux';
import {putoutEditor, revive} from '../store/reducers.ts';
import SourcePanel from './index.js';

const makeStore = () => configureStore({
    reducer: putoutEditor,
    preloadedState: revive(putoutEditor(undefined, {
        type: '@@INIT',
    })),
    middleware: (get) => get({serializableCheck: false}),
});

const makeBrokenStore = () => {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: revive({
            ...base,
            workbench: {
                ...base.workbench,
                parser: 'invalid-parser',
            },
        }),
        middleware: (get) => get({serializableCheck: false}),
    });
};

test('SourcePanel: renders without crashing', (t) => {
    const {container} = render(
        <Provider store={makeStore()}>
            <SourcePanel/>
        </Provider>,
    );
    const result = container.querySelector('.editor');
    cleanup();
    t.ok(result);
    t.end();
});

test('SourcePanel: renders error boundary fallback on editor error', (t) => {
    const {container} = render(
        <Provider store={makeBrokenStore()}>
            <SourcePanel/>
        </Provider>,
    );
    const result = container.querySelector('.error-boundary');
    cleanup();
    t.ok(result);
    t.end();
});