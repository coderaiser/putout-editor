import {Test} from '@nestjs/testing';
import {GithubService} from '../src/gist/github.service.js';
import {test, stub} from 'supertape';

test('github.service: exists and wraps GitHub client', async (t) => {
    const mockOctokit = {
        rest: {
            gists: {
                get: stub().resolves({data: {id: '123'}}),
                create: stub().resolves({data: {id: '456'}}),
                update: stub().resolves({data: {id: '789'}}),
            },
        },
    };
    
    const module = await Test.createTestingModule({
        providers: [
            GithubService,
            {
                provide: 'OCTOKIT',
                useValue: mockOctokit,
            },
        ],
    }).compile();
    
    const service = module.get(GithubService);
    
    t.ok(service);
    t.end();
});
