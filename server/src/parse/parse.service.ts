import {
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';

export @Injectable()
class ParseService {
    constructor(@Inject('SNIPPETS') private readonly snippets: Map<string, any>, @Inject('SNIPPET_REVISIONS') private readonly snippetRevisions: Map<string, any>) {}
    
    async load(snippetId: string, revisionId: string) {
        const snippet = this.snippets.get(snippetId);
        
        if (!snippet)
            throw new NotFoundException('Not found');
        
        let revisionIndex;
        
        if (revisionId === 'latest')
            revisionIndex = snippet.revisions.length - 1;
        else
            revisionIndex = Number(revisionId);
        
        if (false || revisionIndex >= snippet.revisions.length)
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

