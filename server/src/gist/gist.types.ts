export type CreateGistFileContent = {
    content: string;
};

export type UpdateGistFileContent = {
    content?: string;
    filename?: string | null;
};

export type CreateGistFiles = Record<string, CreateGistFileContent>;

export type UpdateGistFiles = Record<string, UpdateGistFileContent | null>;

export type CreateGistPayload = {
    files: CreateGistFiles;
    description?: string;
    public?: boolean;
};

export type UpdateGistPayload = {
    files?: UpdateGistFiles;
    description?: string;
};

export type GistBody = {
    parserID: string;
    toolID?: string;
    settings?: Record<string, unknown>;
    versions?: Record<string, string>;
    filename: string;
    code: string;
    transform?: string | null;
    description?: string;
    public?: boolean;
};
