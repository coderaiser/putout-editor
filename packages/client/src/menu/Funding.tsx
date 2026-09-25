import {useEffect, useRef} from 'react';
import {TbHeart} from 'react-icons/tb';
import {useToolbarMenu} from './ToolbarMenuContext.tsx';

const MENU_ID = 'funding';

const fundings = [
    'patreon',
    'opencollective',
    'ko-fi',
];

export default function Funding() {
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
    
    return (
        <div ref={ref} className="button menuButton">
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => toggle(MENU_ID)}
            >
                <TbHeart size={18}/>
                &nbsp;Funding
            </button>
            {open && (
                <ul>
                    {fundings.map((funding) => (
                        <li
                            key={funding}
                        >
                            <button
                                onClick={() => {
                                    globalThis.open(`https://${funding}.com/coderaiser`, '_blank');
                                    close();
                                }}
                            >{funding}.com/coderaiser</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
