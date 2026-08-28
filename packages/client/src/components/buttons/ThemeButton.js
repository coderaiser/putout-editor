import {useEffect, useState} from 'react';
import {TbMoon, TbSun} from 'react-icons/tb';
import cx from 'classnames';

const THEME_KEY = 'theme';
const DEFAULT_THEME = 'light';
const themes = [
    'light',
    'dark',
];

const readTheme = () => localStorage.getItem(THEME_KEY) || DEFAULT_THEME;

export default function ThemeButton() {
    const [theme, setTheme] = useState(readTheme);
    const [forceClosed, setForceClosed] = useState(false);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    
    const onItemClick = (next) => {
        localStorage.setItem(THEME_KEY, next);
        setTheme(next);
        setForceClosed(true);
    };
    
    return (
        <div
            className={cx('button', 'menuButton', {'is-closed': forceClosed})}
            onMouseLeave={() => setForceClosed(false)}
        >
            <button type="button" onClick={() => setForceClosed(true)}>
                {theme === 'light' ? <TbMoon size={18}/> : <TbSun size={18}/>}
                {theme}
            </button>
            <ul>
                {themes.map((t) => (
                    <li
                        key={t}
                        className={cx({selected: t === theme})}
                        onClick={() => onItemClick(t)}
                    >
                        <button type="button">{t}</button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
