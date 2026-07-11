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

