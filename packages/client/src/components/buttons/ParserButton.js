import {useState} from 'react';
import cx from 'classnames';
import {TbCode, TbSettings} from 'react-icons/tb';
import {getParserByID} from '../../parsers/index.js';

export default function ParserButton({parser, category, onParserChange, onParserSettingsButtonClick}) {
    const [forceClosed, setForceClosed] = useState(false);
    const parsers = category.parsers.filter((p) => p.showInMenu);
    
    const onItemClick = ({currentTarget}) => {
        const parserID = currentTarget.getAttribute('data-id');
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
                {parsers.map((parserItem) => (
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
