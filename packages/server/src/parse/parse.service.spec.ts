import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {ParseService} from './parse.service.ts';
import type {
    Snippet,
    SnippetRevision,
} from './parse.types.ts';

async function createService(snippets: Map<string, Snippet>, revisions: Map<string, SnippetRevision>) {
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: revisions,
                },
            ],
        })
        .compile();
    
    return module.get(ParseService);
}

test('parse service: returns latest revision', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev1',
        }, {
            objectId: 'rev2',
        }],
    });
    
    snippetRevisions.set('rev2', {
        _id: 'rev2',
        content: 'latest content',
    });
    
    const service = await createService(snippets, snippetRevisions);
    const result = await service.load('snippet1', 'latest');
    
    t.equal(result.revisionID, 1);
    t.end();
});

test('parse service: returns selected revision', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }, {
            objectId: 'rev1',
        }],
    });
    
    snippetRevisions.set('rev1', {
        _id: 'rev1',
        content: 'selected content',
    });
    
    const service = await createService(snippets, snippetRevisions);
    const result = await service.load('snippet1', '1');
    
    t.equal(result.revisionID, 1);
    t.end();
});

test('parse service: missing snippet', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    const service = await createService(snippets, snippetRevisions);
    const [e] = await tryToCatch(service.load.bind(service), 'nonexistent', 'latest');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: missing revision', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    const service = await createService(snippets, snippetRevisions);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', '5');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: non-numeric revision id does not throw a raw TypeError', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    const service = await createService(snippets, snippetRevisions);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', 'garbage');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: revision id valid but revision data missing from map', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    // rev0 is NOT in snippetRevisions
    const service = await createService(snippets, snippetRevisions);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', '0');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: documentation returns object with method PUT', (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = service.documentation();
    
    t.equal(result.method, 'PUT');
    t.end();
});

test('parse service: documentation returns object with correct url', (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = service.documentation();
    
    t.equal(result.url, '/api/v1/parse');
    t.end();
});

test('parse service: documentation returns application/json contentType', async (t) => {
    const service = await createService(new Map(), new Map());
    const docs = service.documentation();
    
    t.equal(docs.contentType, 'application/json');
    t.end();
});

test('parse service: documentation body is valid JSON with source field', async (t) => {
    const service = await createService(new Map(), new Map());
    const docs = service.documentation();
    const parsed = JSON.parse(docs.body);
    
    t.ok(Object.hasOwn(parsed, 'source'));
    t.end();
});

test('parse service: parseSource returns File node for valid source', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('const x = 1;') as Record<string, unknown>;
    
    t.equal(result.type, 'File');
    t.end();
});

test('parse service: parseSource returns program body for valid source', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('const x = 1;') as {
        program: {
            body: unknown;
        };
    };
    
    t.ok(Array.isArray(result.program.body));
    t.end();
});

test('parse service: parseSource throws UnprocessableEntityException for invalid source', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const [error] = await tryToCatch(service.parseSource.bind(service), 'const = 1');
    
    t.equal((error as Error & {
        status: number;
    }).status, 422);
    t.end();
});

test('parse service: parseSource handles TypeScript source', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('const x: number = 1;') as Record<string, unknown>;
    
    t.equal(result.type, 'File');
    t.end();
});

test('parse service: parseSource handles JSX source', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('const element = <div />;') as Record<string, unknown>;
    
    t.equal(result.type, 'File');
    t.end();
});

test('parse service: parseSource with compact=true returns smaller result', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const source = 'const x = 1;\nvar y = foo();\nlet z = "hello";';
    const full = await service.parseSource(source);
    
    const compact = await service.parseSource(source, {
        compact: true,
    });
    
    t.ok(JSON.stringify(compact).length < JSON.stringify(full).length);
    t.end();
});

test('parse service: parseSource with compact=true has no loc', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const compact = await service.parseSource('const x = 1;', {
        compact: true,
    }) as Record<string, unknown>;
    
    t.notOk(compact.loc);
    t.end();
});

test('parse service: parseSource with query returns array', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('var x = 1;', {
        query: 'VariableDeclaration',
    });
    
    t.ok(Array.isArray(result));
    t.end();
});

test('parse service: parseSource with query returns matches', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('var x = 1;\nvar y = 2;', {
        query: 'VariableDeclaration',
    }) as unknown[];
    
    t.equal(result.length, 2);
    t.end();
});

test('parse service: parseSource with no options returns full AST', async (t) => {
    const service = new ParseService(new Map(), new Map());
    const result = await service.parseSource('const x = 1;') as Record<string, unknown>;
    
    t.equal(result.type, 'File');
    t.end();
});
