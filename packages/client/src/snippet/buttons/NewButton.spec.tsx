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

test('NewButton: submenu has 16 items (Default + 15 categories)', (t) => {
    render(
        <NewButton/>,
    );
    
    const items = screen.getAllByRole('menuitem');
    
    cleanup();
    
    t.equal(items.length, 16);
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

test('NewButton: renders TbFilePlus icon', (t) => {
    render(
        <NewButton/>,
    );
    
    const svg = document.querySelector('[data-testid="new-menu"] svg');
    
    cleanup();
    
    t.ok(svg);
    t.end();
});
