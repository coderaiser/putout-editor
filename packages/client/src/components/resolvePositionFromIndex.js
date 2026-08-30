export default function resolvePositionFromIndex(sourceMap, index) {
    if (!sourceMap)
        return undefined;
    
    if (!index)
        return {
            line: 0,
            ch: 0,
        };
    
    const [sourceContent] = sourceMap.sourcesContent;
    let lineStart = sourceContent.lastIndexOf('\n', index - 1);
    let column = index - lineStart - 1;
    let line = 1;
    
    while (lineStart > 0) {
        lineStart = sourceContent.lastIndexOf('\n', lineStart - 1);
        line++;
    }
    
    if (!lineStart)
        line++;
    
    ({
        line,
        column,
    } = sourceMap.generatedPositionFor({
        line,
        column,
        source: sourceMap.sources[0],
    }));
    
    if (line === null || column === null)
        return undefined;
    
    return {
        line: line - 1,
        ch: column,
    };
}
