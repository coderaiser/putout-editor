import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import MobileDropdown from './MobileDropdown.js';

function renderDropdown(props = {}) {
    const children = (
        <>
            <li key="a">
                <button type="button">A</button>
            </li>
            <li key="b">
                <button type="button">B</button>
            </li>
        </>
    );
    
    return render(
        <MobileDropdown trigger="open" {...props}>
            {children}
        </MobileDropdown>,
    );
}

test('MobileDropdown: renders trigger button', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    cleanup();
    
    t.ok(trigger, 'trigger button rendered');
    t.end();
});

test('MobileDropdown: menu is not visible initially', (t) => {
    const {container} = renderDropdown();
    
    const menu = container.querySelector('.mobile-dropdown-menu');
    
    cleanup();
    
    t.notOk(menu, 'menu not rendered when closed');
    t.end();
});

test('MobileDropdown: menu opens on trigger click', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    
    const menu = container.querySelector('.mobile-dropdown-menu');
    
    cleanup();
    
    t.ok(menu, 'menu rendered when open');
    t.end();
});

test('MobileDropdown: menu closes on second trigger click', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    
    const menu = container.querySelector('.mobile-dropdown-menu');
    
    cleanup();
    
    t.notOk(menu, 'menu closed after second click');
    t.end();
});

test('MobileDropdown: menu closes when item is clicked', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    
    const item = container.querySelector('.mobile-dropdown-menu button');
    fireEvent.click(item);
    
    const menu = container.querySelector('.mobile-dropdown-menu');
    
    cleanup();
    
    t.notOk(menu, 'menu closed after item click');
    t.end();
});

test('MobileDropdown: menu closes on outside pointerdown', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    
    fireEvent.pointerDown(document.body);
    
    const menu = container.querySelector('.mobile-dropdown-menu');
    
    cleanup();
    
    t.notOk(menu, 'menu closed after outside pointerdown');
    t.end();
});

test('MobileDropdown: trigger has aria-expanded=false when closed', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    cleanup();
    const result = trigger.getAttribute('aria-expanded');
    const expected = 'false';
    
    t.equal(result, expected);
    t.end();
});

test('MobileDropdown: trigger has aria-expanded=true when open', (t) => {
    const {container} = renderDropdown();
    
    const trigger = container.querySelector('.mobile-dropdown-trigger');
    
    fireEvent.click(trigger);
    const result = trigger.getAttribute('aria-expanded');
    const expected = 'true';
    
    cleanup();
    
    t.equal(result, expected);
    t.end();
});
