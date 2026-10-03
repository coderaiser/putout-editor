import type {FlatNode} from '@putout/editor-commands';

export interface AstStatusProps {
    selected: FlatNode | null;
    
    /** The collapsed count, for the `3 hidden` tail. */
    hidden: number;
}

const DASH = '—';

export default function AstStatus({selected, hidden}: AstStatusProps) {
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
                {'↑↓/jk navigate · space/enter expand · / search · tab switch'}
            </span>
        </div>
    );
}
