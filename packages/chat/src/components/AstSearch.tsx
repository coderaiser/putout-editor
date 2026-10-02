import type {ChangeEvent} from 'react';

export interface AstSearchProps {
    query: string;
    
    /** How many rows are showing, for the "14 shown" count in the bar. */
    shown: number;
    focused: boolean;
    onQueryChange: (query: string) => void;
    onFocusChange: (focused: boolean) => void;
}

export default function AstSearch({query, shown, focused, onQueryChange, onFocusChange}: AstSearchProps) {
    const onInput = (event: ChangeEvent<HTMLInputElement>) => {
        onQueryChange(event.target.value);
    };
    
    return (
        <div className="ast-search">
            <span className="ast-search__icon">
                {'⌕ '}
            </span>
            <input
                autoFocus={focused}
                className="ast-search__input"
                data-testid="ast-search"
                onBlur={() => onFocusChange(false)}
                onChange={onInput}
                onFocus={() => onFocusChange(true)}
                placeholder="filter by type, value, key…"
                type="text"
                value={query}
            />
            <span className="ast-search__count">
                {`${shown} shown`}
            </span>
        </div>
    );
}
