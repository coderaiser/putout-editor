import {parse} from '@babel/parser';
import {tryToCatch} from 'try-to-catch';
import {
    Inject,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import {compactAST} from './compact.ts';
import {queryAST} from './query.ts';
import type {
    Snippet,
    SnippetRevision,
    ParseDocumentation,
    ParseOptions,
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
            contentType: 'application/json',
            body: JSON.stringify({source: 'const x = foo.bar(42);'}),
            queryParams: {
                compact: 'boolean (default: false) — strip loc, tokens, comments, extra from AST. Reduces response size by ~60%.',
                query: 'string — comma-separated Babel node types to search for, e.g. ?query=VariableDeclaration,Identifier. Returns only matching node positions. Implies compact=true.',
            },
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
            examples: [{
                name: 'full AST',
                url: 'PUT /api/v1/parse',
            }, {
                name: 'compact AST',
                url: 'PUT /api/v1/parse?compact=true',
            }, {
                name: 'find all var declarations',
                url: 'PUT /api/v1/parse?query=VariableDeclaration',
            }, {
                name: 'find multiple node types',
                url: 'PUT /api/v1/parse?query=VariableDeclaration,FunctionDeclaration',
            }],
        };
    }
    
    async parseSource(source: string, options: ParseOptions = {}): Promise<unknown> {
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
        
        if (options.query)
            return queryAST(ast, options.query);
        
        if (options.compact)
            return compactAST(ast);
        
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
