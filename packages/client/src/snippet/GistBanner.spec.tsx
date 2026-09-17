import {test} from 'supertape';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {
    render,
    fireEvent,
    cleanup,
    act,
} from '@testing-library/react';
import GistBanner from './GistBanner.tsx';
import {
    putoutEditor,
    setSnippet,
    type Revision,
} from '#store';

const createStore = (revision: Revision | null = null) => {
    const store = configureStore({
        reducer: putoutEditor,
    });
    
    if (revision)
        store.dispatch(setSnippet(revision));
    
    return store;
};

const makeRevision = (overrides: {
    snippetID?: string;
    canSave?: boolean;
} = {}): Revision => {
    const {
        snippetID = '1',
        canSave = false,
    } = overrides;
    
    return {
        canSave: () => canSave,
        getSnippetID: () => snippetID,
        getRevisionID: () => 'revision-id',
        getTransformerID: () => null,
        getTransformCode: () => '',
        getParserID: () => 'babel',
        getCode: () => 'const x = 1',
        getParserSettings: () => null,
        getPath: () => `/gist/${snippetID}/revision-id`,
        getShareData: () => ({
            versionedURL: 'https://example.com/v1',
            latestURL: null,
            embedURL: null,
        }),
    };
};

test('GistBanner: renders banner for read-only revision', (t) => {
    const store = createStore(makeRevision());
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.ok(banner);
    t.end();
});

test('GistBanner: renders close svg icon', (t) => {
    const store = createStore(makeRevision());
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    const svg = document.querySelector('.banner button svg');
    
    cleanup();
    
    t.ok(svg, 'close icon svg rendered');
    t.end();
});

test('GistBanner: hidden when no revision', (t) => {
    const store = createStore(null);
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: hidden when revision.canSave() is true', (t) => {
    const store = createStore(makeRevision({
        canSave: true,
    }));
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: hides on close button click', (t) => {
    const store = createStore(makeRevision());
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('button')!);
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: hides banner after close click', (t) => {
    const store = createStore(makeRevision({
        snippetID: '1',
    }));
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('button')!);
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: reappears when snippet ID changes', (t) => {
    const store = createStore(makeRevision({
        snippetID: '1',
    }));
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('button')!);
    
    act(() => {
        store.dispatch(setSnippet(makeRevision({
            snippetID: '2',
        })));
    });
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.ok(banner);
    t.end();
});
