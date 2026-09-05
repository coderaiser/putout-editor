import {useState, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {
    TbDeviceFloppy,
    TbGitFork,
    TbLoader2,
    TbMoon,
    TbSun,
    TbQuestionMark,
    TbCode,
    TbToggleLeft,
    TbToggleRight,
} from 'react-icons/tb';
import MobileDropdown from './MobileDropdown.js';
import * as selectors from '../store/selectors.ts';
import * as parserSelectors from '../parser/store/parserSelectors.ts';
import {
    selectTransformer,
    hideTransformer,
    setParser,
} from '../store/reducers.ts';

export default function MobileToolbar() {
    const dispatch = useDispatch();
    const parser = useSelector(parserSelectors.getParser);
    const transformer = useSelector(parserSelectors.getTransformer);
    const showTransformerVal = useSelector(selectors.showTransformer);
    const canSave = useSelector(parserSelectors.canSave);
    const canFork = useSelector(selectors.canFork);
    const saving = useSelector(selectors.isSaving);
    const forking = useSelector(selectors.isForking);
    
    const canForkAndNotSave = canFork && !canSave;
    const savingOrForking = saving || forking;
    
    const parsers = parser.category.parsers.filter((p) => p.showInMenu);
    const {transformers} = parser.category;
    
    const onSave = () => dispatch({
        type: 'snippet/save',
        payload: false,
    });
    const onFork = () => dispatch({
        type: 'snippet/save',
        payload: true,
    });
    
    return (
        <div id="MobileToolbar">
            {/* Save / Fork */}
            <button
                type="button"
                className="mobile-toolbar-btn"
                disabled={savingOrForking || !canSave && !canFork}
                onClick={canForkAndNotSave ? onFork : onSave}
                title={canForkAndNotSave ? 'Fork' : 'Save'}
            >
                {savingOrForking
                    ? <TbLoader2 size={20}/>
                    : canForkAndNotSave
                        ? <TbGitFork size={20}/>
                        : <TbDeviceFloppy size={20}/>}
            </button>
            {/* Parser picker */}
            <MobileDropdown trigger={<><TbCode size={20}/>
                {parser.displayName}</>}>
                {parsers.map((p) => (
                    <li key={p.id} role="menuitem">
                        <button
                            type="button"
                            onClick={() => dispatch(setParser(p))}
                        >
                            {p.displayName}
                        </button>
                    </li>
                ))}
            </MobileDropdown>
            {/* Transform toggle */}
            <MobileDropdown
                trigger={showTransformerVal
                    ? <TbToggleRight size={20}/>
                    : <TbToggleLeft size={20}/>}
            >
                {transformers.map((t) => (
                    <li key={t.id} role="menuitem">
                        <button
                            type="button"
                            onClick={() => dispatch(showTransformerVal && transformer === t ? hideTransformer() : selectTransformer(t))}
                        >
                            {t.displayName}
                        </button>
                    </li>
                ))}
            </MobileDropdown>
            {/* Theme toggle — simple button, no dropdown */}
            <ThemeToggle/>
            {/* Help */}
            <a
                className="mobile-toolbar-btn"
                href="https://github.com/coderaiser/putout#-plugins-api"
                target="_blank"
                rel="noopener noreferrer"
                title="Help"
            >
                <TbQuestionMark size={20}/>
            </a>
        </div>
    );
}

// Inline — simple, no dropdown needed
function ThemeToggle() {
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
    
    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);
    
    return (
        <button
            type="button"
            className="mobile-toolbar-btn"
            onClick={() => setTheme((t) => t === 'light' ? 'dark' : 'light')}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
        >
            {theme === 'light' ? <TbMoon size={20}/> : <TbSun size={20}/>}
        </button>
    );
}
