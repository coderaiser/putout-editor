import {test, stub} from 'supertape';
import {GithubService} from './github.service.ts';

test('github.service: exists and wraps GitHub client', async (t) => {
    const mockOctokit = {
        rest: {
            gists: {
                get: stub().resolves({
                    data: {
                        id: '123',
                    },
                }),
                create: stub().resolves({
                    data: {
                        id: '456',
                    },
                }),
                update: stub().resolves({
                    data: {
                        id: '789',
                    },
                }),
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    t.ok(service);
    t.end();
});

test('github.service: load(): "latest" revision does not pass sha to octokit', async (t) => {
    const get = stub().resolves({
        data: {
            id: '123',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                get,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    await service.load('123', 'latest');
    
    t.calledWith(get, [{gist_id: '123'}]);
    t.end();
});

test('github.service: load(): explicit revision passes sha to octokit', async (t) => {
    const get = stub().resolves({
        data: {
            id: '123',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                get,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    await service.load('123', 'deadbeef');
    
    t.calledWith(get, [{gist_id: '123', sha: 'deadbeef'}]);
    t.end();
});

test('github.service: create() calls octokit with payload', async (t) => {
    const create = stub().resolves({
        data: {
            id: '456',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                create,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    const payload = {
        files: {
            'test.js': {
                content: 'const a = 1;',
            },
        },
    };
    
    await service.create(payload);
    
    t.calledWith(create, [payload]);
    t.end();
});

test('github.service: create() returns response.data', async (t) => {
    const create = stub().resolves({
        data: {
            id: '456',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                create,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    const payload = {
        files: {
            'test.js': {
                content: 'const a = 1;',
            },
        },
    };
    
    const result = await service.create(payload);
    
    t.equal(result.id, '456');
    t.end();
});

test('github.service: update() calls octokit with gist_id and payload', async (t) => {
    const update = stub().resolves({
        data: {
            id: '789',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                update,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    const payload = {
        files: {
            'test.js': {
                content: 'updated',
            },
        },
    };
    
    await service.update('gist789', payload);
    const args = [{
        gist_id: 'gist789',
        ...payload,
    }];
    
    t.calledWith(update, args);
    t.end();
});

test('github.service: update() returns response.data', async (t) => {
    const update = stub().resolves({
        data: {
            id: '789',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                update,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    const payload = {
        files: {
            'test.js': {
                content: 'updated',
            },
        },
    };
    
    const result = await service.update('gist789', payload);
    
    t.equal(result.id, '789');
    t.end();
});

test('github.service: update() with null file value passes null to octokit', async (t) => {
    const update = stub().resolves({
        data: {
            id: '789',
        },
    });
    
    const mockOctokit = {
        rest: {
            gists: {
                update,
            },
        },
    };
    
    const service = await createGithubService(mockOctokit);
    
    const payload = {
        files: {
            'transform.js': null,
        },
    };
    
    await service.update('gist789', payload);
    const args = [{
        gist_id: 'gist789',
        ...payload,
    }];
    
    t.calledWith(update, args);
    t.end();
});

async function createGithubService(mockOctokit: unknown) {
    const {Test} = await import('@nestjs/testing');
    
    const module = await Test
        .createTestingModule({
            providers: [
                GithubService, {
                    provide: 'OCTOKIT',
                    useValue: mockOctokit,
                },
            ],
        })
        .compile();
    
    return module.get(GithubService);
}
