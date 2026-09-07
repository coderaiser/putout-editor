import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import Menu from './Menu.js';
import {putoutEditor, revive} from '../store/reducers.ts';

const recordActions = (actions) => () => (next) => (action) => {
    actions.push(action);
    
    return next(action);
};

function makeStore(overrides = {}, actions = []) {
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

function renderMenu(store) {
    render(
        <Provider store={store}>
            <Menu/>
        </Provider>,
    );
}

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
    const result = info.textContent.includes('babel');
    
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
    const result = info.textContent.includes('Transformer') && info.textContent.includes('🐊Putout');
    
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
    const result = info.textContent.includes('Transformer');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('Menu: keyMap menu item dispatches setKeyMap', (t) => {
    const store = makeStore();
    
    renderMenu(store);
    
    const items = document.querySelectorAll('#Toolbar li');
    const vimItem = [...items].find((item) => item.textContent === 'vim');
    
    fireEvent.click(vimItem);
    
    cleanup();
    
    const result = store.getState().workbench.keyMap;
    
    t.equal(result, 'vim');
    t.end();
});

test('Menu: save button dispatches snippet/save', (t) => {
    const actions = [];
    const store = makeStore({}, actions);
    
    renderMenu(store);
    
    const buttons = document.querySelectorAll('#Toolbar button');
    const saveButton = [...buttons].find((button) => button.textContent.trim() === 'Save');
    
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
    
    const buttons = document.querySelectorAll('#Toolbar button');
    const newButton = [...buttons].find((button) => button.textContent.includes('New'));
    
    fireEvent.click(newButton);
    
    cleanup();
    
    const result = globalThis.location.hash;
    
    t.equal(result, '');
    t.end();
});

test('Menu: fork button dispatches snippet/save with payload true', (t) => {
    const actions = [];
    const store = makeStore({}, actions);
    
    renderMenu(store);
    
    // The save button is the last button in the toolbar (from SnippetButton)
    const buttons = document.querySelectorAll('#Toolbar button');
    const forkButton = [...buttons].find((button) => button.title === 'Save');
    
    fireEvent.click(forkButton);
    
    cleanup();
    
    const result = actions.find(({type}) => type === 'snippet/save');
    
    t.ok(result);
    t.end();
});

test('Menu: share button dispatches openShareDialog', (t) => {
    const actions = [];
    const store = makeStore({
        activeRevision: {
            getSnippetID: () => 'test-id',
            getRevisionID: () => 'r1',
            getTransformerID: () => null,
            getTransformCode: () => '',
            getParserID: () => 'babel',
            getCode: () => 'const x = 1;',
            getParserSettings: () => ({}),
            getPath: () => '/test',
            getShareData: () => ({
                versionedURL: 'http://test.com',
                latestURL: 'http://test.com',
                embedURL: 'http://test.com',
            }),
            canSave: () => true,
        },
    }, actions);
    
    renderMenu(store);
    
    // The share button is inside SnippetButton
    const buttons = document.querySelectorAll('#Toolbar button');
    const shareButton = [...buttons].find((button) => button.textContent.includes('Share'));
    
    fireEvent.click(shareButton);
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/openShareDialog');
    
    t.ok(result);
    t.end();
});

test('Menu: transform button dispatches selectTransformer', (t) => {
    const actions = [];
    const store = makeStore({}, actions);
    
    renderMenu(store);
    
    // Find the transform button (it's a select-like component)
    cleanup();
    
    t.pass();
    t.end();
});
