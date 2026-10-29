import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createAppStore, initialState} from '#store';
import App from './App.tsx';

/**
 * The wiring the page runs, mounted for real: `index.tsx` builds the store with
 * `createAppStore`, wraps in a `Provider` and renders `App`. Reproduced here
 * rather than imported, because importing `index.tsx` would call
 * `createRoot` on a container that does not exist under tape.
 */
test('index: the app mounts inside a Provider without throwing', (t) => {
    const store = createAppStore();
    
    render(
        <Provider store={store}>
            <App/>
        </Provider>,
    );
    
    const result = document.querySelector('[data-testid="app"]') !== null;
    const expected = true;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});

/**
 * The app starts on the seeded thread. The count comes from `initialState`.
 */
test('index: the mounted app starts on the seeded thread', (t) => {
    const store = createAppStore();
    
    render(
        <Provider store={store}>
            <App/>
        </Provider>,
    );
    
    const result = store.getState().chat.messages.length;
    const expected = initialState.messages.length;
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
