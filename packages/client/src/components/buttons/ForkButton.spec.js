import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import ForkButton from './ForkButton.js';

test('ForkButton: disabled when canFork is false', (t) => {
    render(
        <ForkButton canFork={false} saving={false} forking={false}/>,
    );
    
    const button = document.querySelector('button');
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: disabled when saving', (t) => {
    render(
        <ForkButton canFork={true} saving={true} forking={false}/>,
    );
    
    const button = document.querySelector('button');
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: disabled when forking', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={true}/>,
    );
    
    const button = document.querySelector('button');
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('ForkButton: enabled when canFork true and not busy', (t) => {
    render(
        <ForkButton canFork={true} saving={false} forking={false}/>,
    );
    
    const button = document.querySelector('button');
    
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
    
    fireEvent.click(document.querySelector('button'));
    cleanup();
    
    t.ok(called);
    t.end();
});
