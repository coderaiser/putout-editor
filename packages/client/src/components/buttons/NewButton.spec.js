import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import NewButton from './NewButton.js';

test('NewButton: disabled when saving', (t) => {
    render(
        <NewButton saving={true} forking={false}/>,
    );
    
    const button = document.querySelector('button');
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('NewButton: disabled when forking', (t) => {
    render(
        <NewButton saving={false} forking={true}/>,
    );
    
    const button = document.querySelector('button');
    
    cleanup();
    
    t.ok(button.disabled);
    t.end();
});

test('NewButton: enabled when not saving or forking', (t) => {
    render(
        <NewButton saving={false} forking={false}/>,
    );
    
    const button = document.querySelector('button');
    
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
    
    const button = document.querySelector('button');
    
    fireEvent.click(button);
    
    cleanup();
    
    t.ok(called, 'onNew called');
    t.end();
});
