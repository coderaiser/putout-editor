import {test} from 'supertape';
import {render, cleanup} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {astexplorer, revive} from '../store/reducers.js';
import ASTOutputContainer from './ASTOutputContainer.js';

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
    
    const store = createStore(astexplorer, revive(state));
    
    render(
        <Provider store={store}>
            <ASTOutputContainer/>
        </Provider>,
    );
    
    return store;
}

test('ASTOutputContainer: renders output element', (t) => {
    renderWithStore({
        workbench: {
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
    });
    
    const output = document.querySelector('.output');
    
    cleanup();
    
    t.ok(output);
    t.end();
});

test('ASTOutputContainer: rendered without exception on parse error', (t) => {
    renderWithStore({
        workbench: {
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
    });
    
    t.pass('rendered without exception');
    t.end();
});
