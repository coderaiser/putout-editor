import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import PrettierButton from './PrettierButton.js';

test('PrettierButton: toggleFormatting called on click', (t) => {
    let called = false;
    const toggleFormatting = () => {
        called = true;
    };
    
    render(<PrettierButton toggleFormatting={toggleFormatting} enableFormatting={false}/>);
    
    const button = document.querySelector('button');
    
    fireEvent.click(button);
    
    cleanup();
    
    t.ok(called, 'toggleFormatting invoked');
    t.end();
});
