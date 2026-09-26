import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {makeStore, type StoreOverrides} from '#test/store';
import LoadingIndicator from './LoadingIndicator.tsx';

function renderWithStore(overrides: StoreOverrides = {}) {
    const {store} = makeStore(overrides);
    
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
