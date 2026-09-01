import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
    screen,
} from '@testing-library/react';
import NewButton from './NewButton.tsx';

test('NewButton: disabled when saving', (t) => {
    render(
        <NewButton saving={true} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('NewButton: disabled when forking', (t) => {
    render(
        <NewButton saving={false} forking={true}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('NewButton: enabled when not saving or forking', (t) => {
    render(
        <NewButton saving={false} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.notOk(button.disabled);
    t.end();
});

test('NewButton: onNew called on click', (t) => {
    let called = false;
    const onNew = () => {
        called = true;
    };
    
    render(
        <NewButton saving={false} forking={false} onNew={onNew}/>,
    );
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    cleanup();
    
    t.ok(called, 'onNew called');
    t.end();
});

test('NewButton: renders new file svg icon', (t) => {
    render(
        <NewButton saving={false} forking={false}/>,
    );
    const svg = screen
        .getByRole('button')
        .querySelector('svg');
    
    cleanup();
    
    t.ok(svg, 'new file icon svg rendered');
    t.end();
});
