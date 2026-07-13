import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {ParseService} from './parse.service.ts';

test('parse service: returns latest revision', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
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
    
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
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
    
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
    const service = module.get(ParseService);
    const result = await service.load('snippet1', '1');
    
    t.equal(result.revisionID, 1);
    t.end();
});

test('parse service: missing snippet', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
    const service = module.get(ParseService);
    const [e] = await tryToCatch(service.load.bind(service), 'nonexistent', 'latest');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: missing revision', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
    const service = module.get(ParseService);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', '5');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: non-numeric revision id does not throw a raw TypeError', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
    const service = module.get(ParseService);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', 'garbage');
    
    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: revision id valid but revision data missing from map', async (t) => {
    const snippets = new Map();
    const snippetRevisions = new Map();
    
    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{
            objectId: 'rev0',
        }],
    });
    
    // rev0 is NOT in snippetRevisions
    const module = await Test
        .createTestingModule({
            providers: [
                ParseService, {
                    provide: 'SNIPPETS',
                    useValue: snippets,
                }, {
                    provide: 'SNIPPET_REVISIONS',
                    useValue: snippetRevisions,
                },
            ],
        })
        .compile();
    
    const service = module.get(ParseService);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', '0');
    
    t.equal(e!.message, 'Not found');
    t.end();
});
