import {useEffect, useRef} from 'react';
import cx from 'classnames';
import {TbToggleLeft, TbToggleRight} from 'react-icons/tb';
import {
    getTransformerByID,
    type ParserCategory,
    type TransformerInfo,
} from '#parser';
import {useToolbarMenu} from '../store/ToolbarMenuContext.tsx';

interface TransformButtonProps {
    id?: string;
    category: ParserCategory;
    transformer: TransformerInfo | null;
    showTransformer: boolean;
    onTransformChange: (transformer: TransformerInfo | null) => void;
}

const MENU_ID = 'transform';

export default function TransformButton({id, category, transformer, showTransformer, onTransformChange}: TransformButtonProps) {
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
    
    const onTriggerClick = () => {
        toggle(MENU_ID);
    };
    
    const onClick = ({target}: React.MouseEvent<HTMLLIElement>) => {
        let transformID: string;
        
        const targetElement = target as HTMLElement;
        
        if (targetElement.nodeName.toLowerCase() === 'li')
            transformID = (targetElement.children[0] as HTMLButtonElement).value;
        else
            transformID = (targetElement as HTMLButtonElement).value;
        
        onTransformChange(getTransformerByID(transformID)!);
        close();
    };
    
    return (
        <div
            ref={ref}
            id={id}
            className={cx('button', 'menuButton', {
                disabled: !category.transformers!.length,
            })}
        >
            <button
                type="button"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={onTriggerClick}
                disabled={!category.transformers!.length}
            >
                {showTransformer ? <TbToggleRight size={18}/> : <TbToggleLeft size={18}/>}
                Transform
            </button>
            {open && category.transformers!.length > 0 && (
                <ul>
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
                </ul>
            )}
        </div>
    );
}
