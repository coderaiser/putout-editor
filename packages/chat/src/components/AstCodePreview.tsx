import type {FlatNode} from '@putout/editor-commands';
import {highlight, escHtml} from '../highlight.ts';

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

/**
 * Insert a column marker into an already-highlighted HTML string at the
 * position corresponding to plain-text column `col`.
 *
 * The highlighted string has extra characters from `<span class="...">` and
 * `</span>` tags. We count only non-tag characters to find the right insertion
 * point, then splice the marker span in.
 */
export const insertMarker = (html: string, col: number): string => {
    if (!col)
        return html;
    
    let plain = 0; // count of non-tag characters seen
    let i = 0;
    
    // current position in `html`
    while (i < html.length && plain < col) {
        if (html[i] === '<') {
            // Skip the whole tag without counting characters
            while (i < html.length && html[i] !== '>')
                i++;
            
            i++; // skip '>'
        } else {
            plain++;
            i++;
        }
    }
    
    return `${html.slice(0, i)}<span class="ast-col-marker">|</span>${html.slice(i)}`;
};

/**
 * A `|` inserted at the selected column, so the cursor position is visible.
 * The plain-text line is highlighted first; `insertMarker` then splices the
 * marker span into the HTML at the character offset that holds the same
 * column, so the `|` never sits inside a tag.
 */
export function markedLine(text: string, col: number): string {
    if (!col)
        return text;
    
    const html = highlight(text);
    
    return insertMarker(html, col);
}

export default function AstCodePreview({source, selected}: AstCodePreviewProps) {
    const lines = linesOf(source);
    
    return (
        <div
            className="ast-code tok-scope"
            data-testid="ast-code-preview"
        >
            {lines.map((line, index) => {
                const number = index + 1;
                const line_ = selected && selected.line || 0;
                const onSelectedLine = line_ === number;
                
                // The selected line goes through markedLine (highlight + marker)
                // and is HTML; every other line is plain text. Both render via
                // dangerouslySetInnerHTML so the tok spans become real elements
                // rather than visible `<span>` text on the page.
                const html = onSelectedLine && selected
                    ? markedLine(line, selected.col)
                    : escHtml(line);
                
                return (
                    <div
                        className={`ast-code__line${onSelectedLine ? ' ast-code__line--active' : ''}`}
                        data-active={onSelectedLine}
                        key={number}
                    >
                        <span className="ast-code__number">
                            {number}
                        </span>
                        <span
                            className="ast-code__text"
                            dangerouslySetInnerHTML={{
                                __html: html,
                            }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
