import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {astexplorer, revive} from '../store/reducers.js';
import ErrorMessageContainer from './ErrorMessageContainer.js';

function renderWithStore(overrides = {}) {
    const base = astexplorer(undefined, {
        type: '@@INIT',
    });
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...(overrides.workbench || {}),
        },
    };
    
    return createStore(astexplorer, revive(state));
}

function renderContainer(store) {
    render(
        <Provider store={store}>
            <ErrorMessageContainer/>
        </Provider>,
    );
}

test('ErrorMessageContainer: not visible when no error', (t) => {
    const store = renderWithStore({
        error: null,
    });
    
    renderContainer(store);
    
    const message = document.querySelector('.errorMessage');
    
    cleanup();
    
    t.notOk(message);
    t.end();
});

test('ErrorMessageContainer: visible shows error message', (t) => {
    const err = Error('fail');
    const store = renderWithStore({
        error: err,
    });
    
    renderContainer(store);
    
    const message = document.querySelector('.errorMessage div');
    
    cleanup();
    
    t.ok(message && message.textContent.includes('fail'));
    t.end();
});

test('ErrorMessageContainer: OK button clears error', (t) => {
    const err = Error('fail');
    const store = renderWithStore({
        error: err,
    });
    
    renderContainer(store);
    
    fireEvent.click(document.querySelector('button'));
    
    cleanup();
    
    t.equal(store.getState().error, null);
    t.end();
});
