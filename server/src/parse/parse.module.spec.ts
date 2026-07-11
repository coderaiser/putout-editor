import {
    mkdtempSync,
    writeFileSync,
    realpathSync,
} from 'node:fs';
import {resolve} from 'node:path';
import process from 'node:process';
import {Test} from '@nestjs/testing';
import {test} from 'supertape';
import {ParseModule} from './parse.module.ts';

test('parse module: prepares data from SNIPPET_FILE and REVISION_FILE', async (t) => {
    const tmp = realpathSync(mkdtempSync('/tmp/parse-module-'));
    
    const snippetsJson = resolve(tmp, 'snippets.json');
    const revisionsJson = resolve(tmp, 'revisions.json');
    
    writeFileSync(snippetsJson, JSON.stringify([{
        _id: 's1',
        revisions: [{
            objectId: 'r1',
        }],
    }]));
    
    writeFileSync(revisionsJson, JSON.stringify([{
        _id: 'r1',
        content: 'hello',
    }]));
    
    const prevSnippet = process.env.SNIPPET_FILE;
    const prevRevision = process.env.REVISION_FILE;
    
    process.env.SNIPPET_FILE = snippetsJson;
    process.env.REVISION_FILE = revisionsJson;
    
    const module = await Test
        .createTestingModule({
            imports: [ParseModule],
        })
        .compile();
    
    const snippets = module.get('SNIPPETS') as Map<string, unknown>;
    
    t.equal(snippets.size, 1);
    t.end();
    
    // Cleanup
    if (prevSnippet)
        process.env.SNIPPET_FILE = prevSnippet;
    else
        delete process.env.SNIPPET_FILE;
    
    if (prevRevision) {
        process.env.REVISION_FILE = prevRevision;
        return;
    }
    
    delete process.env.REVISION_FILE;
});

test('parse module: when env vars are not set, fallbacks to empty Maps', async (t) => {
    const prevSnippet = process.env.SNIPPET_FILE;
    const prevRevision = process.env.REVISION_FILE;
    
    delete process.env.SNIPPET_FILE;
    delete process.env.REVISION_FILE;
    
    const module = await Test
        .createTestingModule({
            imports: [ParseModule],
        })
        .compile();
    
    const snippets = module.get('SNIPPETS') as Map<string, unknown>;
    
    if (prevSnippet)
        process.env.SNIPPET_FILE = prevSnippet;
    
    if (prevRevision)
        process.env.REVISION_FILE = prevRevision;
    
    t.equal(snippets.size, 0);
    t.end();
});
