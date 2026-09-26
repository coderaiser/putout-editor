import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import AstPanel from '#panel-ast';
import {makeStore} from '#test/store';
import {type ParseResult} from '#store';

const noop = () => {};

test('AstPanel: renders without crashing', (t) => {
    const {store} = makeStore();
    const {container} = render(
        <Provider store={store}>
            <AstPanel/>
        </Provider>,
    );
    
    const result = container.firstChild;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('AstPanel: renders error boundary fallback on tree error', (t) => {
    const originalError = console.error;
    
    console.error = noop;
    
    const {store} = makeStore({
        cursor: 1,
        workbench: {
            parser: 'invalid-parser',
            parseResult: {
                ast: {
                    type: 'Program',
                },
                treeAdapter: null,
                time: null,
                source: null,
                error: null,
            } satisfies NonNullable<ParseResult>,
        },
    });
    
    const {container} = render(
        <Provider store={store}>
            <AstPanel/>
        </Provider>,
    );
    
    console.error = originalError;
    
    const result = container.querySelector('.error-boundary');
    
    cleanup();
    
    t.ok(result);
    t.end();
});
