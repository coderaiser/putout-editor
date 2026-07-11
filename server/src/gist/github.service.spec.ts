import {Test} from '@nestjs/testing';
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
    
    const service = module.get(GithubService);
    
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
    
    const service = module.get(GithubService);
    await service.load('123', 'latest');
    
    const [call] = get.args as [{sha?: string}][];
    
    t.notOk('sha' in call[0]);
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
    
    const service = module.get(GithubService);
    await service.load('123', 'deadbeef');
    
    const [call] = get.args as [{sha?: string}][];
    
    t.equal(call[0].sha, 'deadbeef');
    t.end();
});

