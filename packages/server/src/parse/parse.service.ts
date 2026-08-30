import {parse} from '@babel/parser';
import {tryToCatch} from 'try-to-catch';
import {
    Inject,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import type {
    Snippet,
    SnippetRevision,
    ParseDocumentation,
} from './parse.types.ts';

@Injectable()
export class ParseService {
    constructor(
        @Inject('SNIPPETS') private readonly snippets: Map<string, Snippet>,
        @Inject('SNIPPET_REVISIONS') private readonly snippetRevisions: Map<string, SnippetRevision>,
    ) {}
    
    documentation(): ParseDocumentation {
        return {
            description: 'Parse JavaScript/TypeScript source code with Babel and return its AST.',
            method: 'PUT',
            url: '/api/v1/parse',
            contentType: 'text/javascript',
            body: 'const x = foo.bar(42);',
            response: {
                type: 'File',
                start: 0,
                end: 22,
                program: {
                    type: 'Program',
                    body: [],
                },
            },
            errors: {
                422: 'Source code could not be parsed — syntax error',
            },
        };
    }
    
    async parseSource(source: string) {
        const [error, ast] = await tryToCatch(parse, source, {
            sourceType: 'module',
            strictMode: false,
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
            plugins: [
                'jsx',
                'typescript',
                'importMeta',
            ],
        });
        
        if (error)
            throw new UnprocessableEntityException(error.message);
        
        return ast;
    }
    
    async load(snippetId: string, revisionId: string) {
        const snippet = this.snippets.get(snippetId);
        
        if (!snippet)
            throw new NotFoundException('Not found');
        
        let revisionIndex = Number(revisionId);
        
        if (revisionId === 'latest')
            revisionIndex = snippet.revisions.length - 1;
        
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
