import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import LoadingIndicatorContainer from './LoadingIndicatorContainer.js';

const noop = () => {};

const createStore = (state) => ({
    getState: () => state,
    subscribe: () => noop,
    dispatch: noop,
});

test('LoadingIndicatorContainer: visible when isLoadingSnippet true', (t) => {
    const store = createStore({
        loadingSnippet: true,
    });
    
    render(
        <Provider store={store}>
            <LoadingIndicatorContainer/>
        </Provider>,
    );
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('LoadingIndicatorContainer: not visible when isLoadingSnippet false', (t) => {
    const store = createStore({
        loadingSnippet: false,
    });
    
    render(
        <Provider store={store}>
            <LoadingIndicatorContainer/>
        </Provider>,
    );
    
    const result = document.querySelector('.loadingIndicator');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});
