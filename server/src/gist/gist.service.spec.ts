import {Test} from '@nestjs/testing';
import {test, stub} from 'supertape';
import {GistService} from './gist.service.ts';
import {GithubService} from './github.service.ts';

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

test('gist service: load', async (t) => {
    const mockGithub = {
        load: stub().resolves({
            id: 'gist123',
            files: {},
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.load('gist123', 'rev1');
    
    t.calledWith(mockGithub.load, ['gist123', 'rev1']);
    t.end();
});

test('gist service: create() writes the source file under its filename', async (t) => {
    const mockGithub = {
        create: stub().resolves({
            id: 'gist456',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.create(body);
    
    const [payload] = mockGithub.create.args[0] as [
        {
            files: Record<string, {content: string}>;
        },
    ];
    
    t.equal(payload.files['source.js'].content, 'const a = 1;');
    t.end();
});

test('gist service: create() embeds parserID/toolID in astexplorer.json', async (t) => {
    const mockGithub = {
        create: stub().resolves({
            id: 'gist456',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.create(body);
    
    const [payload] = mockGithub.create.args[0] as [
        {
            files: Record<string, {content: string}>;
        },
    ];
    
    const meta = JSON.parse(payload.files['astexplorer.json'].content);
    
    t.equal(meta.parserID, 'babel');
    t.end();
});

test('gist service: create() omits transform.js when no transform is set', async (t) => {
    const mockGithub = {
        create: stub().resolves({
            id: 'gist456',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.create(body);
    
    const [payload] = mockGithub.create.args[0] as [
        {
            files: Record<string, {content: string}>;
        },
    ];
    
    t.notOk('transform.js' in payload.files);
    t.end();
});

test('gist service: create() includes transform.js when a transform is set', async (t) => {
    const mockGithub = {
        create: stub().resolves({
            id: 'gist456',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.create({
        ...body,
        transform: 'module.exports = () => {};',
    });
    
    const [payload] = mockGithub.create.args[0] as [
        {
            files: Record<string, {content: string}>;
        },
    ];
    
    t.equal(payload.files['transform.js'].content, 'module.exports = () => {};');
    t.end();
});

test('gist service: update() deletes transform.js via null', async (t) => {
    const mockGithub = {
        update: stub().resolves({
            id: 'gist789',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.update('gist789', {
        ...body,
        transform: null,
    });
    
    const [, payload] = mockGithub.update.args[0] as [string, {
        files: Record<string, unknown>;
    }];
    
    t.notOk(payload.files['transform.js']);
    t.end();
});

test('gist service: fork() creates a new gist via githubService.create', async (t) => {
    const mockGithub = {
        create: stub().resolves({
            id: 'forked123',
        }),
    };
    
    const service = await createService(mockGithub);
    
    await service.fork(body);
    
    t.ok(mockGithub.create.called);
    t.end();
});
