import '../css/highlight.css';
import {highlight} from '../highlight.ts';

export interface SourceBlockProps {
    data: string;
}

/**
 * The echo of `source`, line-numbered, because the number is what a later
 * `line:col` refers to. An empty source says so rather than rendering an empty
 * box: `source` with no argument is a real way to clear the buffer, and it is
 * the one case where there is nothing to show.
 */
export default function SourceBlock({data}: SourceBlockProps) {
    if (!data)
        return (
            <div
                className="source-block source-block--empty"
                data-testid="source-block"
            >
                {'Source cleared'}
            </div>
        );
    
    // highlight() returns a string with \n preserved. Split AFTER highlighting
    // so the span boundaries are not broken across the split.
    const lines = highlight(data).split('\n');
    
    return (
        <div
            className="source-block tok-scope"
            data-testid="source-block"
        >
            {lines.map((html, index) => (
                <div className="source-block__line" key={index}>
                    <span className="source-block__gutter">
                        {index + 1}
                    </span>
                    <code
                        className="source-block__text"
                        dangerouslySetInnerHTML={{
                            __html: html,
                        }}
                    />
                </div>
            ))}
        </div>
    );
}
