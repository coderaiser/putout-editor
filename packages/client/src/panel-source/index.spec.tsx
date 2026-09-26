import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import SourcePanel from '#panel-source';
import {makeStore} from '#test/store';

const noop = () => {};

test('SourcePanel: renders without crashing', (t) => {
    const {store} = makeStore();
    const {container} = render(
        <Provider store={store}>
            <SourcePanel/>
        </Provider>,
    );
    
    const result = container.querySelector('.editor');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SourcePanel: renders error boundary fallback on editor error', (t) => {
    const originalError = console.error;
    
    console.error = noop;
    
    const {store} = makeStore({
        workbench: {
            parser: 'invalid-parser',
        },
    });
    
    const {container} = render(
        <Provider store={store}>
            <SourcePanel/>
        </Provider>,
    );
    
    console.error = originalError;
    
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});
