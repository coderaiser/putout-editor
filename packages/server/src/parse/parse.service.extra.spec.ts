import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {tryToCatch} from 'try-to-catch';
import {ParseService} from './parse.service.ts';
import type {Snippet, SnippetRevision} from './parse.types.ts';

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

test('parse service: revisionId equal to revisions.length throws Not found', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();

    snippets.set('snippet1', {
        _id: 'snippet1',
        revisions: [{objectId: 'rev0'}],
    });

    // revisions.length is 1, so index 1 is out of bounds (>= length)
    const service = await createService(snippets, snippetRevisions);
    const [e] = await tryToCatch(service.load.bind(service), 'snippet1', '1');

    t.equal(e!.message, 'Not found');
    t.end();
});

test('parse service: load returns snippetID from snippet._id', async (t) => {
    const snippets = new Map<string, Snippet>();
    const snippetRevisions = new Map<string, SnippetRevision>();

    snippets.set('s1', {
        _id: 's1',
        revisions: [{objectId: 'r0'}],
    });

    snippetRevisions.set('r0', {
        _id: 'r0',
        content: 'hello',
    });

    const service = await createService(snippets, snippetRevisions);
    const result = await service.load('s1', '0');

    // The returned object should not include _id from revision
    t.notOk('_id' in result);
    t.equal(result.snippetID, 's1');
    t.end();
});
