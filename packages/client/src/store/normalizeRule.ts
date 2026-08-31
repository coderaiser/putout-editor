export function normalizeRule(code: string): string {
    const lines = code.split('\n');
    
    if (lines.length < 2)
        return code;
    
    const [first, second] = lines;
    
    if (!first.startsWith('//'))
        return code;
    
    if (second === '')
        return code;
    
    lines.splice(1, 0, '');
    
    return lines.join('\n');
}
