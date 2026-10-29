import {highlight} from '../highlight.ts';

export interface TransformDiffProps {
    before: string;
    after: string;
}

/**
 * Before and after, side by side, not a computed diff. When they are equal,
 * say so in one line: a rule that does not fire is an answer.
 */
export default function TransformDiff({before, after}: TransformDiffProps) {
    if (before === after)
        return (
            <div
                className="transform-diff transform-diff--unchanged"
                data-testid="transform-diff"
            >
                {'No changes'}
            </div>
        );
    
    // Highlight each side after splitting, so the spans stay inside their
    // source line and never straddle a newline.
    const highlightedLines = (code: string) => highlight(code).split('\n');
    
    return (
        <div
            className="transform-diff"
            data-testid="transform-diff"
        >
            <div className="transform-diff__side">
                <h4 className="transform-diff__title">
                    {'before'}
                </h4>
                <pre
                    className="transform-diff__code transform-diff__code--before tok-scope"
                >
                    {highlightedLines(before).map((html, index) => (
                        <code
                            className="transform-diff__line"
                            key={index}
                            dangerouslySetInnerHTML={{
                                __html: html,
                            }}
                        />
                    ))}
                </pre>
            </div>
            <div className="transform-diff__side">
                <h4 className="transform-diff__title">
                    {'after'}
                </h4>
                <pre
                    className="transform-diff__code transform-diff__code--after tok-scope"
                >
                    {highlightedLines(after).map((html, index) => (
                        <code
                            className="transform-diff__line"
                            key={index}
                            dangerouslySetInnerHTML={{
                                __html: html,
                            }}
                        />
                    ))}
                </pre>
            </div>
        </div>
    );
}
