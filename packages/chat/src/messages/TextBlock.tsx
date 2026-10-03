export interface TextBlockProps {
    data: string;
}

/**
 * Markdown-lite, and only markdown-lite: `**bold**` and `` `code` `` and a
 * fenced block, which is the whole of the plan's §1.1. Each line is transformed
 * on its own so a fenced block cannot swallow the lines after it, and a line
 * that opens a fence stays literal.
 */
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const inline = (text: string) => text
    .split(INLINE)
    .map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**'))
            return (
                <strong key={index}>{part.slice(2, -2)}</strong>
            );
        
        if (part.startsWith('`') && part.endsWith('`'))
            return (
                <code key={index}>{part.slice(1, -1)}</code>
            );
        
        return part;
    });

export default function TextBlock({data}: TextBlockProps) {
    const lines = data.split('\n');
    const out = [];
    let fence = false;
    
    for (const [index, line] of lines.entries()) {
        const key = index;
        
        if (line.startsWith('```')) {
            fence = !fence;
            
            out.push(
                <code
                    className="text-block__fence"
                    key={key}
                >
                    {line.slice(3)}
                </code>,
            );
            
            continue;
        }
        
        if (fence) {
            out.push(
                <code
                    className="text-block__fence"
                    key={key}
                >
                    {line}
                </code>,
            );
            
            continue;
        }
        
        out.push(
            <p
                className="text-block__line"
                key={key}
            >
                {inline(line)}
            </p>,
        );
    }
    
    return (
        <div
            className="text-block"
            data-testid="text-block"
        >
            {out}
        </div>
    );
}
