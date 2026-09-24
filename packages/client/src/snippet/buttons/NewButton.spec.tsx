import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
    screen,
} from '@testing-library/react';
import NewButton from './NewButton.tsx';
import {ToolbarMenuProvider} from '../../store/ToolbarMenuContext.tsx';

const renderNew = (props: {
    saving?: boolean;
    forking?: boolean;
    onNew?: (template?: string, fixture?: string) => void;
} = {}) => render(
    <ToolbarMenuProvider>
        <NewButton {...props}/>
    </ToolbarMenuProvider>,
);

const openNew = () => fireEvent.click(document.querySelector('[data-testid="new-menu"] > span')!);

test('NewButton: renders menuButton wrapper', (t) => {
    renderNew();
    const wrapper = document.querySelector('[data-testid="new-menu"]');
    cleanup();
    t.ok(wrapper);
    t.end();
});

test('NewButton: submenu hidden when closed', (t) => {
    renderNew();
    const submenu = document.querySelector('[data-testid="new-submenu"]');
    cleanup();
    t.notOk(submenu);
    t.end();
});

test('NewButton: submenu visible after span click', (t) => {
    renderNew();
    openNew();
    const submenu = document.querySelector('[data-testid="new-submenu"]');
    cleanup();
    t.ok(submenu);
    t.end();
});

test('NewButton: submenu hidden after second span click', (t) => {
    renderNew();
    const trigger = document.querySelector('[data-testid="new-menu"] > span')!;
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    const submenu = document.querySelector('[data-testid="new-submenu"]');
    cleanup();
    t.notOk(submenu);
    t.end();
});

test('NewButton: aria-expanded false when closed', (t) => {
    renderNew();
    const result = document.querySelector('[data-testid="new-menu"] > span')!.getAttribute('aria-expanded');
    cleanup();
    t.equal(result, 'false');
    t.end();
});

test('NewButton: aria-expanded true when open', (t) => {
    renderNew();
    openNew();
    const result = document.querySelector('[data-testid="new-menu"] > span')!.getAttribute('aria-expanded');
    cleanup();
    t.equal(result, 'true');
    t.end();
});

test('NewButton: submenu has 13 items', (t) => {
    renderNew();
    openNew();
    const items = screen.getAllByRole('menuitem');
    cleanup();
    t.equal(items.length, 13);
    t.end();
});

test('NewButton: first item is Replacer', (t) => {
    renderNew();
    openNew();
    const result = screen.getAllByRole('menuitem')[0].textContent;
    cleanup();
    t.equal(result, 'Replacer');
    t.end();
});

test('NewButton: all items disabled when saving', (t) => {
    renderNew({saving: true});
    openNew();
    const result = (screen.getAllByRole('menuitem') as HTMLButtonElement[]).every((item) => item.disabled);
    cleanup();
    t.ok(result);
    t.end();
});

test('NewButton: all items disabled when forking', (t) => {
    renderNew({forking: true});
    openNew();
    const result = (screen.getAllByRole('menuitem') as HTMLButtonElement[]).every((item) => item.disabled);
    cleanup();
    t.ok(result);
    t.end();
});

test('NewButton: all items enabled when not saving or forking', (t) => {
    renderNew({saving: false, forking: false});
    openNew();
    const result = (screen.getAllByRole('menuitem') as HTMLButtonElement[]).every((item) => !item.disabled);
    cleanup();
    t.ok(result);
    t.end();
});

test('NewButton: Replacer passes template and fixture', (t) => {
    let template: string | undefined;
    let fixture: string | undefined;
    renderNew({
        onNew: (nextTemplate, nextFixture) => {
            template = nextTemplate;
            fixture = nextFixture;
        },
    });
    openNew();
    fireEvent.click(screen.getByRole('menuitem', {name: 'Replacer'}));
    cleanup();
    t.ok(template?.includes('convert-ternary-to-if') && fixture?.includes('?'));
    t.end();
});

test('NewButton: Traverser passes template and fixture', (t) => {
    let template: string | undefined;
    let fixture: string | undefined;
    renderNew({
        onNew: (nextTemplate, nextFixture) => {
            template = nextTemplate;
            fixture = nextFixture;
        },
    });
    openNew();
    fireEvent.click(screen.getByRole('menuitem', {name: 'Traverser'}));
    cleanup();
    t.ok(template?.includes('merge-duplicate-imports') && fixture?.includes("import {a} from 'x'"));
    t.end();
});

test('NewButton: JSON passes template and fixture', (t) => {
    let template: string | undefined;
    let fixture: string | undefined;
    renderNew({
        onNew: (nextTemplate, nextFixture) => {
            template = nextTemplate;
            fixture = nextFixture;
        },
    });
    openNew();
    fireEvent.click(screen.getByRole('menuitem', {name: 'JSON'}));
    cleanup();
    t.ok(template?.includes('__json') && fixture?.includes('__putout_processor_json'));
    t.end();
});

test('NewButton: renders TbFilePlus icon', (t) => {
    renderNew();
    const svg = document.querySelector('[data-testid="new-menu"] svg');
    cleanup();
    t.ok(svg);
    t.end();
});
