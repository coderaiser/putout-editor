import type {FlatNode} from '@putout/editor-commands';

export interface AstStatusProps {
    selected: FlatNode | null;
    
    /** The collapsed count, for the `3 hidden` tail. */
    hidden: number;
    
    /**
     * Coarse pointer, which shortens the hint.
     *
     * A prop rather than a `matchMedia` read inside the component: the answer
     * comes from `useIsMobile` so it can be *updated*, and a component that
     * read the query itself would need its own listener and its own copy of the
     * subscription. What it is for is narrow — the full hint is 62 characters
     * and wraps to four lines on a 390px screen.
     */
    mobile?: boolean;
}

const DASH = '—';

const HINT_FULL = '↑↓/jk navigate · h/l fold/expand · space/enter expand · / search · tab switch';
const HINT_SHORT = '↑↓ · space · /';

export const hintOf = (mobile?: boolean): string => mobile ? HINT_SHORT : HINT_FULL;

export default function AstStatus({selected, hidden, mobile}: AstStatusProps) {
    return (
        <div
            className="ast-status"
            data-testid="ast-status"
        >
            <span className="ast-status__type">
                {selected ? selected.type : DASH}
            </span>
            <span className="ast-status__pos">
                {selected ? `start ${selected.line}:${selected.col}   end ${selected.endLine}:${selected.endCol}` : DASH}
            </span>
            {hidden > 0 && (
                <span className="ast-status__hidden">
                    {`${hidden} hidden`}
                </span>
            )}
            <span className="ast-status__help">
                {hintOf(mobile)}
            </span>
        </div>
    );
}
