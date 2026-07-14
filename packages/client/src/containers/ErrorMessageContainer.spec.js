import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import ErrorMessageContainer from './ErrorMessageContainer.js';

const noop = () => {};

function createStore(state) {
    const dispatched = [];
    
    return {
        getState: () => state,
        subscribe: () => noop,
        dispatch: (action) => {
            dispatched.push(action);
        },
        _getDispatched: () => dispatched,
    };
}

test('ErrorMessageContainer: not visible when no error', (t) => {
    const store = createStore({
        error: null,
    });
    
    render(<Provider store={store}>
        <ErrorMessageContainer/>
    </Provider>);
    
    const result = document.querySelector('.errorMessage');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ErrorMessageContainer: visible shows error message', (t) => {
    const err = Error('fail');
    const store = createStore({
        error: err,
    });
    
    render(<Provider store={store}>
        <ErrorMessageContainer/>
    </Provider>);
    
    const message = document.querySelector('.errorMessage div');
    
    cleanup();
    
    t.ok(message && message.textContent.includes('fail'));
    t.end();
});

test('ErrorMessageContainer: OK button dispatches clearError', (t) => {
    const err = Error('fail');
    const store = createStore({
        error: err,
    });
    
    render(<Provider store={store}>
        <ErrorMessageContainer/>
    </Provider>);
    
    const okButton = document.querySelector('button');
    
    fireEvent.click(okButton);
    
    const dispatched = store._getDispatched();
    
    cleanup();
    
    t.ok(dispatched.length > 0);
    t.end();
});
