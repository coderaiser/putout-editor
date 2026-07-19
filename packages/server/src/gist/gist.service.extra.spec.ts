import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {GistService} from './gist.service.ts';
import {GithubService} from './github.service.ts';
import type {UpdateGistPayload} from './gist.types.ts';

async function createService(mockGithub: Record<string, unknown>) {
    const module = await Test
        .createTestingModule({
            providers: [
                GistService, {
                    provide: GithubService,
                    useValue: mockGithub,
                },
            ],
        })
        .compile();
    
    return module.get(GistService);
}

const body = {
    parserID: 'babel',
    toolID: 'putout',
    settings: {
        babel: {},
    },
    versions: {
        babel: '1.0.0',
    },
    filename: 'source.js',
    code: 'const a = 1;',
    description: 'a snippet',
    public: true,
};

test('gist service: update() includes transform.js when transform is a string', async (t) => {
    const mockGithub = {
        update: stub().resolves({
            id: 'gist789',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.update('gist789', {
        ...body,
        transform: 'module.exports = () => {};',
    });
    
    const [, payload] = mockGithub.update.args[0] as [string, UpdateGistPayload];
    
    t.equal(payload.files?.['transform.js']?.content, 'module.exports = () => {};');
    t.end();
});

test('gist service: update() omits transform.js when transform is undefined', async (t) => {
    const mockGithub = {
        update: stub().resolves({
            id: 'gist789',
        }),
    };
    
    const service = await createService(mockGithub);
    
    // body has no transform property — undefined branch
    await service.update('gist789', body);
    
    const [, payload] = mockGithub.update.args[0] as [string, UpdateGistPayload];
    
    t.notOk(payload.files?.['transform.js']);
    t.end();
});

test('gist service: load() without revisionId', async (t) => {
    const mockGithub = {
        load: stub().resolves({
            id: 'gist123',
            files: {},
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.load('gist123');
    
    t.calledWith(mockGithub.load, ['gist123', undefined]);
    t.end();
});
