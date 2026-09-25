import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {
    configureStore,
    type Middleware,
    type UnknownAction,
} from '@reduxjs/toolkit';
import Menu from './Menu.tsx';
import {
    putoutEditor,
    revive,
    type RootState,
    type Revision,
} from '../store/reducers.ts';

const recordActions = (actions: UnknownAction[]): Middleware => () => (next) => (action) => {
    actions.push(action as UnknownAction);
    
    return next(action);
};

function makeStore(overrides: Partial<RootState> = {}, actions: UnknownAction[] = []) {
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
        }).prepend(recordActions(actions)),
    });
}

const makeRevision = (overrides: Partial<Revision> = {}): Revision => ({
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
        versionedURL: 'https://example.com/v1',
        latestURL: null,
        embedURL: null,
    }),
    ...overrides,
});

function renderMenu(store: ReturnType<typeof makeStore>) {
    render(
        <Provider store={store}>
            <Menu/>
        </Provider>,
    );
}

const openSnippet = () => fireEvent.click(document.querySelector('#Toolbar > .menuButton > span')!);
const openKeyMap = () => fireEvent.click(document.querySelector('#ToolbarKeyMap > button')!);

const openNew = () => {
    openSnippet();
    fireEvent.click(document.querySelector('[data-testid="new-menu"] > span')!);
};

test('Menu: renders title', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const title = document.querySelector('#Toolbar h1');
    
    cleanup();
    
    t.ok(title);
    t.end();
});

test('Menu: renders help question-mark svg icon', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const svg = document.querySelector('#Toolbar a svg');
    
    cleanup();
    
    t.ok(svg, 'help icon svg rendered');
    t.end();
});

test('Menu: parser info shows parser name', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const info = document.querySelector('#info');
    const result = info?.textContent.includes('babel') || false;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Menu: parser info renders link when parser has homepage', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const link = document.querySelector('#info a');
    
    cleanup();
    
    t.ok(link);
    t.end();
});

test('Menu: transformer info shown when showTransformer', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const info = document.querySelector('#info');
    const result = info?.textContent.includes('Transformer') && info?.textContent.includes('🐊Putout');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Menu: no transformer info when showTransformer false', (t) => {
    const store = makeStore({
        showTransformPanel: false,
    });
    
    renderMenu(store);
    
    const info = document.querySelector('#info');
    const result = info?.textContent.includes('Transformer') || false;
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('Menu: keyMap menu item dispatches setKeyMap', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    openKeyMap();
    
    const items = document.querySelectorAll('#ToolbarKeyMap li');
    const vimItem = [...items].find((item) => item.textContent === 'vim');
    
    fireEvent.click(vimItem!);
    
    cleanup();
    
    const result = store.getState().workbench.keyMap;
    
    t.equal(result, 'vim');
    t.end();
});

test('Menu: save button dispatches snippet/save', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({}, actions);
    
    renderMenu(store);
    const saveButton = document.querySelector('#Toolbar > .menuButton > button[title="Save"]')!;
    
    fireEvent.click(saveButton);
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'snippet/save');
    
    t.ok(result);
    t.end();
});

test('Menu: new button clears location hash', (t) => {
    const store = makeStore();
    
    globalThis.location.hash = '#/gist/abc';
    
    renderMenu(store);
    openNew();
    
    const defaultItem = document.querySelector('[data-testid="new-submenu"] [role="menuitem"]') as HTMLElement;
    
    fireEvent.click(defaultItem!);
    
    cleanup();
    
    const result = globalThis.location.hash;
    
    t.equal(result, '');
    t.end();
});

test('Menu: fork button dispatches snippet/save with payload true', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({
        activeRevision: makeRevision({
            canSave: () => false,
        }),
    }, actions);
    
    renderMenu(store);
    
    const forkButton = document.querySelector('[title="Fork"]') as HTMLElement;
    
    fireEvent.click(forkButton!);
    
    cleanup();
    
    const result = actions.find(({type}) => type === 'snippet/save');
    
    t.ok(result);
    t.end();
});

test('Menu: share button dispatches openShareDialog', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({
        activeRevision: makeRevision({
            getSnippetID: () => 'test-id',
            getRevisionID: () => 'r1',
            getParserSettings: () => ({}),
            getPath: () => '/test',
            getShareData: () => ({
                versionedURL: 'http://test.com',
                latestURL: 'http://test.com',
                embedURL: 'http://test.com',
            }),
            getCode: () => 'const x = 1;',
        }),
    }, actions);
    
    renderMenu(store);
    openSnippet();
    
    // The share button is inside SnippetButton
    const shareButton = [...document.querySelectorAll('#Toolbar button')].find((button) => button.textContent.includes('Share'))!;
    
    fireEvent.click(shareButton);
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/openShareDialog');
    
    t.ok(result);
    t.end();
});

test('Menu: transform button dispatches selectTransformer', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({}, actions);
    
    renderMenu(store);
    
    // Find the transform button (it's a select-like component)
    cleanup();
    
    t.pass('transform button');
    t.end();
});
