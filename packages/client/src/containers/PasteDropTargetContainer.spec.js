import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import {astexplorer, revive} from '../store/reducers.js';
import PasteDropTargetContainer from './PasteDropTargetContainer.js';

function makeStore(overrides = {}) {
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
    
    return createStore(astexplorer, revive(state));
}

function renderWithChildren(store) {
    render(
        <Provider store={store}>
            <PasteDropTargetContainer>
                <span id="child-test">hello</span>
            </PasteDropTargetContainer>
        </Provider>,
    );
}

test('PasteDropTargetContainer: renders child content', (t) => {
    const store = makeStore();
    
    renderWithChildren(store);
    
    const child = document.querySelector('#child-test');
    
    cleanup();
    
    t.ok(child);
    t.end();
});
test('PasteDropTargetContainer: drop of plain text sets code', async (t) => {
    const store = makeStore();
    const OriginalReader = globalThis.FileReader;
    
    class StubReader {
        readAsText() {
            this.onload({
                target: {
                    result: 'dropped code',
                },
            });
        }
    }
    
    globalThis.FileReader = StubReader;
    
    try {
        renderWithChildren(store);
        
        fireEvent.drop(document.querySelector('#child-test').parentNode, {
            dataTransfer: {
                files: [{
                    type: 'text/javascript',
                }],
            },
        });
        
        await setImmediate();
        
        cleanup();
    } finally {
        globalThis.FileReader = OriginalReader;
    }
    
    t.equal(store.getState().workbench.code, 'dropped code');
    t.end();
});

test('PasteDropTargetContainer: dropped invalid AST shows error', async (t) => {
    const store = makeStore();
    const OriginalReader = globalThis.FileReader;
    const onUnhandledRejection = () => {};
    
    process.on('unhandledRejection', onUnhandledRejection);
    
    class StubReader {
        readAsText() {
            this.onload({
                target: {
                    result: '{"type":"Bogus"}',
                },
            });
        }
    }
    
    globalThis.FileReader = StubReader;
    
    try {
        renderWithChildren(store);
        
        fireEvent.drop(document.querySelector('#child-test').parentNode, {
            dataTransfer: {
                files: [{
                    type: 'application/json',
                }],
            },
        });
        
        for (let i = 0; i < 50 && !store.getState().error; i++)
            await setImmediate();
        
        cleanup();
    } finally {
        globalThis.FileReader = OriginalReader;
        process.removeListener('unhandledRejection', onUnhandledRejection);
    }
    
    t.ok(store.getState().error);
    t.end();
});
