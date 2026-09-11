export interface SourcePosition {
    line: number;
    ch: number;
}

/**
 * Minimal structural shape of a `source-map` `SourceMapConsumer` that
 * `resolvePositionFromIndex` relies on, plus the fields tests mock directly.
 * Typed loosely so test mock factories can satisfy it without a full consumer.
 */
export interface SourceMapLike {
    sourcesContent: string[];
    sources: string[];
    generatedPositionFor(position: {
        line: number;
        column: number;
        source: string;
    }): {
        line: number | null;
        column: number | null;
    };
}

export default function resolvePositionFromIndex(sourceMap: SourceMapLike | null | undefined, index: number): SourcePosition | undefined {
    if (!sourceMap)
        return undefined;
    
    if (!index)
        return {
            line: 0,
            ch: 0,
        };
    
    const [sourceContent] = sourceMap.sourcesContent;
    let lineStart = sourceContent.lastIndexOf('\n', index - 1);
    let column: number | null = index - lineStart - 1;
    let line: number | null = 1;
    
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
