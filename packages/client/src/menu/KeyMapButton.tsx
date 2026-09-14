import {useState} from 'react';
import cx from 'classnames';
import {TbKeyboard} from 'react-icons/tb';
import type {KeyMap} from '../types.ts';

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
    const [forceClosed, setForceClosed] = useState(false);
    
    const onItemClick = (key: KeyMap) => {
        onKeyMapChange(key);
        setForceClosed(true);
    };
    
    const onTriggerClick = () => {
        setForceClosed(true);
    };
    
    const onMouseLeave = () => {
        setForceClosed(false);
    };
    
    return (
        <div
            id={id}
            data-testid="keymap"
            className={cx({
                'button': true,
                'menuButton': true,
                'is-closed': forceClosed,
            })}
            onMouseLeave={onMouseLeave}
        >
            <button
                type="button"
                onClick={onTriggerClick}
            >
                <TbKeyboard size={18}/>
                {keyMap}
            </button>
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
        </div>
    );
}
