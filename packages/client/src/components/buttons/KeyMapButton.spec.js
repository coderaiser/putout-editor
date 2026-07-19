import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import KeyMapButton from './KeyMapButton.js';

const noop = () => {};

test('KeyMapButton: renders current keyMap text', (t) => {
    render(
        <KeyMapButton keyMap="vim" onKeyMapChange={noop}/>,
    );
    
    const trigger = document.querySelector('.menuButton > button');
    
    cleanup();
    const result = trigger.textContent.includes('vim');
    
    t.ok(result);
    t.end();
});

test('KeyMapButton: renders four key map options', (t) => {
    render(
        <KeyMapButton keyMap="default" onKeyMapChange={noop}/>,
    );
    
    const items = document.querySelectorAll('li button');
    
    cleanup();
    
    t.equal(items.length, 4);
    t.end();
});

test('KeyMapButton: click on item calls onKeyMapChange', (t) => {
    let changed;
    
    const onKeyMapChange = (v) => {
        changed = v;
    };
    
    render(
        <KeyMapButton keyMap="default" onKeyMapChange={onKeyMapChange}/>,
    );
    
    const items = document.querySelectorAll('li');
    
    fireEvent.click(items[1]);
    
    cleanup();
    
    t.equal(changed, 'vim');
    t.end();
});

test('KeyMapButton: item with matching keyMap has disabled attribute set', (t) => {
    render(
        <KeyMapButton keyMap="emacs" onKeyMapChange={noop}/>,
    );
    
    const items = document.querySelectorAll('li');
    
    cleanup();
    const result = items[2].hasAttribute('disabled');
    
    t.ok(result);
    t.end();
});
