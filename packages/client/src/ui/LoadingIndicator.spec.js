import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import LoadingIndicator from './LoadingIndicator.js';
import {
    putoutEditor,
    revive,
} from '../store/reducers.ts';

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
            <LoadingIndicator/>
        </Provider>,
    );
}

test('LoadingIndicator: not visible: renders nothing', (t) => {
    renderWithStore({
        loadingSnippet: false,
    });
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('LoadingIndicator: visible: renders spinner', (t) => {
    renderWithStore({
        loadingSnippet: true,
    });
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('LoadingIndicator: visible: renders svg spinner icon', (t) => {
    renderWithStore({
        loadingSnippet: true,
    });
    
    const svg = document.querySelector('.loadingIndicator svg');
    
    cleanup();
    
    t.ok(svg);
    t.end();
});
