import {
    useEffect,
    useRef,
    type ChangeEvent,
} from 'react';

export interface AstSearchProps {
    query: string;
    
    /** How many rows are showing, for the "14 shown" count in the bar. */
    shown: number;
    focused: boolean;
    onQueryChange: (query: string) => void;
    onFocusChange: (focused: boolean) => void;
}

export default function AstSearch({query, shown, focused, onQueryChange, onFocusChange}: AstSearchProps) {
    const box = useRef<HTMLInputElement>(null);
    
    /**
     * `focused` becoming true has to move **real** focus, not just state.
     *
     * `autoFocus` on the input covers only the mount case, and the mount case is
     * the rarer one: the console panel opens with the filter already focused,
     * but in the chat thread the tree mounts unfocused and `focused` only
     * arrives later, from `Tab` or `/`. Without this the state says "search" and
     * the caret is still in the tree, so the user types a filter into nothing.
     *
     * Keyed on `[focused]` and not on nothing at all: an effect with no deps
     * runs after every keystroke, and re-focusing then throws the caret to the
     * end of the query the user is halfway through typing.
     */
    useEffect(() => {
        if (!focused)
            return;
        
        // bound to a local rather than `box.current?.focus()`: the root config
        // bans optional chaining, and `.current` is mutable, so reading it twice
        // is two values as far as the compiler is concerned
        const {current} = box;
        
        if (current)
            current.focus();
    }, [focused]);
    
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
                ref={box}
                type="text"
                value={query}
            />
            <span className="ast-search__count">
                {`${shown} shown`}
            </span>
        </div>
    );
}
