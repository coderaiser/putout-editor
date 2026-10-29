import {useEffect, useState} from 'react';

const THEME_KEY = 'theme';

export type Theme = 'light' | 'dark';

/**
 * The same key as `ThemeButton` in `packages/client` (`localStorage.theme`,
 * `data-theme` on `<html>`), so both pages use one theme. No stored theme:
 * the CSS follows `prefers-color-scheme`.
 */
const readStored = (): Theme | null => {
    const stored = localStorage.getItem(THEME_KEY);
    
    return stored === 'light' || stored === 'dark' ? stored : null;
};

/** What is in force: the stored choice, else the OS preference. */
export const currentTheme = (): Theme => {
    const stored = readStored();
    
    if (stored)
        return stored;
    
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const applyTheme = (theme: Theme): void => {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
};

export const nextTheme = (theme: Theme): Theme => theme === 'light' ? 'dark' : 'light';

/**
 * The button says what a click does: ☀ on a dark page, ☾ on a light page.
 * `aria-label` and `title` say it in words.
 */
const labelOf = (theme: Theme): string => theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

const glyphOf = (theme: Theme): string => theme === 'dark' ? '☀' : '☾';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(currentTheme);
    
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    
    return (
        <button
            aria-label={labelOf(theme)}
            className="chat-header__btn chat-header__btn--icon"
            data-testid="theme-toggle"
            onClick={() => setTheme(nextTheme(theme))}
            title={labelOf(theme)}
            type="button"
        >
            {glyphOf(theme)}
        </button>
    );
}
