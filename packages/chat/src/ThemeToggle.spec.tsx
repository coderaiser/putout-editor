import {test} from 'supertape';
import {
    fireEvent,
    render,
    cleanup,
} from '@testing-library/react';
import ThemeToggle, {
    applyTheme,
    currentTheme,
    nextTheme,
} from './ThemeToggle.tsx';

/**
 * jsdom answers `matchMedia` with a stub whose `matches` is always false, so
 * the dark arm of `currentTheme`'s fallback is unreachable without this. The
 * stub is installed rather than mutated so each spec starts from a known
 * answer — a shared `matches = true` leaking into the next test would make the
 * light arm the unreachable one instead.
 */
const noop = () => {};

/**
 * jsdom answers `matchMedia` with a stub whose `matches` is always false, so
 * the dark arm of `currentTheme`'s fallback is unreachable without this. The
 * stub is installed rather than mutated so each spec starts from a known
 * answer — a shared `matches = true` leaking into the next test would make the
 * light arm the unreachable one instead.
 */
const setPrefersDark = (dark: boolean): void => {
    globalThis.matchMedia = ((query: string) => ({
        matches: dark && query.includes('dark'),
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
    })) as typeof matchMedia;
};

test('theme: nextTheme flips both ways', (t) => {
    const result = [
        nextTheme('light'),
        nextTheme('dark'),
    ];
    
    const expected = [
        'dark',
        'light',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('theme: applyTheme writes the editor key and the attribute', (t) => {
    applyTheme('dark');
    
    const stored = localStorage.getItem('theme');
    const attribute = document.documentElement.getAttribute('data-theme');
    
    const result = [stored, attribute];
    
    const expected = [
        'dark',
        'dark',
    ];
    
    t.deepEqual(result, expected);
    t.end();
});

test('theme: currentTheme reads what applyTheme stored', (t) => {
    applyTheme('light');
    
    const result = currentTheme();
    const expected = ['light'];
    
    t.deepEqual([result], expected);
    t.end();
});

test('theme: currentTheme falls back to the OS preference', (t) => {
    localStorage.removeItem('theme');
    setPrefersDark(false);
    
    const result = currentTheme();
    const expected = ['light'];
    
    t.deepEqual([result], expected);
    t.end();
});

test('theme: with no stored choice, a dark system means dark', (t) => {
    localStorage.removeItem('theme');
    setPrefersDark(true);
    
    const result = currentTheme();
    const expected = ['dark'];
    
    t.deepEqual([result], expected);
    t.end();
});

test('theme: currentTheme ignores a stored value that is not a theme', (t) => {
    localStorage.setItem('theme', 'neon');
    setPrefersDark(false);
    
    const result = currentTheme();
    const expected = ['light'];
    
    t.deepEqual([result], expected);
    t.end();
    
    localStorage.removeItem('theme');
});

test('theme: a click flips the theme and writes it', (t) => {
    localStorage.removeItem('theme');
    applyTheme('light');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]') as HTMLButtonElement;
    
    fireEvent.click(button);
    
    const result = [button.textContent, localStorage.getItem('theme'), document.documentElement.getAttribute('data-theme')];
    
    const expected = [
        'dark ☀',
        'dark',
        'dark',
    ];
    
    t.deepEqual(result, expected);
    t.end();
    
    cleanup();
});

test('theme: the button shows the theme in force', (t) => {
    localStorage.removeItem('theme');
    applyTheme('dark');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]') as HTMLButtonElement;
    const result = [button.textContent];
    const expected = ['dark ☀'];
    
    t.deepEqual(result, expected);
    t.end();
    
    cleanup();
    localStorage.removeItem('theme');
});
