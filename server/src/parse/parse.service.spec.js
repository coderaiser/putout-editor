import {Test} from '@nestjs/testing';
import {ParseService} from './parse.service.js';
import {test, stub} from 'supertape';

test('parse service: returns latest revision', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{objectId: 'rev1'}, {objectId: 'rev2'}],
    });
    
    snippetRevisions.set('rev2', {
        _id: 'rev2',
        content: 'latest content',
    });
    
    const module = await Test.createTestingModule({
        providers: [
            ParseService,
            {
                provide: 'SNIPPETS',
                useValue: snippets,
            },
            {
                provide: 'SNIPPET_REVISIONS',
                useValue: snippetRevisions,
            },
        ],
    }).compile();
    
    const service = module.get(ParseService);
    const result = await service.load('snippet1', 'latest');
    
    t.equal(result.revisionID, 1);
    t.end();
});

test('parse service: returns selected revision', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{objectId: 'rev0'}, {objectId: 'rev1'}],
    });
    
    snippetRevisions.set('rev1', {
        _id: 'rev1',
        content: 'selected content',
    });
    
    const module = await Test.createTestingModule({
        providers: [
            ParseService,
            {
                provide: 'SNIPPETS',
                useValue: snippets,
            },
            {
                provide: 'SNIPPET_REVISIONS',
                useValue: snippetRevisions,
            },
        ],
    }).compile();
    
    const service = module.get(ParseService);
    const result = await service.load('snippet1', '1');
    
    t.equal(result.revisionID, 1);
    t.end();
});

test('parse service: missing snippet', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    const module = await Test.createTestingModule({
        providers: [
            ParseService,
            {
                provide: 'SNIPPETS',
                useValue: snippets,
            },
            {
                provide: 'SNIPPET_REVISIONS',
                useValue: snippetRevisions,
            },
        ],
    }).compile();
    
    const service = module.get(ParseService);
    
    try {
        await service.load('nonexistent', 'latest');
        t.fail('should have thrown');
    } catch (e) {
        t.equal(e.message, 'Not found');
    }
    
    t.end();
});

test('parse service: missing revision', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{objectId: 'rev0'}],
    });
    
    const module = await Test.createTestingModule({
        providers: [
            ParseService,
            {
                provide: 'SNIPPETS',
                useValue: snippets,
            },
            {
                provide: 'SNIPPET_REVISIONS',
                useValue: snippetRevisions,
            },
        ],
    }).compile();
    
    const service = module.get(ParseService);
    
    try {
        await service.load('snippet1', '5');
        t.fail('should have thrown');
    } catch (e) {
        t.equal(e.message, 'Not found');
    }
    
    t.end();
});
