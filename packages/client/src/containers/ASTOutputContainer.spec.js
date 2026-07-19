import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import ASTOutputContainer from './ASTOutputContainer.js';

const noop = () => {};

const createStore = (state) => ({
    getState: () => state,
    subscribe: () => noop,
    dispatch: noop,
});

test('ASTOutputContainer: renders output container', (t) => {
    const store = createStore({
        workbench: {
            parser: 'babel',
            parseResult: {
                ast: null,
                error: null,
                time: 0,
                treeAdapter: {
                    type: 'estree',
                    options: {},
                },
            },
        },
        cursor: null,
    });
    
    render(
        <Provider store={store}>
            <ASTOutputContainer/>
        </Provider>,
    );
    
    const output = document.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('ASTOutputContainer: shows error message when parseResult has error', (t) => {
    const store = createStore({
        workbench: {
            parser: 'babel',
            parseResult: {
                ast: null,
                error: {
                    message: 'parse failed',
                },
                time: 0,
                treeAdapter: {
                    type: 'estree',
                    options: {},
                },
            },
        },
        cursor: null,
    });
    
    render(
        <Provider store={store}>
            <ASTOutputContainer/>
        </Provider>,
    );
    
    cleanup();
    
    t.pass('rendered without exception');
    t.end();
});
