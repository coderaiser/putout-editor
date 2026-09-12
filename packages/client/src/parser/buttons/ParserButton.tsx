import {useState} from 'react';
import cx from 'classnames';
import {TbCode, TbSettings} from 'react-icons/tb';
import {getParserByID} from '../parsers/index.ts';
import type {ParserInfo, ParserCategory} from '../parsers/index.ts';

interface ParserButtonProps {
    parser: ParserInfo;
    category: ParserCategory;
    onParserChange: (parser: ParserInfo | undefined) => void;
    onParserSettingsButtonClick: () => void;
}

export default function ParserButton({parser, category, onParserChange, onParserSettingsButtonClick}: ParserButtonProps) {
    const [forceClosed, setForceClosed] = useState(false);
    const parsers = category.parsers.filter((p: ParserInfo) => p.showInMenu);
    
    const onItemClick = (event: React.MouseEvent<HTMLLIElement>) => {
        const currentTarget = event.currentTarget;
        const parserID = currentTarget.getAttribute('data-id') ?? '';
        onParserChange(getParserByID(parserID));
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
            <span onClick={onTriggerClick}>
                <TbCode size={18}/>
                {parser.displayName}
            </span>
            <ul>
                {parsers.map((parserItem: ParserInfo) => (
                    <li key={parserItem.id} onClick={onItemClick} data-id={parserItem.id}>
                        <button type="button">
                            {parserItem.displayName}
                        </button>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                title="Parser Settings"
                style={{
                    minWidth: 0,
                }}
                disabled={!parser.hasSettings()}
                onClick={onParserSettingsButtonClick}
            >
                <TbSettings size={18}/>
            </button>
        </div>
    );
}
