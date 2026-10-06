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
    
    const lines = data.split('\n');
    
    return (
        <div
            className="source-block"
            data-testid="source-block"
        >
            {lines.map((line, index) => (
                <div
                    className="source-block__line"
                    key={index}
                >
                    <span className="source-block__gutter">
                        {index + 1}
                    </span>
                    <code className="source-block__text">
                        {line}
                    </code>
                </div>
            ))}
        </div>
    );
}
