import {setImmediate} from 'node:timers/promises';
import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {makeStore, type TestStore} from '#test/store';
import PasteDropTarget from './PasteDropTarget.tsx';

function renderWithChildren(store: TestStore) {
    render(
        <Provider store={store}>
            <PasteDropTarget>
                <span id="child-test">hello</span>
            </PasteDropTarget>
        </Provider>,
    );
}

test('PasteDropTarget: renders child content', (t) => {
    const {store} = makeStore();
    
    renderWithChildren(store);
    
    const child = document.querySelector('#child-test');
    
    cleanup();
    
    t.ok(child);
    t.end();
});

test('PasteDropTarget: drop of plain text sets code', async (t) => {
    const {store} = makeStore();
    const OriginalReader = globalThis.FileReader;
    
    class StubReader extends OriginalReader {
        readAsText() {
            Object.defineProperty(this, 'result', {
                value: 'dropped code',
            });
            this.dispatchEvent(new ProgressEvent('load'));
        }
    }
    globalThis.FileReader = StubReader;
    
    try {
        renderWithChildren(store);
        
        fireEvent.drop(document.querySelector('#child-test')!.parentNode!, {
            dataTransfer: {
                files: [{
                    type: 'text/plain',
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

test('PasteDropTarget: dropped invalid AST shows error', async (t) => {
    const {store} = makeStore();
    const OriginalReader = globalThis.FileReader;
    const onUnhandledRejection = () => {};
    
    process.on('unhandledRejection', onUnhandledRejection);
    
    class StubReader extends OriginalReader {
        readAsText() {
            Object.defineProperty(this, 'result', {
                value: '{"type":"Bogus"}',
            });
            this.dispatchEvent(new ProgressEvent('load'));
        }
    }
    globalThis.FileReader = StubReader;
    
    try {
        renderWithChildren(store);
        
        fireEvent.drop(document.querySelector('#child-test')!.parentNode!, {
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
    const {error} = store.getState();
    
    t.ok(error);
    t.end();
});
