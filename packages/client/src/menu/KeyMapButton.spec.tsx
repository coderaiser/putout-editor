import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import KeyMapButton from './KeyMapButton.tsx';
import type {KeyMap} from '../types.ts';
import {ToolbarMenuProvider} from './ToolbarMenuContext.tsx';

const noop = () => {};
const renderKeyMap = (keyMap: KeyMap = 'default', onKeyMapChange: (keyMap: KeyMap) => void = noop) => render(
    <ToolbarMenuProvider>
        <KeyMapButton keyMap={keyMap} onKeyMapChange={onKeyMapChange}/>
    </ToolbarMenuProvider>,
);

const openKeyMap = () => fireEvent.click(document.querySelector('.menuButton > button')!);

test('KeyMapButton: renders current keyMap text', (t) => {
    renderKeyMap('vim');
    
    const result = document.querySelector('.menuButton > button')?.textContent.includes('vim') || false;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('KeyMapButton: renders keyboard svg icon', (t) => {
    renderKeyMap();
    
    const result = document.querySelector('.menuButton > button svg');
    
    cleanup();
    
    t.ok(result, 'keyboard icon svg rendered');
    t.end();
});

test('KeyMapButton: renders four key map options', (t) => {
    renderKeyMap();
    openKeyMap();
    
    const result = document.querySelectorAll('li button').length;
    
    cleanup();
    
    t.equal(result, 3);
    t.end();
});

test('KeyMapButton: click on item calls onKeyMapChange', (t) => {
    let changed: KeyMap | undefined;
    
    renderKeyMap('default', (value) => {
        changed = value;
    });
    openKeyMap();
    fireEvent.click(document.querySelectorAll('li')[1]!);
    cleanup();
    
    t.equal(changed, 'vim');
    t.end();
});

test('KeyMapButton: item with matching keyMap has disabled class', (t) => {
    renderKeyMap('emacs');
    openKeyMap();
    
    const result = document.querySelectorAll('li')[2]?.className.includes('disabled') || false;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('KeyMapButton: clicking item closes menu', (t) => {
    renderKeyMap();
    openKeyMap();
    fireEvent.click(document.querySelector('li')!);
    
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

test('KeyMapButton: clicking trigger opens menu', (t) => {
    renderKeyMap();
    openKeyMap();
    
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('KeyMapButton: second trigger click closes menu', (t) => {
    renderKeyMap();
    
    const trigger = document.querySelector('.menuButton > button')!;
    
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});
