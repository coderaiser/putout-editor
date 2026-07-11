import {Module} from '@nestjs/common';
import {Octokit} from '@octokit/rest';
import {GistController} from './gist.controller.ts';
import {GistService} from './gist.service.ts';
import {GithubService} from './github.service.ts';
import {AUTH_TOKEN} from '../constants.ts';

export @Module({
    controllers: [GistController],
    providers: [
        GistService,
        GithubService, {
            provide: 'OCTOKIT',
            useFactory: () => new Octokit({
                auth: AUTH_TOKEN,
            }),
        },
    ],
    exports: [],
})
class GistModule {}
