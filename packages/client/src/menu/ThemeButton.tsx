import {
    useEffect,
    useRef,
    useState,
} from 'react';
import {TbMoon, TbSun} from 'react-icons/tb';
import cx from 'classnames';
import {useToolbarMenu} from './ToolbarMenuContext.tsx';

const MENU_ID = 'theme';

const THEME_KEY = 'theme';
const DEFAULT_THEME = 'light';

const themes = [
    'light',
    'dark',
];

const readTheme = (): string => localStorage.getItem(THEME_KEY) || DEFAULT_THEME;

const applyTheme = (next: string): void => {
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
};

export default function ThemeButton() {
    const [theme, setTheme] = useState(readTheme);
    const {
        openId,
        toggle,
        close,
    } = useToolbarMenu();
    
    const open = openId === MENU_ID;
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    
    useEffect(() => {
        if (!open)
            return;
        
        const onOutsideClick = (event: MouseEvent) => {
            if (!ref.current?.contains(event.target as Node))
                close();
        };
        
        document.addEventListener('mousedown', onOutsideClick);
        return () => document.removeEventListener('mousedown', onOutsideClick);
    }, [open, close]);
    
    const onTriggerClick = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next);
        toggle(MENU_ID);
    };
    
    const onItemClick = (next: string) => {
        setTheme(next);
        close();
    };
    
    return (
        <div
            ref={ref}
            className={cx('button', 'menuButton')}
        >
            <button
                type="button"
                onClick={onTriggerClick}
                aria-label="Toggle theme"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {theme === 'light' ? <TbMoon size={18}/> : <TbSun size={18}/>}
                {theme}
            </button>
            {open && (
                <ul>
                    {themes.map((t) => (
                        <li
                            key={t}
                            className={cx({
                                selected: t === theme,
                            })}
                            onClick={() => onItemClick(t)}
                        >
                            <button type="button">{t}</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
