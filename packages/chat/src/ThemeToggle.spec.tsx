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

/**
 * The button shows what **clicking it does**, not what is in force.
 *
 * It used to render `${theme} ${icon}`, which read "light ☾" on a light page:
 * a word naming the current state beside a glyph naming the other one, so the
 * label and the icon contradicted each other and neither said what a click did.
 * A user could not tell whether the button reported or offered.
 *
 * So the word is gone and the glyph is the action — ☀ on a dark page (click for
 * light), ☾ on a light one (click for dark) — and `aria-label` says the same
 * thing in words for anyone who cannot see a glyph at all.
 */
test('theme: the glyph names the theme a click would switch to', (t) => {
    localStorage.removeItem('theme');
    applyTheme('dark');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]');
    const result = button && button.textContent;
    const expected = '☀';
    
    cleanup();
    localStorage.removeItem('theme');
    
    t.equal(result, expected);
    t.end();
});

test('theme: a light page offers dark', (t) => {
    localStorage.removeItem('theme');
    applyTheme('light');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]');
    const result = button && button.textContent;
    const expected = '☾';
    
    cleanup();
    localStorage.removeItem('theme');
    
    t.equal(result, expected);
    t.end();
});

test('theme: the label says the action, so it needs no glyph', (t) => {
    localStorage.removeItem('theme');
    applyTheme('dark');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]');
    const result = button && button.getAttribute('aria-label');
    const expected = 'Switch to light mode';
    
    cleanup();
    localStorage.removeItem('theme');
    
    t.equal(result, expected);
    t.end();
});

test('theme: the label follows the theme when it changes', (t) => {
    localStorage.removeItem('theme');
    applyTheme('dark');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]') as HTMLButtonElement;
    
    fireEvent.click(button);
    
    const result = button.getAttribute('aria-label');
    const expected = 'Switch to dark mode';
    
    cleanup();
    localStorage.removeItem('theme');
    
    t.equal(result, expected);
    t.end();
});

test('theme: a click flips the theme and writes it', (t) => {
    localStorage.removeItem('theme');
    applyTheme('light');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]') as HTMLButtonElement;
    
    fireEvent.click(button);
    
    const result = [
        localStorage.getItem('theme'),
        document.documentElement.getAttribute('data-theme'),
    ];
    
    const expected = [
        'dark',
        'dark',
    ];
    
    t.deepEqual(result, expected);
    t.end();
    
    cleanup();
});

/**
 * The icon-only class, which is what drops the padding the text label needed.
 *
 * Asserted because the class is load-bearing and otherwise invisible: without it
 * `.chat-header__btn`'s `padding: 5px 12px` leaves a 68px-wide box around a
 * 16px glyph, which is the "unnecessary header space" plan.md §4 is about.
 */
test('theme: the button carries the icon-only class', (t) => {
    localStorage.removeItem('theme');
    applyTheme('dark');
    
    render(
        <ThemeToggle/>,
    );
    
    const button = document.querySelector('[data-testid="theme-toggle"]');
    const result = button && button.className.includes('chat-header__btn--icon');
    
    cleanup();
    localStorage.removeItem('theme');
    
    t.ok(result);
    t.end();
});
