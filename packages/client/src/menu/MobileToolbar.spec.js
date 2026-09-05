import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import MobileToolbar from './MobileToolbar.js';
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

function renderMobileToolbar(store) {
    render(
        <Provider store={store}>
            <MobileToolbar/>
        </Provider>,
    );
}

const getSaveButton = () => [...document.querySelectorAll('#MobileToolbar button')].find(({title}) => title === 'Save' || title === 'Fork');

const getThemeButton = () => [...document.querySelectorAll('#MobileToolbar button')].find(({title}) => /mode/i.test(title));

test('MobileToolbar: renders save button', (t) => {
    const store = makeStore();
    
    renderMobileToolbar(store);
    
    const saveButton = getSaveButton();
    
    cleanup();
    
    t.ok(saveButton, 'save button rendered');
    t.end();
});

test('MobileToolbar: renders parser dropdown trigger', (t) => {
    const store = makeStore();
    
    renderMobileToolbar(store);
    
    const trigger = document.querySelector('#MobileToolbar .mobile-dropdown-trigger');
    
    cleanup();
    
    t.ok(trigger, 'parser dropdown trigger rendered');
    t.end();
});

test('MobileToolbar: renders theme toggle button', (t) => {
    const store = makeStore();
    
    renderMobileToolbar(store);
    
    const themeButton = getThemeButton();
    
    cleanup();
    
    t.ok(themeButton, 'theme toggle button rendered');
    t.end();
});

test('MobileToolbar: renders help link', (t) => {
    const store = makeStore();
    
    renderMobileToolbar(store);
    
    const help = document.querySelector('#MobileToolbar a[title="Help"]');
    
    cleanup();
    
    t.ok(help, 'help link rendered');
    t.end();
});

test('MobileToolbar: save button is disabled when saving', (t) => {
    const store = makeStore({
        saving: true,
    });
    
    renderMobileToolbar(store);
    
    const saveButton = getSaveButton();
    
    cleanup();
    
    t.ok(saveButton.disabled, 'save button disabled while saving');
    t.end();
});

test('MobileToolbar: parser dropdown shows parser list on click', (t) => {
    const store = makeStore();
    
    renderMobileToolbar(store);
    
    const trigger = document.querySelector('#MobileToolbar .mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    
    const items = document.querySelectorAll('#MobileToolbar .mobile-dropdown-menu li');
    
    cleanup();
    
    t.ok(items.length > 0, 'parser list items rendered on click');
    t.end();
});

test('MobileToolbar: clicking parser item dispatches setParser', (t) => {
    const actions = [];
    const store = makeStore({}, actions);
    
    renderMobileToolbar(store);
    
    const trigger = document.querySelector('#MobileToolbar .mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    
    const item = document.querySelector('#MobileToolbar .mobile-dropdown-menu li button');
    
    fireEvent.click(item);
    
    cleanup();
    
    const result = actions.some(({type}) => type === 'putoutEditor/setParser');
    
    t.ok(result, 'setParser dispatched');
    t.end();
});
