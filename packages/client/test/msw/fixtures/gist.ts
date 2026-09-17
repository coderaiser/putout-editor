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
    code?: string;
    noConfig?: boolean;
}

type GistFile = {
    content: string;
};

export type GistResponse = {
    id: string;
    history: {
        version: string;
    }[];
    files: Record<string, GistFile>;
};

export function makeGistResponse(overrides: GistFixture = {}): GistResponse {
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
        code,
        noConfig = false,
    } = overrides;
    
    const files: Record<string, GistFile> = {
        'source.js': {
            content: sourceCode,
        },
    };
    
    if (!noConfig)
        files['astexplorer.json'] = {
            content: JSON.stringify({
                parserID,
                toolID,
                v,
                settings,
            }),
        };
    
    if (!isUndefined(transformCode))
        files['transform.js'] = {
            content: transformCode,
        };
    
    if (!isUndefined(code)) {
        delete files['source.js'];
        files['code.js'] = {
            content: code,
        };
    }
    
    return {
        id,
        history: [{
            version,
        }],
        files,
    };
}
