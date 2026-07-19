import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import {Button} from './Button.js';

const noop = () => {};

test('visualization: Button: renders button with name', (t) => {
    const Component = Button({
        selectedOutput: 1,
        setSelectedOutput: noop,
    });
    
    render(Component('Tree', 0));
    
    const btn = document.querySelector('button');
    
    cleanup();
    
    t.equal(btn.textContent, 'Tree');
    t.end();
});

test('visualization: Button: active class when index matches selectedOutput', (t) => {
    const Component = Button({
        selectedOutput: 0,
        setSelectedOutput: noop,
    });
    
    render(Component('Tree', 0));
    
    const btn = document.querySelector('button');
    
    cleanup();
    const result = btn.className.includes('active');
    
    t.ok(result);
    t.end();
});

test('visualization: Button: no active class when index differs from selectedOutput', (t) => {
    const Component = Button({
        selectedOutput: 1,
        setSelectedOutput: noop,
    });
    
    render(Component('JSON', 0));
    
    const btn = document.querySelector('button');
    
    cleanup();
    const result = btn.className.includes('active');
    
    t.notOk(result);
    t.end();
});

test('visualization: Button: click calls setSelectedOutput with value', (t) => {
    const calls = [];
    const setSelectedOutput = (v) => calls.push(v);
    
    const Component = Button({
        selectedOutput: 1,
        setSelectedOutput,
    });
    
    render(Component('JSON', 2));
    
    const btn = document.querySelector('button');
    
    fireEvent.click(btn);
    
    cleanup();
    
    t.equal(calls[0], '2');
    t.end();
});
