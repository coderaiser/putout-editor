import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import MobileDropdown from './MobileDropdown.tsx';

const renderDropdown = (props = {}) => render(
    <MobileDropdown trigger="Open" {...props}>
        <li><button type="button">Item</button></li>
    </MobileDropdown>,
);

test('MobileDropdown: renders trigger button', (t) => {
    const {container, unmount} = renderDropdown();
    t.ok(container.querySelector('button.mobile-dropdown__trigger'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu is hidden initially', (t) => {
    const {container, unmount} = renderDropdown();
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu opens on trigger click', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    t.ok(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu closes on second trigger click', (t) => {
    const {container, unmount} = renderDropdown();
    const trigger = container.querySelector('.mobile-dropdown__trigger')!;
    
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu closes when item inside is clicked', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    fireEvent.click(container.querySelector('.mobile-dropdown__menu')!);
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu closes on outside pointerdown', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    fireEvent.pointerDown(document.body);
    t.notOk(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: menu stays open on inside pointerdown', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    fireEvent.pointerDown(container.querySelector('.mobile-dropdown__menu')!);
    t.ok(container.querySelector('.mobile-dropdown__menu'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: trigger has aria-expanded=false when closed', (t) => {
    const {container, unmount} = renderDropdown();
    t.equal(container.querySelector('.mobile-dropdown__trigger')!.getAttribute('aria-expanded'), 'false');
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: trigger has aria-expanded=true when open', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    t.equal(container.querySelector('.mobile-dropdown__trigger')!.getAttribute('aria-expanded'), 'true');
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: trigger has aria-haspopup=menu', (t) => {
    const {container, unmount} = renderDropdown();
    t.equal(container.querySelector('.mobile-dropdown__trigger')!.getAttribute('aria-haspopup'), 'menu');
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: applies className to wrapper', (t) => {
    const {container, unmount} = renderDropdown({
        className: 'my-class',
    });
    
    t.ok(container.querySelector('.mobile-dropdown.my-class'));
    unmount();
    cleanup();
    t.end();
});

test('MobileDropdown: renders children inside menu when open', (t) => {
    const {container, unmount} = renderDropdown();
    fireEvent.click(container.querySelector('.mobile-dropdown__trigger')!);
    t.ok(container.querySelector('.mobile-dropdown__menu li'));
    unmount();
    cleanup();
    t.end();
});
