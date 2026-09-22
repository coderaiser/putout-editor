import {useSelector, useDispatch} from 'react-redux';
import {
    TbDeviceFloppy,
    TbFileCode,
    TbFilePlus,
    TbGitFork,
    TbLoader2,
    TbCode,
    TbSettings,
    TbMoon,
    TbSun,
    TbQuestionMark,
    TbShare2,
} from 'react-icons/tb';
import {useState, useEffect} from 'react';
import MobileDropdown from './MobileDropdown.tsx';
import {categories, templates} from '../snippet/templates/index.ts';
import {getParserByID} from '../parser/parsers/index.ts';
import * as selectors from '../store/selectors.ts';
import * as parserSelectors from '../parser/store/parserSelectors.ts';
import {logEvent} from '../snippet/logger.ts';
import {
    openSettingsDialog,
    openShareDialog,
    setParser,
    reset,
} from '../store/reducers.ts';

const THEME_KEY = 'theme';

const readTheme = (): string => globalThis.localStorage?.getItem(THEME_KEY) || 'light';

const applyTheme = (theme: string): void => {
    globalThis.localStorage?.setItem(THEME_KEY, theme);
    globalThis.document?.documentElement.setAttribute('data-theme', theme);
};

const clearHash = (): boolean => {
    if (!globalThis.location?.hash)
        return false;
    
    globalThis.location.hash = '';
    return true;
};

export default function MobileMenu() {
    const dispatch = useDispatch();
    const saving = useSelector(selectors.isSaving);
    const forking = useSelector(selectors.isForking);
    const canSave = useSelector(parserSelectors.canSave);
    const canFork = useSelector(selectors.canFork);
    const parser = useSelector(parserSelectors.getParser);
    
    const [theme, setTheme] = useState(readTheme);
    const [openMenu, setOpenMenu] = useState<'snippet' | 'parser' | 'new' | null>(null);
    
    const toggleMenu = (id: 'snippet' | 'parser') => setOpenMenu((current) => current === id ? null : id);
    
    const toggleNew = () => setOpenMenu((current) => current === 'new' ? 'snippet' : 'new');
    
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    
    const parsers = parser.category.parsers.filter((p) => p.showInMenu);
    
    const canForkAndNotSave = canFork && !canSave;
    const savingOrForking = saving || forking;
    
    const onSave = () => dispatch({
        type: 'snippet/save',
        payload: false,
    });
    
    const onFork = () => dispatch({
        type: 'snippet/save',
        payload: true,
    });
    
    const onNew = (template?: string) => {
        if (clearHash())
            return;
        
        dispatch(reset(template));
    };
    
    const onParserChange = (id: string) => {
        const p = getParserByID(id);
        dispatch(setParser(p));
        logEvent('parser', 'select', id);
    };
    
    const onParserSettings = () => {
        dispatch(openSettingsDialog());
        logEvent('parser', 'open_settings');
    };
    
    const onShare = () => {
        dispatch(openShareDialog());
        logEvent('ui', 'open_share');
    };
    
    const toggleTheme = () => setTheme((t) => t === 'light' ? 'dark' : 'light');
    
    return (
        <div id="MobileMenu" data-testid="mobile-menu">
            {/* ── Snippet ──────────────────────────────────── */}
            <MobileDropdown
                trigger={<><TbFileCode size={18}/> Snippet</>}
                open={openMenu === 'snippet' || openMenu === 'new'}
                onToggle={() => toggleMenu('snippet')}
            >
                <li role="menuitem">
                    <button
                        type="button"
                        data-testid="new-trigger"
                        className="mobile-dropdown__trigger"
                        aria-expanded={openMenu === 'new'}
                        aria-haspopup="menu"
                        onPointerUp={toggleNew}
                    >
                        <TbFilePlus size={16}/> New
                    </button>
                    {openMenu === 'new' && (
                        <ul
                            role="menu"
                            data-testid="new-submenu"
                            className="mobile-dropdown__menu mobile-dropdown__menu--nested"
                            onClick={() => setOpenMenu(null)}
                        >
                            <li role="menuitem">
                                <button type="button" onClick={() => onNew()}>
                                    Default
                                </button>
                            </li>
                            {categories.map((label) => (
                                <li key={label} role="menuitem">
                                    <button
                                        type="button"
                                        onClick={() => onNew(templates[label])}
                                    >
                                        {label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
                <li role="menuitem">
                    <button
                        type="button"
                        disabled={savingOrForking || !canSave && !canFork}
                        onClick={canForkAndNotSave ? onFork : onSave}
                    >
                        {savingOrForking
                            ? <TbLoader2 size={16}/>
                            : canForkAndNotSave
                                ? <TbGitFork size={16}/>
                                : <TbDeviceFloppy size={16}/>}
                        {' '}{canForkAndNotSave ? 'Fork' : 'Save'}
                    </button>
                </li>
                <li role="menuitem">
                    <button type="button" onClick={onShare}>
                        <TbShare2 size={16}/> Share
                    </button>
                </li>
            </MobileDropdown>
            {/* ── Parser ───────────────────────────────────── */}
            <MobileDropdown
                trigger={<><TbCode size={18}/>
                    {parser.displayName}</>}
                open={openMenu === 'parser'}
                onToggle={() => toggleMenu('parser')}
            >
                {parsers.map((p) => (
                    <li key={p.id} role="menuitem">
                        <button
                            type="button"
                            onClick={() => onParserChange(p.id)}
                        >
                            {p.displayName}
                        </button>
                    </li>
                ))}
                <li role="menuitem">
                    <button
                        type="button"
                        disabled={!parser.hasSettings?.()}
                        onClick={onParserSettings}
                    >
                        <TbSettings size={16}/> Settings
                    </button>
                </li>
            </MobileDropdown>
            {/* ── Help ─────────────────────────────────────── */}
            <a
                className="mobile-menu__help"
                href="https://github.com/coderaiser/putout#-plugins-api"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Help"
            >
                <TbQuestionMark size={18}/>
            </a>
            {/* ── Theme ────────────────────────────────────── */}
            <button
                type="button"
                className="mobile-menu__theme"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
            >
                {theme === 'light' ? <TbMoon size={18}/> : <TbSun size={18}/>}
            </button>
        </div>
    );
}
