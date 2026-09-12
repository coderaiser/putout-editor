import {useSelector, useDispatch} from 'react-redux';
import {
    TbDeviceFloppy,
    TbFileCode,
    TbGitFork,
    TbLoader2,
    TbCode,
    TbSettings,
    TbMoon,
    TbSun,
    TbQuestionMark,
} from 'react-icons/tb';
import {useState, useEffect} from 'react';
import MobileDropdown from './MobileDropdown.tsx';
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

export default function MobileMenu() {
    const dispatch = useDispatch();
    const saving = useSelector(selectors.isSaving);
    const forking = useSelector(selectors.isForking);
    const canSave = useSelector(parserSelectors.canSave);
    const canFork = useSelector(selectors.canFork);
    const parser = useSelector(parserSelectors.getParser);
    
    const [theme, setTheme] = useState(readTheme);
    
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);
    
    const parsers = (parser as any).category.parsers.filter((p: any) => p.showInMenu);
    
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
    
    const onNew = () => {
        if (globalThis.location?.hash) {
            globalThis.location.hash = '';
            return;
        }
        
        dispatch(reset());
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
            <MobileDropdown trigger={<><TbFileCode size={18}/> Snippet</>}>
                <li role="menuitem">
                    <button type="button" onClick={onNew}>
                        New
                    </button>
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
                        Share
                    </button>
                </li>
            </MobileDropdown>
            {/* ── Parser ───────────────────────────────────── */}
            <MobileDropdown
                trigger={<><TbCode size={18}/>
                    {(parser as any).displayName}</>}
            >
                {parsers.map((p: any) => (
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
                        disabled={!(parser as any).hasSettings?.()}
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
