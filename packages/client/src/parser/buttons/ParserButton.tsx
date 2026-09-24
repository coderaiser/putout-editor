import {useEffect, useRef} from 'react';
import cx from 'classnames';
import {TbCode, TbSettings} from 'react-icons/tb';
import {
    getParserByID,
    type ParserInfo,
    type ParserCategory,
} from '../parsers/index.ts';
import {useToolbarMenu} from '../../store/ToolbarMenuContext.tsx';

interface ParserButtonProps {
    parser: ParserInfo;
    category: ParserCategory;
    onParserChange: (parser: ParserInfo | undefined) => void;
    onParserSettingsButtonClick: () => void;
}

const MENU_ID = 'parser';

export default function ParserButton({parser, category, onParserChange, onParserSettingsButtonClick}: ParserButtonProps) {
    const {
        openId,
        toggle,
        close,
    } = useToolbarMenu();
    
    const open = openId === MENU_ID;
    const ref = useRef<HTMLDivElement>(null);
    const parsers = category.parsers.filter((p: ParserInfo) => p.showInMenu);
    
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
    
    const onItemClick = (event: React.MouseEvent<HTMLLIElement>) => {
        const {currentTarget} = event;
        const parserID = currentTarget.getAttribute('data-id') || '';
        
        onParserChange(getParserByID(parserID));
        close();
    };
    
    const onTriggerClick = (event: React.MouseEvent<HTMLSpanElement>) => {
        event.stopPropagation();
        toggle(MENU_ID);
    };
    
    return (
        <div ref={ref} className={cx('button', 'menuButton')}>
            <span
                role="button"
                tabIndex={0}
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={onTriggerClick}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggle(MENU_ID);
                    }
                }}
            >
                <TbCode size={18}/>
                {parser.displayName}
            </span>
            {open && (
                <ul>
                    {parsers.map((parserItem: ParserInfo) => (
                        <li key={parserItem.id} onClick={onItemClick} data-id={parserItem.id}>
                            <button type="button">
                                {parserItem.displayName}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <button
                type="button"
                title="Parser Settings"
                style={{
                    minWidth: 0,
                }}
                disabled={!parser.hasSettings?.()}
                onClick={onParserSettingsButtonClick}
            >
                <TbSettings size={18}/>
            </button>
        </div>
    );
}
