import {useEffect, useState} from 'react';

const THEME_KEY = 'theme';

export type Theme = 'light' | 'dark';

/**
 * The editor's key, on purpose.
 *
 * `ThemeButton` in `packages/client` writes `localStorage.theme` and sets
 * `data-theme` on `<html>`, so a name of the same shape and a key of the same
 * name is what makes the two pages agree — visit one, pick a theme, and the
 * other is already in it. Nothing else about them is shared: this page ships no
 * React context for it and needs none, because `data-theme` is read by CSS
 * alone.
 *
 * The default is what the OS says, not a fixed `light`. The client's button
 * starts on `light` and only reaches for the attribute when pressed, which
 * leaves a first-time visitor on light whatever their system is; here the CSS
 * handles an absent attribute through `prefers-color-scheme`, so the button
 * only has to report what is actually in force.
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

export default function ThemeToggle() {
    const [theme, setTheme] = useState(currentTheme);
    
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    
    return (
        <button
            aria-label="Toggle theme"
            className="chat-header__btn"
            data-testid="theme-toggle"
            onClick={() => setTheme(nextTheme(theme))}
            type="button"
        >
            {`${theme} ${theme === 'light' ? '☾' : '☀'}`}
        </button>
    );
}
