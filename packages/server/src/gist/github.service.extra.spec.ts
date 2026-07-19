import {test, stub} from 'supertape';
import {GithubService} from './github.service.ts';

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

test('github.service: load(): no revisionId (undefined) does not pass sha', async (t) => {
    const get = stub().resolves({
        data: {
            id: '123',
        },
    });
    
    const service = await createGithubService({
        rest: {
            gists: {
                get,
            },
        },
    });
    
    await service.load('123');
    const args = [{
        gist_id: '123',
    }];
    
    t.calledWith(get, args);
    t.end();
});

test('github.service: load(): empty string revisionId treated as latest', async (t) => {
    const get = stub().resolves({
        data: {
            id: '123',
        },
    });
    
    const service = await createGithubService({
        rest: {
            gists: {
                get,
            },
        },
    });
    
    await service.load('123', '');
    const args = [{
        gist_id: '123',
    }];
    
    t.calledWith(get, args);
    t.end();
});
