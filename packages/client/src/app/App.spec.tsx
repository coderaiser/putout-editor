import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {makeStore} from '#test/store';
import App from './App.tsx';

// The two branches that pick a layout and the error state. Mobile is decided by
// `innerWidth` in useMobile, so a narrow viewport is what selects MobileLayout -
// AppLayout and MobileLayout are told apart by their own class names.
const renderApp = (options: {
    error?: Error;
    width?: number;
} = {}) => {
    const before = globalThis.innerWidth;
    const {store} = makeStore(options.error ? {
        error: options.error,
    } : {});
    
    if (options.width)
        globalThis.innerWidth = options.width;
    
    const view = render(
        <Provider store={store}>
            <App/>
        </Provider>,
    );
    
    return {
        ...view,
        restore: () => {
            globalThis.innerWidth = before;
        },
    };
};

test('App: uses the desktop layout on a wide viewport', (t) => {
    const {container, restore} = renderApp({
        width: 1200,
    });
    
    const result = container.querySelectorAll('.splitpane-content').length;
    const expected = 1;
    
    cleanup();
    restore();
    
    t.equal(result, expected);
    t.end();
});

test('App: uses the mobile layout on a narrow viewport', (t) => {
    const {container, restore} = renderApp({
        width: 400,
    });
    
    const result = container.querySelectorAll('.mobile-tabs').length;
    const expected = 1;
    
    cleanup();
    restore();
    
    t.equal(result, expected);
    t.end();
});

test('App: marks the drop target when there is an error', (t) => {
    const {container, restore} = renderApp({
        error: Error('boom'),
    });
    
    const result = container.querySelector('.dropTarget')?.className;
    const expected = 'dropTarget hasError';
    
    cleanup();
    restore();
    
    t.equal(result, expected);
    t.end();
});

test('App: leaves the drop target unmarked with no error', (t) => {
    const {container, restore} = renderApp();
    const result = container.querySelector('.dropTarget')?.className;
    const expected = 'dropTarget';
    
    cleanup();
    restore();
    
    t.equal(result, expected);
    t.end();
});
