import {useState} from 'react';
import cx from 'classnames';
import {TbKeyboard} from 'react-icons/tb';

const keyMappings = [
    'default',
    'vim',
    'emacs',
];

export default function KeyMapButton({keyMap, onKeyMapChange}) {
    const [forceClosed, setForceClosed] = useState(false);
    
    const onItemClick = (key) => {
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
                        disabled={keyMap === keyMapItem}
                        onClick={() => onItemClick(keyMapItem)}
                    >
                        <button type="button">
                            {keyMapItem}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
