import {test} from 'supertape';
import {Provider} from 'react-redux';
import {
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {makeStore, type StoreOverrides} from '#test/store';
import ErrorMessage from './ErrorMessage.tsx';

function renderWithStore(overrides: StoreOverrides = {}) {
    const {store} = makeStore(overrides);
    
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
