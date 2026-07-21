import {test} from 'supertape';
import {
    render,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import CompactArrayView from './CompactArrayView.js';

test('CompactArrayView: empty array renders empty brackets', (t) => {
    render(<CompactArrayView array={[]}/>);
    
    const el = document.querySelector('.p');
    
    cleanup();
    
    t.equal(el.textContent, '[ ]');
    t.end();
});

test('CompactArrayView: single element renders count', (t) => {
    render(<CompactArrayView array={['x']}/>);
    
    const placeholder = document.querySelector('.placeholder');
    
    cleanup();
    
    t.equal(placeholder.textContent, '1 element');
    t.end();
});

test('CompactArrayView: multiple elements uses plural', (t) => {
    render(<CompactArrayView array={['a', 'b', 'c']}/>);
    
    const placeholder = document.querySelector('.placeholder');
    
    cleanup();
    
    t.equal(placeholder.textContent, '3 elements');
    t.end();
});

test('CompactArrayView: onClick called when placeholder clicked', (t) => {
    let called = false;
    
    render(
        <CompactArrayView
            array={[1, 2]}
            onClick={() => {
                called = true;
            }}
        />,
    );
    
    fireEvent.click(document.querySelector('.placeholder'));
    
    cleanup();
    
    t.ok(called);
    t.end();
});

test('CompactArrayView: array-like object with length works', (t) => {
    render(<CompactArrayView array={{length: 5}}/>);
    
    const placeholder = document.querySelector('.placeholder');
    
    cleanup();
    
    t.equal(placeholder.textContent, '5 elements');
    t.end();
});
