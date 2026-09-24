import {useEffect, useRef} from 'react';
import cx from 'classnames';
import {
    TbDeviceFloppy,
    TbFileCode,
    TbGitFork,
    TbLoader2,
} from 'react-icons/tb';
import ForkButton from './ForkButton.tsx';
import NewButton from './NewButton.tsx';
import SaveButton from './SaveButton.tsx';
import ShareButton from './ShareButton.tsx';
import type {Revision} from '../../store/reducers.ts';
import {useToolbarMenu} from '../../store/ToolbarMenuContext.tsx';

interface SnippetButtonProps {
    canFork: boolean;
    canSave: boolean;
    saving: boolean;
    forking: boolean;
    onFork: () => void;
    onSave: () => void;
    onNew?: (template?: string, fixture?: string) => void;
    onShareButtonClick: () => void;
    snippet: Revision | null;
}

export default function SnippetButton(props: SnippetButtonProps) {
    const {
        openId,
        toggle,
        close,
    } = useToolbarMenu();
    const open = openId === 'snippet' || openId === 'new';
    const ref = useRef<HTMLDivElement>(null);
    const {
        canFork,
        canSave,
        saving,
        forking,
        onFork,
        onSave,
    } = props;
    
    const canForkAndNotSave = canFork && !canSave;
    const savingOrForking = saving || forking;
    
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
    
    const onTriggerClick = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.stopPropagation();
        toggle('snippet');
    };
    
    const onItemClick = () => {
        close();
    };
    
    return (
        <div
            ref={ref}
            className={cx('button', 'menuButton')}
        >
            <span
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={onTriggerClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggle('snippet');
                    }
                }}
            >
                <TbFileCode size={18}/>
                Snippet
            </span>
            {open && (
                <ul data-testid="snippet-menu" onClick={onItemClick}>
                    <li><NewButton {...props}/></li>
                    <li><SaveButton {...props}/></li>
                    <li><ForkButton {...props}/></li>
                    <li><ShareButton {...props}/></li>
                </ul>
            )}
            <button
                type="button"
                title={canForkAndNotSave ? 'Fork' : 'Save'}
                style={{
                    minWidth: 0,
                }}
                disabled={savingOrForking || !canSave && !canFork}
                onClick={canForkAndNotSave ? onFork : onSave}
            >
                {savingOrForking ? <TbLoader2 size={18}/> : canForkAndNotSave ? <TbGitFork size={18}/> : <TbDeviceFloppy size={18}/>}
            </button>
        </div>
    );
}
