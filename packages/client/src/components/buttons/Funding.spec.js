import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import Funding from './Funding.js';

test('Funding: renders three funding options', (t) => {
    render(
        <Funding/>,
    );
    
    const buttons = document.querySelectorAll('li button');
    
    cleanup();
    
    t.equal(buttons.length, 3);
    t.end();
});

test('Funding: first option is patreon', (t) => {
    render(
        <Funding/>,
    );
    
    const buttons = document.querySelectorAll('li button');
    
    cleanup();
    const result = buttons[0].textContent.includes('patreon');
    
    t.ok(result);
    t.end();
});

test('Funding: click calls globalThis.open', (t) => {
    const origOpen = globalThis.open;
    let openedUrl;
    
    globalThis.open = (url) => {
        openedUrl = url;
    };
    
    render(
        <Funding/>,
    );
    
    const buttons = document.querySelectorAll('li button');
    
    fireEvent.click(buttons[0]);
    
    cleanup();
    globalThis.open = origOpen;
    
    t.equal(openedUrl, 'https://patreon.com/coderaiser');
    t.end();
});
