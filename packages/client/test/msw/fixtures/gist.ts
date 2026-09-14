const isUndefined = (a: unknown): a is undefined => typeof a === 'undefined';

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

export function makeGistResponse(overrides = {}) {
    const {
        id = 'gist-id',
        version = 'sha1',
        parserID = 'babel',
        toolID = null,
        v = 2,
        settings = {
            babel: {},
        },
        sourceCode = 'const x = 1;',
        transformCode,
    }: GistFixture = overrides;
    
    const files: Record<string, {content: string}> = {
        'astexplorer.json': {
            content: JSON.stringify({
                parserID,
                toolID,
                v,
                settings,
            }),
        },
        'source.js': {
            content: sourceCode,
        },
    };
    
    if (!isUndefined(transformCode))
        files['transform.js'] = {
            content: transformCode,
        };
    
    return {
        id,
        history: [{
            version,
        }],
        files,
    };
}
