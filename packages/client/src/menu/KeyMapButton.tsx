import {useEffect, useRef} from 'react';
import cx from 'classnames';
import {TbKeyboard} from 'react-icons/tb';
import type {KeyMap} from '../types.ts';
import {useToolbarMenu} from './ToolbarMenuContext.tsx';

const MENU_ID = 'keymap';

const keyMappings: KeyMap[] = [
    'default',
    'vim',
    'emacs',
];

interface KeyMapButtonProps {
    id?: string;
    keyMap: KeyMap;
    onKeyMapChange: (keyMap: KeyMap) => void;
}

export default function KeyMapButton({id, keyMap, onKeyMapChange}: KeyMapButtonProps) {
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
    
    const onItemClick = (key: KeyMap) => {
        onKeyMapChange(key);
        close();
    };
    
    const onTriggerClick = () => {
        toggle(MENU_ID);
    };
    
    return (
        <div
            ref={ref}
            id={id}
            data-testid="keymap"
            className={cx('button', 'menuButton')}
        >
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={onTriggerClick}
            >
                <TbKeyboard size={18}/>
                {keyMap}
            </button>
            {open && (
                <ul>
                    {keyMappings.map((keyMapItem) => (
                        <li
                            key={keyMapItem}
                            className={cx({
                                disabled: keyMap === keyMapItem,
                            })}
                            onClick={() => onItemClick(keyMapItem)}
                        >
                            <button type="button" data-testid={keyMapItem}>
                                {keyMapItem}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
