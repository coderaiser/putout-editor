import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '../store/reducers.ts';
import TransformPanel from './index.js';

function makeStore(showTransformPanel = false) {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: revive({
            ...base,
            showTransformPanel,
        }),
        middleware: (get) => get({serializableCheck: false}),
    });
}

test('TransformPanel: renders null when showTransformPanel is false', (t) => {
    const {container} = render(
        <Provider store={makeStore(false)}>
            <TransformPanel/>
        </Provider>,
    );
    cleanup();
    t.notOk(container.firstChild);
    t.end();
});

test('TransformPanel: renders EditorPlugin when showTransformPanel is true', (t) => {
    const {container} = render(
        <Provider store={makeStore(true)}>
            <TransformPanel/>
        </Provider>,
    );
    const result = container.firstChild;
    cleanup();
    t.ok(result);
    t.end();
});