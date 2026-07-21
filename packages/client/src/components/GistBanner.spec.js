import {test, stub} from 'supertape';
import {Provider} from 'react-redux';
import {
    render,
    fireEvent,
    cleanup,
    act,
} from '@testing-library/react';
import GistBanner from './GistBanner.js';

const noop = () => {};

const createStore = (activeRevision) => ({
    getState: () => ({
        activeRevision,
    }),
    subscribe: () => stub(),
    dispatch: stub(),
});

const makeRevision = (overrides = {}) => {
    const {
        snippetID = '1',
        canSave = false,
    } = overrides;
    
    return {
        getSnippetID: () => snippetID,
        canSave: () => canSave,
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
    
    fireEvent.click(document.querySelector('button'));
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: hides banner after close click', (t) => {
    const currentRevision = makeRevision({
        snippetID: '1',
    });
    
    const store = {
        getState: () => ({
            activeRevision: currentRevision,
        }),
        listeners: [],
        subscribe(fn) {
            store.listeners.push(fn);
            return noop;
        },
        dispatch: stub(),
    };
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('button'));
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.notOk(banner);
    t.end();
});

test('GistBanner: reappears when snippet ID changes', (t) => {
    let currentRevision = makeRevision({
        snippetID: '1',
    });
    
    const store = {
        getState: () => ({
            activeRevision: currentRevision,
        }),
        listeners: [],
        subscribe(fn) {
            store.listeners.push(fn);
            return noop;
        },
        dispatch: stub(),
    };
    
    render(
        <Provider store={store}>
            <GistBanner/>
        </Provider>,
    );
    
    fireEvent.click(document.querySelector('button'));
    
    act(() => {
        currentRevision = makeRevision({
            snippetID: '2',
        });
        for (const fn of store.listeners)
            fn();
    });
    
    const banner = document.querySelector('.banner');
    
    cleanup();
    
    t.ok(banner);
    t.end();
});
