import {test} from 'supertape';
import {Provider} from 'react-redux';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {createStore} from 'redux';
import {astexplorer, revive} from '../store/reducers.js';
import ShareDialogContainer from './ShareDialogContainer.js';

const makeSnippet = () => ({
    getShareInfo: () => 'share info',
});

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

function renderContainer(store) {
    render(
        <Provider store={store}>
            <ShareDialogContainer/>
        </Provider>,
    );
}

test('ShareDialogContainer: not visible by default', (t) => {
    const store = makeStore();
    
    renderContainer(store);
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.notOk(dialog);
    t.end();
});

test('ShareDialogContainer: visible when showShareDialog true', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderContainer(store);
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.ok(dialog);
    t.end();
});

test('ShareDialogContainer: close button hides dialog', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    render(
        <Provider store={store}>
            <ShareDialogContainer/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('.footer button'));
    
    cleanup();
    
    t.equal(store.getState().showShareDialog, false);
    t.end();
});
