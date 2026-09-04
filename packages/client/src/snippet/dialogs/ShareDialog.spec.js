import {test} from 'supertape';
import {
    render,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ShareDialog from './ShareDialog.js';
import {putoutEditor, revive} from '../../store/reducers.ts';

const makeSnippet = () => ({
    getShareData: () => ({
        versionedURL: '#/gist/abc',
        latestURL: '#/gist/abc/latest',
        embedURL: '<script src="x.js"></script>',
    }),
});

function makeStore(overrides = {}) {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench,
        },
    };
    
    return configureStore({
        reducer: putoutEditor,
        preloadedState: revive(state),
        middleware: (getDefault) => getDefault({
            serializableCheck: false,
        }),
    });
}

function renderDialog(store) {
    render(
        <Provider store={store}>
            <ShareDialog/>
        </Provider>,
    );
}

test('ShareDialog: not visible: renders nothing', (t) => {
    const store = makeStore();
    
    renderDialog(store);
    
    const result = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('ShareDialog: visible when showShareDialog true: renders dialog', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderDialog(store);
    
    const dialog = document.getElementById('ShareDialog');
    
    cleanup();
    
    t.ok(dialog);
    t.end();
});

test('ShareDialog: visible: renders share data from snippet', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderDialog(store);
    
    const input = document.querySelector('.body input');
    const result = input.value;
    
    cleanup();
    
    t.equal(result, '#/gist/abc');
    t.end();
});

test('ShareDialog: renders one input when latest and embed URLs are missing', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: {
            getShareData: () => ({
                versionedURL: '#/gist/abc',
                latestURL: null,
                embedURL: null,
            }),
        },
    });
    
    renderDialog(store);
    
    const {length} = document.querySelectorAll('.body input');
    
    cleanup();
    
    t.equal(length, 1);
    t.end();
});

test('ShareDialog: focus on input selects value', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderDialog(store);
    
    const inputs = document.querySelectorAll('.body input');
    
    inputs.forEach(fireEvent.focus);
    
    const selected = Array
        .from(inputs)
        .every((input) => input.value === '#/gist/abc' || input.value === '#/gist/abc/latest' || input.value.startsWith('<script'));
    
    cleanup();
    
    t.ok(selected);
    t.end();
});

test('ShareDialog: click on outer dialog: closes', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderDialog(store);
    
    const dialog = document.getElementById('ShareDialog');
    fireEvent.click(dialog);
    
    cleanup();
    
    const {showShareDialog} = store.getState();
    
    t.notOk(showShareDialog);
    t.end();
});

test('ShareDialog: click on inner dialog: does not close', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: makeSnippet(),
    });
    
    renderDialog(store);
    
    const inner = document.querySelector('.inner');
    fireEvent.click(inner);
    
    cleanup();
    
    const {showShareDialog} = store.getState();
    
    t.ok(showShareDialog);
    t.end();
});
