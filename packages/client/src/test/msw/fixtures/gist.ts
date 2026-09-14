export interface GistFixture {
    id?: string;
    version?: string;
    parserID?: string;
    toolID?: string | null;
    v?: number;
    settings?: Record<string, unknown>;
    sourceCode?: string;
    transformCode?: string;
}

export function makeGistResponse({
    id = 'gist-id',
    version = 'sha1',
    parserID = 'babel',
    toolID = null,
    v = 2,
    settings = {babel: {}},
    sourceCode = 'const x = 1;',
    transformCode,
}: GistFixture = {}) {
    const files: Record<string, {content: string}> = {
        'astexplorer.json': {
            content: JSON.stringify({parserID, toolID, v, settings}),
        },
        'source.js': {content: sourceCode},
    };
    
    if (transformCode !== undefined)
        files['transform.js'] = {content: transformCode};
    
    return {
        id,
        history: [{version}],
        files,
    };
}
