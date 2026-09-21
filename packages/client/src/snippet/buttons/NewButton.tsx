import {TbFilePlus, TbChevronDown} from 'react-icons/tb';
import {categories, templates} from '../templates/index.ts';

type Props = {
    saving?: boolean;
    forking?: boolean;
    onNew?: (template?: string) => void;
};

export default function NewButton({saving, forking, onNew}: Props) {
    return (
        <div className="menuButton" data-testid="new-menu">
            <span>
                <TbFilePlus size={18}/> New <TbChevronDown size={12}/>
            </span>
            <ul role="menu" data-testid="new-submenu">
                <li role="none">
                    <button
                        type="button"
                        role="menuitem"
                        disabled={saving || forking}
                        onClick={() => onNew?.()}
                    >
                        Default
                    </button>
                </li>
                {categories.map((label) => (
                    <li key={label} role="none">
                        <button
                            type="button"
                            role="menuitem"
                            disabled={saving || forking}
                            onClick={() => onNew?.(templates[label])}
                        >
                            {label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
