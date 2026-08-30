import {useState} from 'react';
import cx from 'classnames';
import {TbToggleLeft, TbToggleRight} from 'react-icons/tb';
import {getTransformerByID} from '../../parsers/index.js';

export default function TransformButton({category, transformer, showTransformer, onTransformChange}) {
    const [forceClosed, setForceClosed] = useState(false);
    
    const onTriggerClick = () => {
        if (transformer)
            onTransformChange(null);
        
        setForceClosed(true);
    };
    
    const onClick = ({target}) => {
        let transformID;
        
        if (target.nodeName.toLowerCase() === 'li')
            transformID = target.children[0].value;
        else
            transformID = target.value;
        
        onTransformChange(getTransformerByID(transformID));
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
                'disabled': !category.transformers.length,
                'is-closed': forceClosed,
            })}
            onMouseLeave={onMouseLeave}
        >
            <button
                type="button"
                onClick={onTriggerClick}
                disabled={!category.transformers.length}
            >
                {showTransformer ? <TbToggleRight size={18}/> : <TbToggleLeft size={18}/>}
                Transform
            </button>
            {category.transformers.length > 0 && <ul>
                {category.transformers.map((transformerItem) => (
                    <li
                        key={transformerItem.id}
                        className={cx({
                            selected: showTransformer && transformer === transformerItem,
                        })}
                        onClick={onClick}
                    >
                        <button value={transformerItem.id} type="button">
                            {transformerItem.displayName}
                        </button>
                    </li>
                ))}
            </ul>}
        </div>
    );
}
