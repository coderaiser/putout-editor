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
