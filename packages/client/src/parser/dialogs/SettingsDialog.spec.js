import {test} from 'supertape';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {
    render,
    cleanup,
    fireEvent,
    act,
} from '@testing-library/react';
import SettingsDialog from './SettingsDialog.js';
import {
    putoutEditor,
    revive,
    setParserSettings,
} from '../../store/reducers.ts';

function makeStore(overrides = {}) {
    const base = putoutEditor(undefined, {
        type: '@@INIT',
    });
    
    const state = {
        ...base,
        ...overrides,
        workbench: {
            ...base.workbench,
            ...overrides.workbench || {},
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

function makeSettingsStore() {
    return makeStore({
        showSettingsDialog: true,
        parserSettings: {
            espree: {
                range: true,
            },
        },
        workbench: {
            parser: 'espree',
        },
    });
}

function renderDialog(store) {
    render(
        <Provider store={store}>
            <SettingsDialog/>
        </Provider>,
    );
}

test('SettingsDialog: returns null when not visible', (t) => {
    const store = makeStore();
    
    renderDialog(store);
    
    const result = document.querySelector('#SettingsDialog');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('SettingsDialog: renders dialog for default parser when visible', (t) => {
    const store = makeStore({
        showSettingsDialog: true,
    });
    
    renderDialog(store);
    
    const result = document.querySelector('#SettingsDialog');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SettingsDialog: renders when visible', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const result = document.querySelector('#SettingsDialog');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('SettingsDialog: renders parser displayName in header', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const result = document.querySelector('h3').textContent;
    
    cleanup();
    
    t.match(result, 'espree');
    t.end();
});

test('SettingsDialog: close button closes dialog', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const buttons = document.querySelectorAll('button');
    
    fireEvent.click(buttons[1]);
    
    cleanup();
    
    const {showSettingsDialog} = store.getState();
    
    t.notOk(showSettingsDialog);
    t.end();
});

test('SettingsDialog: close button saves parserSettings', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const buttons = document.querySelectorAll('button');
    
    fireEvent.click(buttons[1]);
    
    cleanup();
    
    const result = store.getState().workbench.parserSettings;
    const expected = {
        range: true,
    };
    
    t.deepEqual(result, expected);
    t.end();
});

test('SettingsDialog: reset button clears parserSettings on close', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const buttons = document.querySelectorAll('button');
    
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    
    cleanup();
    
    const result = store.getState().workbench.parserSettings;
    const expected = {};
    
    t.deepEqual(result, expected);
    t.end();
});

test('SettingsDialog: settings change saved on close', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    const checkbox = document.querySelector('input[type="checkbox"]');
    
    fireEvent.click(checkbox);
    
    const buttons = document.querySelectorAll('button');
    
    fireEvent.click(buttons[1]);
    
    cleanup();
    
    const result = store.getState().workbench.parserSettings.range;
    
    t.notOk(result);
    t.end();
});

test('SettingsDialog: outer click on backdrop closes dialog', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    fireEvent.click(document.querySelector('#SettingsDialog'));
    
    cleanup();
    
    const {showSettingsDialog} = store.getState();
    
    t.notOk(showSettingsDialog);
    t.end();
});

test('SettingsDialog: inner click does not close dialog', (t) => {
    const store = makeSettingsStore();
    
    renderDialog(store);
    
    fireEvent.click(document.querySelector('.inner'));
    
    cleanup();
    
    const {showSettingsDialog} = store.getState();
    
    t.ok(showSettingsDialog);
    t.end();
});

test('SettingsDialog: syncs parserSettings from store', async (t) => {
    const store = makeStore({
        showSettingsDialog: true,
        parserSettings: {
            espree: {
                sourceType: 'script',
            },
        },
        workbench: {
            parser: 'espree',
        },
    });
    
    renderDialog(store);
    
    await act(() => {
        store.dispatch(setParserSettings({
            sourceType: 'module',
        }));
    });
    
    const selects = document.querySelectorAll('.settings select');
    const result = selects[1].value;
    
    cleanup();
    
    t.equal(result, 'module');
    t.end();
});
