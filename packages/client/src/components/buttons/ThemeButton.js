import {useEffect, useState} from 'react';
import {TbMoon, TbSun} from 'react-icons/tb';

const THEME_KEY = 'theme';
const DEFAULT_THEME = 'light';

const readTheme = () => localStorage.getItem(THEME_KEY) || DEFAULT_THEME;

export default function ThemeButton() {
    const [theme, setTheme] = useState(readTheme);
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    
    const toggle = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        
        localStorage.setItem(THEME_KEY, next);
        setTheme(next);
    };
    
    return (
        <button
            type="button"
            title="Toggle theme"
            onClick={toggle}
        >
            {theme === 'light' ? <TbMoon size={18}/> : <TbSun size={18}/>}
        </button>
    );
}
