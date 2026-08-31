import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {putoutEditor, revive} from '../store/reducers.ts';
import LoadingIndicatorContainer from './LoadingIndicatorContainer.js';

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
            <LoadingIndicatorContainer/>
        </Provider>,
    );
}

test('LoadingIndicatorContainer: visible when loadingSnippet true', (t) => {
    renderWithStore({
        loadingSnippet: true,
    });
    
    const indicator = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.ok(indicator);
    t.end();
});

test('LoadingIndicatorContainer: not visible when loadingSnippet false', (t) => {
    renderWithStore({
        loadingSnippet: false,
    });
    
    const indicator = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.notOk(indicator);
    t.end();
});
