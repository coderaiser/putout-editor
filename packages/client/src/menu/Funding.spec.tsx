import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import Funding from './Funding.tsx';
import {ToolbarMenuProvider} from './ToolbarMenuContext.tsx';

const renderFunding = () => render(
    <ToolbarMenuProvider>
        <Funding/>
    </ToolbarMenuProvider>,
);

const openFunding = () => fireEvent.click(document.querySelector('.menuButton > button')!);

test('Funding: renders three funding options', (t) => {
    renderFunding();
    openFunding();
    
    const buttons = document.querySelectorAll('li button');
    
    cleanup();
    
    t.equal(buttons.length, 3);
    t.end();
});

test('Funding: first option is patreon', (t) => {
    renderFunding();
    openFunding();
    
    const result = document.querySelector('li button')?.textContent.includes('patreon') || false;
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('Funding: click calls globalThis.open', (t) => {
    const origOpen = globalThis.open;
    let openedUrl: string | URL | null | undefined;
    
    globalThis.open = (url?: string | URL | undefined): Window | null => {
        openedUrl = url;
        return null;
    };
    renderFunding();
    openFunding();
    fireEvent.click(document.querySelector('li button')!);
    cleanup();
    globalThis.open = origOpen;
    
    t.equal(openedUrl, 'https://patreon.com/coderaiser');
    t.end();
});

test('Funding: renders heart svg icon', (t) => {
    renderFunding();
    
    const svg = document.querySelector('button svg');
    
    cleanup();
    
    t.ok(svg, 'heart icon svg rendered');
    t.end();
});

test('Funding: outside click closes menu', (t) => {
    renderFunding();
    openFunding();
    fireEvent.mouseDown(document.body);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});

