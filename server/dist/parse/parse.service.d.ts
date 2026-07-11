export declare class ParseService {
    private readonly snippets;
    private readonly snippetRevisions;
    constructor(snippets: Map<string, any>, snippetRevisions: Map<string, any>);
    load(snippetId: string, revisionId: string): Promise<any>;
}
