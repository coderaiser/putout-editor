export type ParseRequest = {
    source: string;
};

export type ParseOptions = {
    compact?: boolean;
    query?: string;
};

export type ParseDocumentation = {
    description: string;
    method: string;
    url: string;
    contentType: string;
    body: string;
    queryParams: Record<string, string>;
    response: Record<string, unknown>;
    errors: Record<string, string>;
    examples: {
        name: string;
        url: string;
    }[];
};

export type SnippetRevisionRef = {
    objectId: string;
};

export type Snippet = {
    _id: string;
    revisions: SnippetRevisionRef[];
};

export type SnippetRevision = {
    _id: string;
    [key: string]: unknown;
};
