import {test} from 'supertape';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import ErrorMessage from './ErrorMessage.js';
import {putoutEditor, revive} from '../store/reducers.ts';

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
            <ErrorMessage/>
        </Provider>,
    );
    
    return store;
}

test('ErrorMessage: no error renders nothing', (t) => {
    renderWithStore({
        error: null,
    });
    
    const errorMessage = screen.queryByText('Error');
    
    cleanup();
    
    t.notOk(errorMessage);
    t.end();
});

test('ErrorMessage: error present renders message', (t) => {
    renderWithStore({
        error: Error('something went wrong'),
    });
    
    const errorText = screen.queryByText('something went wrong');
    
    cleanup();
    
    t.ok(errorText);
    t.end();
});

test('ErrorMessage: click OK dispatches clearError', (t) => {
    const store = renderWithStore({
        error: Error('dismiss me'),
    });
    
    const okButton = screen.getByText('OK');
    
    fireEvent.click(okButton);
    
    cleanup();
    
    const {error} = store.getState();
    
    t.notOk(error);
    t.end();
});

test('ErrorMessage: renders alert svg icon', (t) => {
    renderWithStore({
        error: Error('icon check'),
    });
    
    const svg = document.querySelector('h3 svg');
    
    cleanup();
    
    t.ok(svg, 'alert icon svg rendered');
    t.end();
});
