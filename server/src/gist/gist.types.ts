export type GistFileContent = {
    content: string;
};

export type GistFiles = Record<string, GistFileContent | null>;

export type GistPayload = {
    files: GistFiles;
    description?: string;
    public?: boolean;
};

export type GistBody = {
    parserID: string;
    toolID?: string;
    settings?: Record<string, unknown>;
    versions?: Record<string, string>;
    filename: string;
    code: string;
    
    // null explicitly means "delete the transform file", per the client's
    // storage contract (see client/src/storage/gist.js)
    transform?: string | null;
    description?: string;
    public?: boolean;
};
