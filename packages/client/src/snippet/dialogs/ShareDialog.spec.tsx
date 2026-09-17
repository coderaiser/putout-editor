import {test} from 'supertape';
import {
    render,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import ShareDialog from './ShareDialog.tsx';
import {
    putoutEditor,
    revive,
    type RootState,
    type Revision,
} from '../../store/reducers.ts';

const makeSnippet = (): Revision => ({
    canSave: () => true,
    getSnippetID: () => 'snippet-id',
    getRevisionID: () => 'revision-id',
    getTransformerID: () => null,
    getTransformCode: () => '',
    getParserID: () => 'babel',
    getCode: () => 'const x = 1',
    getParserSettings: () => null,
    getPath: () => '/gist/snippet-id/revision-id',
    getShareData: () => ({
        versionedURL: '#/gist/abc',
        latestURL: '#/gist/abc/latest',
        embedURL: '<script src="x.js"></script>',
    }),
});

function makeStore(overrides: Partial<RootState> = {}) {
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

function renderDialog(store: ReturnType<typeof makeStore>) {
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
    const result = input instanceof HTMLInputElement ? input.value : '';
    
    cleanup();
    
    t.equal(result, '#/gist/abc');
    t.end();
});

test('ShareDialog: renders one input when latest and embed URLs are missing', (t) => {
    const store = makeStore({
        showShareDialog: true,
        activeRevision: {
            canSave: () => true,
            getSnippetID: () => 'snippet-id',
            getRevisionID: () => 'revision-id',
            getTransformerID: () => null,
            getTransformCode: () => '',
            getParserID: () => 'babel',
            getCode: () => 'const x = 1',
            getParserSettings: () => null,
            getPath: () => '/gist/snippet-id/revision-id',
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
    
    for (const input of inputs)
        fireEvent.focus(input);
    
    const selected = Array
        .from(inputs)
        .every((input) => (input as HTMLInputElement).value === '#/gist/abc' || (input as HTMLInputElement).value === '#/gist/abc/latest' || (input as HTMLInputElement).value.startsWith('<script'));
    
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
    
    const dialog = document.getElementById('ShareDialog')!;
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
    
    const inner = document.querySelector('.inner')!;
    fireEvent.click(inner);
    
    cleanup();
    
    const {showShareDialog} = store.getState();
    
    t.ok(showShareDialog);
    t.end();
});
