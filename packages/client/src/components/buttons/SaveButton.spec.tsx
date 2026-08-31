import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
    screen,
} from '@testing-library/react';
import SaveButton from './SaveButton.tsx';

test('SaveButton: disabled when canSave is false', (t) => {
    render(
        <SaveButton canSave={false} saving={false} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('SaveButton: disabled when saving', (t) => {
    render(
        <SaveButton canSave={true} saving={true} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('SaveButton: disabled when forking', (t) => {
    render(
        <SaveButton canSave={true} saving={false} forking={true}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('SaveButton: enabled when canSave true and not busy', (t) => {
    render(
        <SaveButton canSave={true} saving={false} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.notOk(button.disabled);
    t.end();
});

test('SaveButton: onSave called on click', (t) => {
    let called = false;
    const onSave = () => {
        called = true;
    };
    
    render(
        <SaveButton canSave={true} saving={false} forking={false} onSave={onSave}/>,
    );
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    cleanup();
    
    t.ok(called);
    t.end();
});

test('SaveButton: renders floppy svg icon', (t) => {
    render(
        <SaveButton canSave={true} saving={false} forking={false}/>,
    );
    const svg = screen
        .getByRole('button')
        .querySelector('svg');
    
    cleanup();
    
    t.ok(svg, 'floppy icon svg rendered');
    t.end();
});

test('SaveButton: renders loader svg icon while saving', (t) => {
    render(
        <SaveButton canSave={true} saving={true} forking={false}/>,
    );
    const svg = screen
        .getByRole('button')
        .querySelector('svg');
    
    cleanup();
    
    t.ok(svg, 'spinner icon svg rendered');
    t.end();
});
