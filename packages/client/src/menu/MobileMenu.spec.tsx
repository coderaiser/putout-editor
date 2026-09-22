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
import MobileMenu from './MobileMenu.tsx';
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
    const actions: UnknownAction[] = [];
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
    const actions: UnknownAction[] = [];
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
    const actions: UnknownAction[] = [];
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
    const actions: UnknownAction[] = [];
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

test('MobileMenu: Parser dropdown lists parsers from category', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    
    const parserItems = [...container.querySelectorAll('.mobile-dropdown__menu li')].filter((li) => !li.textContent?.includes('Settings'));
    
    const names = [];
    
    for (const li of parserItems) {
        names.push(li.textContent?.trim());
    }
    
    unmount();
    cleanup();
    
    t.deepEqual(names, [
        'babel',
        'espree',
        'esprima',
        'acorn',
    ]);
    t.end();
});

test('MobileMenu: parser Settings button enabled when hasSettings returns true', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[1]);
    
    const buttons = [...container.querySelectorAll('.mobile-dropdown__menu button')];
    const settingsBtn = buttons.find((b) => b.textContent?.includes('Settings'));
    
    unmount();
    cleanup();
    
    t.notOk((settingsBtn as HTMLButtonElement | undefined)?.disabled);
    t.end();
});

test('MobileMenu: Snippet New clears location hash', (t) => {
    globalThis.location.hash = '#/gist/abc';
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    const buttons = container.querySelectorAll('[data-testid="new-submenu"] button');
    const defaultBtn = [...buttons].find((b) => b.textContent?.includes('Default'));
    
    fireEvent.click(defaultBtn!);
    const {hash} = globalThis.location;
    
    unmount();
    cleanup();
    
    t.equal(hash, '');
    t.end();
});

test('MobileMenu: Snippet New dispatches reset when no hash', (t) => {
    globalThis.location.hash = '';
    const actions: UnknownAction[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    const buttons = container.querySelectorAll('[data-testid="new-submenu"] button');
    const defaultBtn = [...buttons].find((b) => b.textContent?.includes('Default'));
    
    fireEvent.click(defaultBtn!);
    const action = actions.find((a) => a.type?.includes('reset'));
    
    unmount();
    cleanup();
    
    t.ok(action);
    t.end();
});

test('MobileMenu: Snippet Share renders share svg icon', (t) => {
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    const buttons = container.querySelectorAll('.mobile-dropdown__menu button');
    const shareBtn = [...buttons].find((b) => b.textContent?.includes('Share'));
    
    const svg = shareBtn?.querySelector('svg');
    
    unmount();
    cleanup();
    
    t.ok(svg, 'share icon svg rendered');
    t.end();
});

test('MobileMenu: Snippet shows Fork when can fork and not save', (t) => {
    const store = makeStore({
        activeRevision: makeRevision({
            canSave: () => false,
        }),
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
    const actions: UnknownAction[] = [];
    const store = makeStore({
        activeRevision: makeRevision({
            canSave: () => false,
        }),
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

// ── Mutual exclusion ─────────────────────────────────────────
test('MobileMenu: opening Parser closes Snippet', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    fireEvent.pointerUp(triggers[0]); // open Snippet
    fireEvent.pointerUp(triggers[1]);
    
    // open Parser
    t.equal(container.querySelectorAll('.mobile-dropdown__menu').length, 1);
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: opening Snippet closes Parser', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    fireEvent.pointerUp(triggers[1]); // open Parser
    fireEvent.pointerUp(triggers[0]);
    
    // open Snippet
    t.equal(container.querySelectorAll('.mobile-dropdown__menu').length, 1);
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: active dropdown is the last one opened', (t) => {
    const {container, unmount} = renderMenu();
    const triggers = container.querySelectorAll('.mobile-dropdown__trigger');
    
    fireEvent.pointerUp(triggers[0]);
    fireEvent.pointerUp(triggers[1]);
    
    t.equal(triggers[1].getAttribute('aria-expanded'), 'true');
    unmount();
    cleanup();
    t.end();
});

// ── New template submenu ─────────────────────────────────────
test('MobileMenu: New trigger appears inside Snippet dropdown', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    
    t.ok(container.textContent?.includes('New'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: New submenu opens on New trigger click', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.ok(container.querySelector('[data-testid="new-submenu"]'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: New submenu contains Default item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.ok(container.textContent?.includes('Default'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: New submenu contains Replacer item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.ok(container.textContent?.includes('Replacer'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: New submenu contains Traverser item', (t) => {
    const {container, unmount} = renderMenu();
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.ok(container.textContent?.includes('Traverser'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: picking Replacer dispatches reset with template', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    const replacerBtn = [...container.querySelectorAll('[data-testid="new-submenu"] button')].find((b) => b.textContent?.includes('Replacer'));
    
    fireEvent.click(replacerBtn!);
    const action = actions.find((a) => a.type?.includes('reset'));
    
    unmount();
    cleanup();
    
    t.ok((action?.payload as string)?.includes('convert-ternary-to-if'));
    t.end();
});

test('MobileMenu: Default item dispatches reset with no template', (t) => {
    const actions: UnknownAction[] = [];
    const store = makeStore({}, actions);
    const {container, unmount} = renderMenu(store);
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    const defaultBtn = [...container.querySelectorAll('[data-testid="new-submenu"] button')].find((b) => b.textContent?.includes('Default'));
    
    fireEvent.click(defaultBtn!);
    const action = actions.find((a) => a.type?.includes('reset'));
    
    unmount();
    cleanup();
    
    t.equal(action?.payload, undefined);
    t.end();
});

test('MobileMenu: clicking New trigger keeps submenu open', (t) => {
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    fireEvent.click(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.ok(container.querySelector('[data-testid="new-submenu"]'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: second tap on New collapses submenu back to Snippet', (t) => {
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    
    t.notOk(container.querySelector('[data-testid="new-submenu"]'));
    unmount();
    cleanup();
    t.end();
});

test('MobileMenu: picking Replacer closes the menus', (t) => {
    globalThis.location.hash = '';
    const {container, unmount} = renderMenu();
    
    fireEvent.pointerUp(container.querySelectorAll('.mobile-dropdown__trigger')[0]);
    fireEvent.pointerUp(container.querySelector('[data-testid="new-trigger"]')!);
    const replacerBtn = [...container.querySelectorAll('[data-testid="new-submenu"] button')].find((b) => b.textContent?.includes('Replacer'));
    
    fireEvent.click(replacerBtn!);
    
    t.notOk(container.querySelector('[data-testid="new-submenu"]'));
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
