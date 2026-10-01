export interface TransformDiffProps {
    before: string;
    after: string;
}

const linesOf = (text: string): string[] => text.split('\n');

/**
 * Before and after, side by side rather than as a computed diff. A `putout`
 * transform is one rule's edit, so the two blocks are short and the value is in
 * seeing the whole file twice — anything cleverer here would be a diff algorithm
 * shipped in a chat message.
 */
export default function TransformDiff({before, after}: TransformDiffProps) {
    return (
        <div
            className="transform-diff"
            data-testid="transform-diff"
        >
            <div className="transform-diff__side">
                <h4 className="transform-diff__title">
                    {'before'}
                </h4>
                <pre className="transform-diff__code transform-diff__code--before">
                    {linesOf(before).map((line, index) => (
                        <code
                            className="transform-diff__line"
                            key={index}
                        >
                            {line}
                        </code>
                    ))}
                </pre>
            </div>
            <div className="transform-diff__side">
                <h4 className="transform-diff__title">
                    {'after'}
                </h4>
                <pre className="transform-diff__code transform-diff__code--after">
                    {linesOf(after).map((line, index) => (
                        <code
                            className="transform-diff__line"
                            key={index}
                        >
                            {line}
                        </code>
                    ))}
                </pre>
            </div>
        </div>
    );
}
