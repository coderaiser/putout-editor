import {test} from 'supertape';
import {
    render,
    screen,
    fireEvent,
    cleanup,
} from '@testing-library/react';
import MobileLayout from './MobileLayout.js';

const panels = {
    topLeft: <div>source</div>,
    topRight: <div>ast</div>,
    bottomLeft: <div>transform</div>,
    bottomRight: <div>code</div>,
};

test('MobileLayout: shows transform panel by default', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    
    const result = screen.getByText('transform');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('MobileLayout: shows source panel after clicking Source tab', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    fireEvent.click(screen.getByText('Source'));
    
    const result = screen.getByText('source');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('MobileLayout: shows ast panel after clicking AST tab', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    fireEvent.click(screen.getByText('AST'));
    
    const result = screen.getByText('ast');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('MobileLayout: shows code panel after clicking Code tab', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    fireEvent.click(screen.getByText('Code'));
    
    const result = screen.getByText('code');
    
    cleanup();
    
    t.ok(result);
    t.end();
});

test('MobileLayout: shows all four tab buttons', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    
    const count = screen.getAllByRole('tab').length;
    
    cleanup();
    
    t.equal(count, 4);
    t.end();
});

test('MobileLayout: active tab has active class', (t) => {
    const {container} = render(
        <MobileLayout {...panels}/>,
    );
    const activeButton = container.querySelector('button.active');
    
    cleanup();
    
    t.equal(activeButton?.textContent, 'Transform');
    t.end();
});

test('MobileLayout: active class moves to clicked tab', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    fireEvent.click(screen.getByText('Source'));
    const activeButton = document.querySelector('button.active');
    
    cleanup();
    
    t.equal(activeButton?.textContent, 'Source');
    t.end();
});

test('MobileLayout: Transform tab has aria-selected=true by default', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    
    const transformTab = screen.getByRole('tab', {
        name: 'Transform',
    });
    
    cleanup();
    
    t.equal(transformTab.getAttribute('aria-selected'), 'true');
    t.end();
});

test('MobileLayout: Source tab has aria-selected=false by default', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    
    const sourceTab = screen.getByRole('tab', {
        name: 'Source',
    });
    
    cleanup();
    
    t.equal(sourceTab.getAttribute('aria-selected'), 'false');
    t.end();
});

test('MobileLayout: clicking Source sets aria-selected=true on Source button', (t) => {
    render(
        <MobileLayout {...panels}/>,
    );
    
    const sourceTab = screen.getByRole('tab', {
        name: 'Source',
    });
    
    fireEvent.click(sourceTab);
    
    cleanup();
    
    t.equal(sourceTab.getAttribute('aria-selected'), 'true');
    t.end();
});
