import {useState} from 'react';
import cx from 'classnames';
import {TbToggleLeft, TbToggleRight} from 'react-icons/tb';
import {getTransformerByID} from '#parser';
import type {ParserCategory, TransformerInfo} from '#parser';

interface TransformButtonProps {
    id?: string;
    category: ParserCategory;
    transformer: TransformerInfo | null;
    showTransformer: boolean;
    onTransformChange: (transformer: TransformerInfo | null) => void;
}

export default function TransformButton({id, category, transformer, showTransformer, onTransformChange}: TransformButtonProps) {
    const [forceClosed, setForceClosed] = useState(false);

    const onTriggerClick = () => {
        if (transformer)
            onTransformChange(null);

        setForceClosed(true);
    };

    const onClick = ({target}: React.MouseEvent<HTMLLIElement>) => {
        let transformID: string;

        const targetElement = target as HTMLElement;
        if (targetElement.nodeName.toLowerCase() === 'li')
            transformID = (targetElement.children[0] as HTMLButtonElement).value;
        else
            transformID = (targetElement as HTMLButtonElement).value;

        onTransformChange(getTransformerByID(transformID)!);
        setForceClosed(true);
    };

    const onMouseLeave = () => {
        setForceClosed(false);
    };

    return (
        <div
            id={id}
            className={cx({
                'button': true,
                'menuButton': true,
                'disabled': !category.transformers!.length,
                'is-closed': forceClosed,
            })}
            onMouseLeave={onMouseLeave}
        >
            <button
                type="button"
                onClick={onTriggerClick}
                disabled={!category.transformers!.length}
            >
                {showTransformer ? <TbToggleRight size={18}/> : <TbToggleLeft size={18}/>}
                Transform
            </button>
            {category.transformers!.length > 0 && <ul>
                {category.transformers!.map((transformerItem) => (
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