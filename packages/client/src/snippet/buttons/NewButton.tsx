import {TbFilePlus, TbChevronDown} from 'react-icons/tb';
import {useEffect, useRef} from 'react';
import {
    categories,
    fixtures,
    templates,
} from '../templates/index.ts';
import {useToolbarMenu} from '../../store/ToolbarMenuContext.tsx';

const MENU_ID = 'new';

type Props = {
    saving?: boolean;
    forking?: boolean;
    onNew?: (template?: string, fixture?: string) => void;
};

export default function NewButton({saving, forking, onNew}: Props) {
    const {
        openId,
        toggle,
        close,
    } = useToolbarMenu();
    const open = openId === MENU_ID;
    const ref = useRef<HTMLDivElement>(null);
    
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
        
        if (open) {
            close();
            return;
        }
        
        toggle(MENU_ID);
    };
    
    return (
        <div
            ref={ref}
            className="menuButton"
            data-testid="new-menu"
            onClick={(event) => {
                event.stopPropagation();
                
                if (open) {
                    close();
                    return;
                }
                
                toggle(MENU_ID);
            }}
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
                        
                        if (open)
                            close();
                        else
                            toggle(MENU_ID);
                    }
                }}
            >
                <TbFilePlus size={18}/> New <TbChevronDown size={12}/>
            </span>
            {open && (
                <ul
                    role="menu"
                    data-testid="new-submenu"
                    onClick={close}
                >
                    {categories.map((label) => (
                        <li key={label} role="none">
                            <button
                                type="button"
                                role="menuitem"
                                disabled={saving || forking}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onNew?.(templates[label], fixtures[label]);
                                    close();
                                }}
                            >
                                {label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

