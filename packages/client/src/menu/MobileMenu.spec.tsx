import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import MobileMenu from './MobileMenu.tsx';
import {putoutEditor, revive} from '../store/reducers.ts';

const recordActions = (actions: any[]) => () => (next: any) => (action: any) => {
    actions.push(action);
    return next(action);
};

function makeStore(overrides: any = {}, actions: any[] = []) {
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

function renderMenu(store = makeStore()) {
    return render(
        <Provider store={store}><MobileMenu/></Provider>,
    );
}

// ── Rendering ──────────────────────────────────────────────
test('MobileMenu: renders Snippet trigger', (t) => {
    const {container, unmount} = renderMenu();
    t.ok(container.querySelector('#MobileMenu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: renders parser name in trigger', (t) => {
    const {container, unmount} = renderMenu();
    t.ok(container.textContent?.includes('babel'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: renders help link', (t) => {
    const {container, unmount} = renderMenu();
    t.ok(container.querySelector('.mobile-menu__help'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: renders theme button', (t) => {
    const {container, unmount} = renderMenu();
    t.ok(container.querySelector('.mobile-menu__theme'));
    unmount();
    cleanup();
    t.end();
});

// ── Snippet dropdown ───────────────────────────────────────
test('MobileMenu: Snippet dropdown closed initially', (t) => {
    const {container, unmount} = renderMenu();
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet dropdown opens on trigger click', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    fireEvent.pointerUp(triggers[0]);
    t.ok(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet dropdown shows New item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    t.ok(container.textContent?.includes('New'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet dropdown shows Save item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    t.ok(container.textContent?.includes('Save'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet dropdown shows Share item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    t.ok(container.textContent?.includes('Share'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet Save dispatches snippet/save payload=false', (t) => {
    const actions: any[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const saveBtn = [...buttons].find((b) => b.textContent?.includes('Save'));
    
    fireEvent.click(saveBtn!);
    const action = actions.find((a) => a.type === 'snippet/save');
    
    unmount();
    cleanup();
    
    t.equal(action?.payload, false);
    t.end();
});

test('MobileMenu: Snippet Share dispatches openShareDialog', (t) => {
    const actions: any[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const shareBtn = [...buttons].find((b) => b.textContent?.includes('Share'));
    
    fireEvent.click(shareBtn!);
    const action = actions.find((a) => a.type?.includes('share') || a.type?.includes('Share'));
    
    unmount();
    cleanup();
    
    t.ok(action);
    t.end();
});

test('MobileMenu: Snippet dropdown closes after item click', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.click(container.querySelector('.mobile-dropdown__menu')!);
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

// ── Parser dropdown ────────────────────────────────────────
test('MobileMenu: Parser dropdown closed initially', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    t.equal(triggers[1].getAttribute('aria-expanded'), 'false');
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Parser dropdown opens on trigger click', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    fireEvent.pointerUp(triggers[1]);
    t.ok(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Parser dropdown lists parsers', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    
    const items = container.querySelectorAll('.mobile-dropdown__menu li');
    
    t.ok(items.length > 0);
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Parser dropdown clicking parser dispatches setParser', (t) => {
    const actions: any[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    const firstParser = container.querySelector('.mobile-dropdown__menu button');
    
    fireEvent.click(firstParser!);
    const action = actions.find((a) => a.type?.includes('setParser') || a.type?.includes('parser'));
    
    unmount();
    cleanup();
    
    t.ok(action);
    t.end();
});

test('MobileMenu: Parser Settings dispatches openSettingsDialog', (t) => {
    const actions: any[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const settingsBtn = [...buttons].find((b) => b.textContent?.includes('Settings'));
    
    fireEvent.click(settingsBtn!);
    const action = actions.find((a) => a.type?.includes('settings') || a.type?.includes('Settings'));
    
    unmount();
    cleanup();
    
    t.ok(action);
    t.end();
});

test('MobileMenu: Parser dropdown closes after item click', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    fireEvent.click(container.querySelector('.mobile-dropdown__menu')!);
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet New clears location hash', (t) => {
    globalThis.location.hash = '#/gist/abc';
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const newBtn = [...buttons].find((b) => b.textContent?.includes('New'));
    
    fireEvent.click(newBtn!);
    const {hash} = globalThis.location;
    
    unmount();
    cleanup();
    
    t.equal(hash, '');
    t.end();
});

test('MobileMenu: Snippet New dispatches reset when no hash', (t) => {
    globalThis.location.hash = '';
    const actions: any[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const newBtn = [...buttons].find((b) => b.textContent?.includes('New'));
    
    fireEvent.click(newBtn!);
    const action = actions.find((a) => a.type?.includes('reset'));
    
    unmount();
    cleanup();
    
    t.ok(action);
    t.end();
});

test('MobileMenu: Snippet shows Fork when can fork and not save', (t) => {
    const store = makeStore({
        activeRevision: {
            getParserID: () => 'babel',
            getParserSettings: () => ({}),
            canSave: () => false,
        },
    });
    
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const forkBtn = [...buttons].find((b) => b.textContent?.includes('Fork'));
    
    t.ok(forkBtn);
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet Fork dispatches snippet/save payload=true', (t) => {
    const actions: any[] = [];
    const store = makeStore({
        activeRevision: {
            getParserID: () => 'babel',
            getParserSettings: () => ({}),
            canSave: () => false,
        },
    }, actions);
    
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const forkBtn = [...buttons].find((b) => b.textContent?.includes('Fork'));
    
    fireEvent.click(forkBtn!);
    const action = actions.find((a) => a.type === 'snippet/save');
    
    unmount();
    cleanup();
    
    t.equal(action?.payload, true);
    t.end();
});

test('MobileMenu: Snippet shows loader while saving', (t) => {
    const store = makeStore({
        saving: true,
    });
    
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const saveBtn = [...buttons].find((b) => b.textContent?.includes('Save'));
    
    t.ok(saveBtn?.querySelector('svg'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: Snippet save button disabled while saving', (t) => {
    const store = makeStore({
        saving: true,
    });
    
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const saveBtn = [...buttons].find((b) => b.textContent?.includes('Save'));
    
    t.ok((saveBtn as HTMLButtonElement)?.disabled);
    unmount();
    cleanup();
    t.end();
});

// ── Theme ──────────────────────────────────────────────────
test('MobileMenu: theme button toggles data-theme attribute', (t) => {
    globalThis.localStorage?.clear();
    const {container, unmount} = renderMenu();
    const btn = container.querySelector('.mobile-menu__theme')!;
    
    fireEvent.click(btn);
    const theme = document.documentElement.getAttribute('data-theme');
    
    unmount();
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('MobileMenu: theme button toggles back to light', (t) => {
    globalThis.localStorage?.clear();
    const {container, unmount} = renderMenu();
    const btn = container.querySelector('.mobile-menu__theme')!;
    
    fireEvent.click(btn);
    fireEvent.click(btn);
    
    const theme = document.documentElement.getAttribute('data-theme');
    
    unmount();
    cleanup();
    
    t.equal(theme, 'light');
    t.end();
});
