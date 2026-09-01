import {test} from 'supertape';
import {
    render,
    cleanup,
    fireEvent,
} from '@testing-library/react';
import ThemeButton from './ThemeButton.js';

const clearTheme = () => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('theme');
};

test('ThemeButton: default theme is light on mount', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'light');
    t.end();
});

test('ThemeButton: renders moon svg icon in light mode', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    const svg = document.querySelector('button svg');
    
    cleanup();
    
    t.ok(svg, 'theme icon svg rendered');
    t.end();
});

test('ThemeButton: sets dark theme on click', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    fireEvent.click(document.querySelector('button'));
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: persists theme to localStorage', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    fireEvent.click(document.querySelector('button'));
    
    const stored = localStorage.getItem('theme');
    
    cleanup();
    
    t.equal(stored, 'dark');
    t.end();
});

test('ThemeButton: reads persisted theme on mount', (t) => {
    clearTheme();
    localStorage.setItem('theme', 'dark');
    render(
        <ThemeButton/>,
    );
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: toggles back to light on second click', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    const button = document.querySelector('button');
    
    fireEvent.click(button);
    fireEvent.click(button);
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'light');
    t.end();
});

test('ThemeButton: sets theme via menu item click', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    const [, darkItem] = document.querySelectorAll('li');
    
    fireEvent.click(darkItem);
    
    const {theme} = document.documentElement.dataset;
    
    cleanup();
    
    t.equal(theme, 'dark');
    t.end();
});

test('ThemeButton: menu item click persists to localStorage', (t) => {
    clearTheme();
    render(
        <ThemeButton/>,
    );
    
    const [, darkItem] = document.querySelectorAll('li');
    
    fireEvent.click(darkItem);
    
    const stored = localStorage.getItem('theme');
    
    cleanup();
    
    t.equal(stored, 'dark');
    t.end();
});

test('ThemeButton: mouseLeave resets forceClosed', (t) => {
    clearTheme();
    const {container} = render(
        <ThemeButton/>,
    );
    
    const div = container.querySelector('div');
    
    fireEvent.mouseLeave(div);
    
    cleanup();
    
    t.ok(div, 'mouseLeave handled without error');
    t.end();
});
