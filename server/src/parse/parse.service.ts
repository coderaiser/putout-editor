import {
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import type {
    Snippet,
    SnippetRevision,
} from './parse.types.ts';

@Injectable()
export class ParseService {
    constructor(
        @Inject('SNIPPETS') private readonly snippets: Map,
        @Inject('SNIPPET_REVISIONS') private readonly snippetRevisions: Map,
    ) {}
    
    load(snippetId: string, revisionId: string) {
        const snippet = this.snippets.get(snippetId);
        
        if (!snippet)
            throw new NotFoundException('Not found');
        
        const revisionIndex = revisionId === 'latest' ? snippet.revisions.length - 1 : Number(revisionId);
        
        if (Number.isNaN(revisionIndex) || revisionIndex >= snippet.revisions.length)
            throw new NotFoundException('Not found');
        
        const revision = this.snippetRevisions.get(snippet.revisions[revisionIndex].objectId);
        
        if (!revision)
            throw new NotFoundException('Not found');
        
        const {_id, ...rest} = revision;
        
        return {
            revisionID: revisionIndex,
            snippetID: snippet._id,
            ...rest,
        };
    }
}
