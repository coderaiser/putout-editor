import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import ThemeButton from './ThemeButton.tsx';
import {ToolbarMenuProvider} from './ToolbarMenuContext.tsx';

const clearTheme = () => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
};

const renderTheme = () => render(
    <ToolbarMenuProvider>
        <ThemeButton/>
    </ToolbarMenuProvider>,
);

const openTheme = () => fireEvent.click(document.querySelector('button')!);

test('ThemeButton: default theme is light on mount', (t) => {
    clearTheme();
    renderTheme();
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'light');
    t.end();
});

test('ThemeButton: renders moon svg icon in light mode', (t) => {
    clearTheme();
    renderTheme();
    
    const result = document.querySelector('button svg');
    
    cleanup();
    
    t.ok(result, 'theme icon svg rendered');
    t.end();
});

test('ThemeButton: sets dark theme on click', (t) => {
    clearTheme();
    renderTheme();
    fireEvent.click(document.querySelector('button')!);
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: persists theme to localStorage', (t) => {
    clearTheme();
    renderTheme();
    fireEvent.click(document.querySelector('button')!);
    
    const stored = localStorage.getItem('theme');
    
    cleanup();
    
    t.equal(stored, 'dark');
    t.end();
});

test('ThemeButton: reads persisted theme on mount', (t) => {
    clearTheme();
    localStorage.setItem('theme', 'dark');
    renderTheme();
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: toggles back to light on second click', (t) => {
    clearTheme();
    renderTheme();
    
    const button = document.querySelector('button')!;
    
    fireEvent.click(button);
    fireEvent.click(button);
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'light');
    t.end();
});

test('ThemeButton: sets theme via menu item click', (t) => {
    clearTheme();
    renderTheme();
    openTheme();
    fireEvent.click(document.querySelectorAll('li')[1]!);
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: menu item click persists to localStorage', (t) => {
    clearTheme();
    renderTheme();
    openTheme();
    fireEvent.click(document.querySelectorAll('li')[1]!);
    
    const stored = localStorage.getItem('theme');
    
    cleanup();
    
    t.equal(stored, 'dark');
    t.end();
});

test('ThemeButton: trigger has aria-expanded false when closed', (t) => {
    clearTheme();
    renderTheme();
    
    const result = document.querySelector('button')!.getAttribute('aria-expanded');
    
    cleanup();
    
    t.equal(result, 'false');
    t.end();
});

test('ThemeButton: outside click closes menu', (t) => {
    clearTheme();
    renderTheme();
    openTheme();
    fireEvent.mouseDown(document.body);
    const result = document.querySelector('ul');
    
    cleanup();
    
    t.notOk(result);
    t.end();
});
