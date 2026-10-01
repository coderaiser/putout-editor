import type {FlatNode} from '../state.types.ts';

export interface AstCodePreviewProps {
    source: string;
    
    /** The selected node — its line is highlighted and its column marked. */
    selected: FlatNode | null;
}

export interface PreviewLine {
    number: number;
    text: string;
    highlighted: boolean;
}

/**
 * The source split into displayable lines, with the selected node's line
 * flagged. Split on `\n` only, so a line that already ends in `\r` keeps it —
 * normalising that is the renderer's job, not the splitter's.
 */
export const linesOf = (source: string): string[] => {
    if (!source)
        return [];
    
    return source.split('\n');
};

/** A `|` inserted at the selected column, so the cursor position is visible. */
export function markedLine(text: string, col: number): string {
    if (!col)
        return text;
    
    return `${text.slice(0, col)}|${text.slice(col)}`;
}

export default function AstCodePreview({source, selected}: AstCodePreviewProps) {
    const lines = linesOf(source);
    
    return (
        <div
            className="ast-code"
            data-testid="ast-code-preview"
        >
            {lines.map((line, index) => {
                const number = index + 1;
                const line_ = selected && selected.line || 0;
                const onSelectedLine = line_ === number;
                
                const text = onSelectedLine && selected
                    ? markedLine(line, selected.col)
                    : line;
                
                return (
                    <div
                        className={`ast-code__line${onSelectedLine ? ' ast-code__line--active' : ''}`}
                        data-active={onSelectedLine}
                        key={number}
                    >
                        <span className="ast-code__number">
                            {number}
                        </span>
                        <span className="ast-code__text">
                            {text}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
