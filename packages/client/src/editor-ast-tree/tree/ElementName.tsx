import type {ElementClickHandler} from './types.ts';

type ElementNameProps = {
    name?: string | null;
    computed?: boolean;
    showToggler?: boolean;
    onClick?: ElementClickHandler;
};

export default function ElementName({name, computed, showToggler, onClick}: ElementNameProps) {
    if (!name)
        return null;
    
    return (
        <span className="key" onClick={showToggler ? onClick : undefined}>
            <span className="name nb">
                {computed ? <span title="computed">*{name}</span> : name}
            </span>
            <span className="p">:&nbsp;</span>
        </span>
    );
}
