import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
    screen,
} from '@testing-library/react';
import NewButton from './NewButton.tsx';

test('NewButton: renders menuButton wrapper', (t) => {
    render(
        <NewButton/>,
    );
    
    const wrapper = document.querySelector('[data-testid="new-menu"]');
    
    cleanup();
    
    t.ok(wrapper);
    t.end();
});

test('NewButton: renders submenu', (t) => {
    render(
        <NewButton/>,
    );
    
    const submenu = document.querySelector('[data-testid="new-submenu"]');
    
    cleanup();
    
    t.ok(submenu);
    t.end();
});

test('NewButton: submenu has 14 items (Default + 13 categories)', (t) => {
    render(
        <NewButton/>,
    );
    
    const items = screen.getAllByRole('menuitem');
    
    cleanup();
    
    t.equal(items.length, 14);
    t.end();
});

test('NewButton: first item is Default', (t) => {
    render(
        <NewButton/>,
    );
    
    const items = screen.getAllByRole('menuitem');
    
    cleanup();
    
    t.equal(items[0].textContent, 'Default');
    t.end();
});

test('NewButton: all items disabled when saving', (t) => {
    render(
        <NewButton saving={true}/>,
    );
    
    const items = screen.getAllByRole('menuitem') as HTMLButtonElement[];
    
    cleanup();
    
    t.ok(items.every((item) => item.disabled));
    t.end();
});

test('NewButton: all items disabled when forking', (t) => {
    render(
        <NewButton forking={true}/>,
    );
    
    const items = screen.getAllByRole('menuitem') as HTMLButtonElement[];
    
    cleanup();
    
    t.ok(items.every((item) => item.disabled));
    t.end();
});

test('NewButton: all items enabled when not saving or forking', (t) => {
    render(
        <NewButton saving={false} forking={false}/>,
    );
    
    const items = screen.getAllByRole('menuitem') as HTMLButtonElement[];
    
    cleanup();
    
    t.ok(items.every((item) => !item.disabled));
    t.end();
});

test('NewButton: Default calls onNew with no argument', (t) => {
    let received: string | undefined = 'sentinel';
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getAllByRole('menuitem')[0]);
    cleanup();
    
    t.equal(received, undefined);
    t.end();
});

test('NewButton: Replacer calls onNew with replacer template string', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'Replacer',
    }));
    cleanup();
    
    t.ok(received?.includes('convert-ternary-to-if'));
    t.end();
});

test('NewButton: Traverser calls onNew with traverser template string', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'Traverser',
    }));
    cleanup();
    
    t.ok(received?.includes('merge-duplicate-imports'));
    t.end();
});

test('NewButton: Declarator calls onNew with declare template', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'Declarator',
    }));
    cleanup();
    
    t.ok(received?.includes('export const declare'));
    t.end();
});

test('NewButton: Scanner calls onNew with scan template', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'Scanner',
    }));
    cleanup();
    
    t.ok(received?.includes('export const scan'));
    t.end();
});

test('NewButton: JSON calls onNew with __json template', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'JSON',
    }));
    cleanup();
    
    t.ok(received?.includes('__json'));
    t.end();
});

test('NewButton: Ignore calls onNew with __ignore template', (t) => {
    let received: string | undefined;
    const onNew = (template?: string) => {
        received = template;
    };
    
    render(
        <NewButton onNew={onNew}/>,
    );
    fireEvent.click(screen.getByRole('menuitem', {
        name: 'Ignore',
    }));
    cleanup();
    
    t.ok(received?.includes('__ignore'));
    t.end();
});

test('NewButton: renders TbFilePlus icon', (t) => {
    render(
        <NewButton/>,
    );
    
    const svg = document.querySelector('[data-testid="new-menu"] svg');
    
    cleanup();
    
    t.ok(svg);
    t.end();
});
