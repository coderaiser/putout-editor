import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
    screen,
} from '@testing-library/react';
import ForkButton from './ForkButton.tsx';

test('ForkButton: disabled when canFork is false', (t) => {
    render(
        <ForkButton canFork={false} saving={false} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: disabled when saving', (t) => {
    render(
        <ForkButton canFork={true} saving={true} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: disabled when forking', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={true}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: enabled when canFork true and not busy', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={false}/>,
    );
    const button = screen.getByRole('button') as HTMLButtonElement;
    
    cleanup();
    
    t.notOk(button.disabled);
    t.end();
});

test('ForkButton: onFork called on click', (t) => {
    let called = false;
    const onFork = () => {
        called = true;
    };
    
    render(
        <ForkButton canFork={true} saving={false} forking={false} onFork={onFork}/>,
    );
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    cleanup();
    
    t.ok(called);
    t.end();
});

test('ForkButton: renders fork svg icon', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={false}/>,
    );
    const svg = screen
        .getByRole('button')
        .querySelector('svg');
    
    cleanup();
    
    t.ok(svg, 'fork icon svg rendered');
    t.end();
});

test('ForkButton: renders loader svg icon while forking', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={true}/>,
    );
    const svg = screen
        .getByRole('button')
        .querySelector('svg');
    
    cleanup();
    
    t.ok(svg, 'spinner icon svg rendered');
    t.end();
});
